"""
Master orchestrator — fetches HN + Reddit posts in parallel, scores them,
and writes results to Supabase.

Run standalone: python agents/run_all.py
Import:         from agents.run_all import run_all
"""
import os
import sys
import difflib
import concurrent.futures
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"),
    override=True,
)
os.environ.pop("OPENAI_BASE_URL", None)

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from supabase import create_client

from agents.hn_agent import fetch_hn_posts
from agents.reddit_agent_json import fetch_reddit_posts as fetch_reddit_posts_json
from agents.trends_agent import fetch_trends_posts
from agents.scorer_agent import grade_posts


def _get_supabase():
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in apps/api/.env")
    return create_client(url, key)


def run_all(job_id: str = None):
    db  = _get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # ── STEP 2 — create crawl_job (or reuse one already created by the API) ───
    if job_id is None:
        job_resp = db.table("crawl_jobs").insert({
            "status":         "running",
            "started_at":     now,
            "sources":        ["reddit", "hn", "google_trends"],
            "posts_scanned":  0,
            "posts_filtered": 0,
            "ideas_new":      0,
            "ideas_updated":  0,
        }).execute()
        crawl_job_id = job_resp.data[0]["id"]
        print(f"[run_all] Crawl job created: {crawl_job_id}")
    else:
        crawl_job_id = job_id
        print(f"[run_all] Using existing crawl job: {crawl_job_id}")

    # ── STEP 3 — clean up orphaned running jobs ───────────────────────────────
    cutoff_30m = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
    orphans = (
        db.table("crawl_jobs")
          .select("id")
          .eq("status", "running")
          .lt("started_at", cutoff_30m)
          .neq("id", crawl_job_id)
          .execute()
    )
    if orphans.data:
        for row in orphans.data:
            db.table("crawl_jobs").update({
                "status":        "failed",
                "error_message": "orphaned — process died",
            }).eq("id", row["id"]).execute()
        print(f"[run_all] Cleaned up {len(orphans.data)} orphaned job(s)")
    else:
        print("[run_all] No orphaned jobs found")

    # initialise summary vars so they're accessible in the final summary
    # even if an early step fails
    hn_posts      = []
    reddit_posts  = []
    trends_posts  = []
    merged        = []
    skipped       = 0
    new_posts     = []
    graded        = []
    ideas_new     = 0
    ideas_updated = 0

    try:
        # ── STEP 4 — fetch all sources in parallel ────────────────────────────
        def _fetch_hn():
            try:
                return fetch_hn_posts()
            except BaseException as e:
                print(f"[run_all] WARNING -- HN fetch failed: {e}")
                return []

        def _fetch_reddit():
            try:
                return fetch_reddit_posts_json()
            except BaseException as e:
                print(f"[run_all] WARNING -- Reddit JSON agent failed: {e} — continuing with HN only")
                return []

        def _fetch_trends():
            try:
                return fetch_trends_posts()
            except BaseException as e:
                print(f"[run_all] WARNING -- Trends fetch failed: {e}")
                return []

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
            hn_fut      = ex.submit(_fetch_hn)
            reddit_fut  = ex.submit(_fetch_reddit)
            trends_fut  = ex.submit(_fetch_trends)
            hn_posts     = hn_fut.result()
            reddit_posts = reddit_fut.result()
            trends_posts = trends_fut.result()

        print(f"[run_all] HN returned {len(hn_posts)} posts, "
              f"Reddit returned {len(reddit_posts)} posts, "
              f"Trends returned {len(trends_posts)} posts")

        actual_sources = (
            (["hn"]            if hn_posts     else []) +
            (["reddit"]        if reddit_posts else []) +
            (["google_trends"] if trends_posts else [])
        )
        db.table("crawl_jobs").update({"sources": actual_sources}).eq("id", crawl_job_id).execute()

        # ── STEP 5 — merge and deduplicate by post_url ───────────────────────
        seen: set[str] = set()
        for post in hn_posts + reddit_posts + trends_posts:
            url = post.get("post_url", "")
            if url and url not in seen:
                seen.add(url)
                merged.append(post)

        print(f"[run_all] Merged: {len(merged)} unique posts after dedup")
        db.table("crawl_jobs").update({"posts_scanned": len(merged)}).eq("id", crawl_job_id).execute()

        # ── STEP 6 — filter already-known post_urls (last 90 days) ───────────
        cutoff_90 = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        existing_resp = (
            db.table("idea_sources")
              .select("post_url")
              .gte("fetched_at", cutoff_90)
              .execute()
        )
        existing_urls = {r["post_url"] for r in (existing_resp.data or [])}

        new_posts = [p for p in merged if p.get("post_url") not in existing_urls]
        skipped   = len(merged) - len(new_posts)

        print(f"[run_all] {skipped} already in DB (skipped), "
              f"{len(new_posts)} genuinely new")
        db.table("crawl_jobs").update({"posts_filtered": skipped}).eq("id", crawl_job_id).execute()

        # ── STEP 7 — load existing ideas for dedup (before scoring starts) ──────
        ideas_resp = (
            db.table("ideas")
              .select("id, title")
              .gte("first_seen_at", cutoff_90)
              .execute()
        )
        existing_ideas: list[dict] = ideas_resp.data or []

        # ── STEP 8 — score + write each idea to DB immediately ──────────────────
        def _save_idea(idea):
            nonlocal ideas_new, ideas_updated
            now_write   = datetime.now(timezone.utc).isoformat()
            idea_id     = None
            is_new_idea = True

            for ex_idea in existing_ideas:
                ratio = difflib.SequenceMatcher(
                    None,
                    idea["title"].lower(),
                    ex_idea["title"].lower(),
                ).ratio()
                if ratio > 0.75:
                    idea_id     = ex_idea["id"]
                    is_new_idea = False
                    break

            if is_new_idea:
                ins = db.table("ideas").insert({
                    "title":              idea["title"],
                    "summary":            idea["summary"],
                    "grade":              idea["grade"],
                    "score_demand":       idea["score_demand"],
                    "score_mobile_fit":   idea["score_mobile_fit"],
                    "score_monetization": idea["score_monetization"],
                    "score_buildability": idea["score_buildability"],
                    "score_competition":  idea["score_competition"],
                    "crawl_job_id":       crawl_job_id,
                    "first_seen_at":      idea.get("posted_at") or now_write,
                    "last_seen_at":       now_write,
                }).execute()
                idea_id = ins.data[0]["id"]
                existing_ideas.append({"id": idea_id, "title": idea["title"]})
                ideas_new += 1
            else:
                db.table("ideas").update(
                    {"last_seen_at": now_write}
                ).eq("id", idea_id).execute()
                ideas_updated += 1

            db.table("idea_sources").upsert({
                "idea_id":            idea_id,
                "post_url":           idea["post_url"],
                "post_title":         idea["post_title"],
                "post_body_excerpt":  idea.get("post_body_excerpt"),
                "source_type":        idea.get("source_type"),
                "subreddit":          idea.get("subreddit"),
                "author_username":    idea.get("author_username"),
                "author_profile_url": idea.get("author_profile_url"),
                "upvotes":            idea.get("upvotes"),
                "comment_count":      idea.get("comment_count"),
                "posted_at":          idea.get("posted_at"),
                "fetched_at":         now_write,
            }, on_conflict="post_url", ignore_duplicates=True).execute()

            if (ideas_new + ideas_updated) % 5 == 0:
                db.table("crawl_jobs").update({
                    "ideas_new":     ideas_new,
                    "ideas_updated": ideas_updated,
                }).eq("id", crawl_job_id).execute()

        graded = grade_posts(new_posts, on_idea=_save_idea)
        print(f"[run_all] Scorer returned {len(graded)} graded ideas — {ideas_new} new, {ideas_updated} updated")

        # ── STEP 9 — mark crawl_job done ──────────────────────────────────────
        db.table("crawl_jobs").update({
            "status":        "done",
            "finished_at":   datetime.now(timezone.utc).isoformat(),
            "ideas_new":     ideas_new,
            "ideas_updated": ideas_updated,
        }).eq("id", crawl_job_id).execute()

    except Exception as exc:
        # ── STEP 10 — mark crawl_job failed on any unhandled error ────────────
        try:
            db.table("crawl_jobs").update({
                "status":        "failed",
                "error_message": str(exc),
            }).eq("id", crawl_job_id).execute()
        except Exception:
            pass
        raise

    # ── STEP 11 — final summary ───────────────────────────────────────────────
    print(f"\n[run_all] ── Final Summary ───────────────────────────────────────")
    print(f"  Crawl job id:              {crawl_job_id}")
    print(f"  HN posts fetched:          {len(hn_posts)}")
    print(f"  Reddit posts fetched:      {len(reddit_posts)}")
    print(f"  Trends posts fetched:      {len(trends_posts)}")
    print(f"  Total after merge/dedup:   {len(merged)}")
    print(f"  Skipped (already in DB):   {skipped}")
    print(f"  New posts sent to scorer:  {len(new_posts)}")
    print(f"  Valid graded ideas:        {len(graded)}")
    print(f"  New ideas inserted:        {ideas_new}")
    print(f"  Existing ideas updated:    {ideas_updated}")


# ── STEP 12 — standalone entry point ─────────────────────────────────────────

if __name__ == "__main__":
    import time
    start = time.time()
    run_all()
    print(f"\n[run_all] Done in {time.time() - start:.1f}s")
