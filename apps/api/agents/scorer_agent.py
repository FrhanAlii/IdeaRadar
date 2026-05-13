"""
Scorer agent — reads hn_posts.json (written by hn_agent.py), filters by demand,
grades each post via OpenAI gpt-4o-mini, and saves graded_ideas.json.

Run standalone:  python agents/scorer_agent.py
Import:          from agents.scorer_agent import grade_posts
"""
import os
import sys
import json
import math
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

# Make print() safe on Windows cp1252 terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"), override=True)
os.environ.pop("OPENAI_BASE_URL", None)  # clear any system-level Ollama override

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

_HERE = os.path.dirname(os.path.abspath(__file__))
INPUT_PATH  = os.path.join(_HERE, "hn_posts.json")
OUTPUT_PATH = os.path.join(_HERE, "graded_ideas.json")


# ─── STEP 2 — demand score (pure math, no AI) ────────────────────────────────

def compute_demand_score(post: dict) -> int:
    upvotes  = post.get("upvotes", 0)
    comments = post.get("comment_count", 0)

    upvote_score  = min(50, 15 * math.log10(upvotes + 1))
    comment_score = min(30, 10 * math.log10(comments + 1))

    posted_at     = post.get("posted_at")
    recency_score = 0
    if posted_at:
        try:
            posted   = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
            days_old = (datetime.now(timezone.utc) - posted).days
            if days_old <= 30:
                recency_score = 20
            elif days_old <= 90:
                recency_score = 12
            elif days_old <= 365:
                recency_score = 6
            else:
                recency_score = 2
        except Exception:
            recency_score = 5

    return min(100, int(upvote_score + comment_score + recency_score))


# ─── STEP 4 — OpenAI system prompt ───────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert startup idea evaluator focused on mobile app opportunities for indie developers.

Given a post, evaluate whether it describes a real buildable mobile app opportunity.

Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "clean idea title max 8 words",
  "summary": "one sentence -- what problem it solves and for whom",
  "is_valid_idea": true or false,
  "score_mobile_fit": 0-100,
  "score_monetization": 0-100,
  "score_buildability": 0-100,
  "score_competition": 0-100
}

Scoring:
- is_valid_idea: false if post is a rant, joke, meta question, or has no clear mobile use case
- mobile_fit: needs GPS/camera/notifications/habit loops = high. Desktop/enterprise tool = low.
- monetization: solo indie dev ceiling. Under $1k/mo=20, $10k/mo=60, $100k+/mo=90
- buildability: solo dev, v1 under 3 months. Needs hardware/ML from scratch=10. CRUD+APIs=90
- competition: 100=no apps exist. 0=one dominant app owns the space."""

REQUIRED_KEYS = {
    "title", "summary", "is_valid_idea",
    "score_mobile_fit", "score_monetization", "score_buildability", "score_competition",
}


# ─── helpers ─────────────────────────────────────────────────────────────────

def _grade_from_score(final_score: float) -> str:
    if final_score >= 75:
        return "A"
    if final_score >= 60:
        return "B"
    if final_score >= 45:
        return "C"
    return "D"


def _call_openai(client, post: dict) -> dict | None:
    user_msg = f"Title: {post['post_title']}\n\nPost:\n{(post.get('post_body') or '')[:1500]}"
    delays = [2, 4, 8]
    for attempt, delay in enumerate(delays + [None]):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.1,
                max_tokens=250,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_msg},
                ],
            )
            data = json.loads(resp.choices[0].message.content)
            if not REQUIRED_KEYS.issubset(data.keys()):
                print(f"  [scorer] WARNING -- missing keys in response, skipping")
                return None
            return data
        except Exception as e:
            if delay is None:
                print(f"  [scorer] ERROR -- 3 retries exhausted: {e} -- skipping post")
                return None
            print(f"  [scorer] WARNING -- attempt {attempt + 1} failed: {e} -- retrying in {delay}s")
            time.sleep(delay)
    return None


# ─── CORE PIPELINE ───────────────────────────────────────────────────────────

def grade_posts(posts: list, on_idea=None) -> list:
    """Grade a list of normalized posts. Returns list of graded idea dicts sorted by final_score desc."""
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set — check apps/api/.env")

    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    # ── STEP 3 — pre-filter ──────────────────────────────────────────────────
    before   = len(posts)
    filtered = [
        p for p in posts
        if compute_demand_score(p) >= 15
        and p.get("post_title")
        and len((p.get("post_title") or "") + (p.get("post_body") or "")) >= 30
        and (p.get("author_username") or p.get("source_type") == "google_trends")
    ]
    dropped_prefilter = before - len(filtered)
    print(f"[scorer] Pre-filter: {before} posts in, "
          f"{dropped_prefilter} dropped, {len(filtered)} remain")

    # ── STEP 5-6 — grade each post ───────────────────────────────────────────
    results    = []
    dropped_ai = 0
    total      = len(filtered)

    for i, post in enumerate(filtered, 1):
        score_demand = compute_demand_score(post)
        ai           = _call_openai(client, post)

        if ai is None:
            dropped_ai += 1
        elif not ai.get("is_valid_idea"):
            dropped_ai += 1
        else:
            final_score = (
                score_demand                * 0.40 +
                ai["score_mobile_fit"]      * 0.25 +
                ai["score_monetization"]    * 0.20 +
                ai["score_buildability"]    * 0.10 +
                ai["score_competition"]     * 0.05
            )
            idea_dict = {
                "title":              ai["title"],
                "summary":            ai["summary"],
                "grade":              _grade_from_score(final_score),
                "score_demand":       score_demand,
                "score_mobile_fit":   ai["score_mobile_fit"],
                "score_monetization": ai["score_monetization"],
                "score_buildability": ai["score_buildability"],
                "score_competition":  ai["score_competition"],
                "final_score":        round(final_score, 2),
                "post_url":           post.get("post_url"),
                "post_title":         post.get("post_title"),
                "post_body_excerpt":  post.get("post_body_excerpt"),
                "source_type":        post.get("source_type"),
                "subreddit":          post.get("subreddit"),
                "author_username":    post.get("author_username"),
                "author_profile_url": post.get("author_profile_url"),
                "upvotes":            post.get("upvotes"),
                "comment_count":      post.get("comment_count"),
                "posted_at":          post.get("posted_at"),
                "fetched_at":         post.get("fetched_at"),
            }
            results.append(idea_dict)
            if on_idea:
                on_idea(idea_dict)

        if i % 10 == 0:
            print(f"[scorer] Graded {i}/{total} -- {len(results)} valid so far")

        time.sleep(0.3)

    # ── STEP 7 — sort ────────────────────────────────────────────────────────
    results.sort(key=lambda x: x["final_score"], reverse=True)

    # ── STEP 8 — summary ─────────────────────────────────────────────────────
    grade_counts = {"A": 0, "B": 0, "C": 0, "D": 0}
    for r in results:
        grade_counts[r["grade"]] += 1

    print(f"\n[scorer] Summary")
    print(f"  Total posts loaded:           {before}")
    print(f"  Dropped by demand pre-filter: {dropped_prefilter}")
    print(f"  Dropped by OpenAI (invalid):  {dropped_ai}")
    print(f"  Final graded ideas:           {len(results)}")
    print(f"  Grade breakdown: A={grade_counts['A']} B={grade_counts['B']} "
          f"C={grade_counts['C']} D={grade_counts['D']}")
    print(f"\n  Top 5 ideas:")
    for r in results[:5]:
        print(f"    [{r['grade']}] {r['title']!r:50s} "
              f"demand={r['score_demand']:3d}  final={r['final_score']:.1f}")

    return results


# ─── STEP 1 + 9 — standalone entry point ─────────────────────────────────────

if __name__ == "__main__":
    if not os.path.exists(INPUT_PATH):
        print(f"[scorer] ERROR -- input file not found: {INPUT_PATH}")
        print("[scorer] Run agents/hn_agent.py first to generate hn_posts.json")
        sys.exit(1)

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        posts = json.load(f)
    print(f"[scorer] Loaded {len(posts)} posts from {INPUT_PATH}")

    graded = grade_posts(posts)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(graded, f, indent=2, ensure_ascii=False)
    print(f"\n[scorer] Saved {len(graded)} graded ideas to {OUTPUT_PATH}")
