"""
Reddit agent — fetches posts from Apify trudax/reddit-scraper-lite, saves to agents/reddit_posts.json.
Run standalone: python agents/reddit_agent.py
Import:         from agents.reddit_agent import fetch_reddit_posts
"""
import os
import sys
import json
import time
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "../apps/api/.env"),
    override=True,
)
os.environ.pop("OPENAI_BASE_URL", None)  # clear any system-level Ollama override

_HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(_HERE, "reddit_posts.json")

DEFAULT_SUBREDDITS = (
    "SomebodyMakeThis,startupideas,entrepreneur,apps,Nocode,indiehackers,SideProject,"
    "buildinpublic,webdev,productivity,smallbusiness,AppIdeas,mobileapps,freelance,"
    "artificial,MachineLearning,marketing,saas,microsaas"
)

APIFY_BASE     = "https://api.apify.com/v2"
APIFY_ACTOR    = "trudax~reddit-scraper-lite"
POLL_INTERVAL  = 10    # seconds between status checks
POLL_TIMEOUT   = 1200  # give up after 20 minutes


# ─── STEP 3 — async Apify run + poll + fetch ─────────────────────────────────

def _run_apify(token: str, payload: dict) -> list[dict]:
    """Start an Apify actor run, poll until done, return dataset items."""

    # 1 — start run
    start_resp = requests.post(
        f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs",
        params={"token": token},
        json=payload,
        timeout=30,
    )
    start_resp.raise_for_status()
    run_data      = start_resp.json()["data"]
    run_id        = run_data["id"]
    dataset_id    = run_data["defaultDatasetId"]
    print(f"[reddit_agent] Run started: {run_id}")

    # 2 — poll until SUCCEEDED / FAILED / TIMED-OUT
    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        time.sleep(POLL_INTERVAL)
        status_resp = requests.get(
            f"{APIFY_BASE}/actor-runs/{run_id}",
            params={"token": token},
            timeout=15,
        )
        status_resp.raise_for_status()
        status = status_resp.json()["data"]["status"]
        print(f"[reddit_agent] Run status: {status}")

        if status == "SUCCEEDED":
            break
        if status in ("FAILED", "TIMED-OUT", "ABORTED"):
            print(f"[reddit_agent] ERROR -- Apify run ended with status: {status}")
            sys.exit(1)
    else:
        print(f"[reddit_agent] ERROR -- polling timed out after {POLL_TIMEOUT}s")
        sys.exit(1)

    # 3 — fetch dataset items
    items_resp = requests.get(
        f"{APIFY_BASE}/datasets/{dataset_id}/items",
        params={"token": token, "format": "json"},
        timeout=60,
    )
    items_resp.raise_for_status()
    return items_resp.json()


# ─── normalize one raw Apify item ────────────────────────────────────────────

def _normalize(post: dict) -> dict:
    body = (
        post.get("selftext")
        or post.get("body")
        or post.get("text")
        or ""
    )
    author = post.get("author") or post.get("username") or "unknown"
    # parsedCommunityName = "SomebodyMakeThis"; communityName = "r/SomebodyMakeThis"
    subreddit = (
        post.get("parsedCommunityName")
        or post.get("subreddit")
        or (post.get("communityName") or "").lstrip("r/")
        or ""
    )
    return {
        "post_url":           post.get("url") or post.get("link") or post.get("permalink") or "",
        "post_title":         post.get("title") or "",
        "post_body":          body,
        "post_body_excerpt":  body[:500],
        "source_type":        "reddit",
        "subreddit":          subreddit,
        "author_username":    f"u/{author}",
        "author_profile_url": f"https://reddit.com/user/{author}",
        # trudax actor uses "upVotes" (capital V)
        "upvotes":            post.get("upVotes") or post.get("score") or post.get("upvotes") or post.get("likes") or 0,
        # trudax actor uses "numberOfComments"
        "comment_count":      post.get("numberOfComments") or post.get("numComments") or post.get("commentCount") or post.get("num_comments") or 0,
        "posted_at":          post.get("createdAt") or post.get("created_utc") or None,
        "fetched_at":         datetime.now(timezone.utc).isoformat(),
    }


# ─── CORE PIPELINE ───────────────────────────────────────────────────────────

def fetch_reddit_posts() -> list[dict]:
    """Fetch Reddit posts via Apify. Returns list of normalized post dicts."""

    # ── STEP 1 — env ─────────────────────────────────────────────────────────
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("[reddit_agent] ERROR -- APIFY_API_TOKEN is not set in apps/api/.env")
        sys.exit(1)

    subreddit_names = [
        s.strip()
        for s in os.getenv("REDDIT_SUBREDDITS", DEFAULT_SUBREDDITS).split(",")
        if s.strip()
    ]

    # ── STEP 2 — build start URLs ────────────────────────────────────────────
    start_urls = [
        url
        for name in subreddit_names
        for url in [
            {"url": f"https://www.reddit.com/r/{name}/hot/"},
            {"url": f"https://www.reddit.com/r/{name}/top/?t=week"},
        ]
    ]
    print(f"[reddit_agent] Querying {len(subreddit_names)} subreddits × 2 feeds: {subreddit_names}")

    # ── STEP 3 — run Apify actor async ───────────────────────────────────────
    payload = {
        "startUrls":    start_urls,
        "skipComments": True,
        "maxItems":     300,
    }

    try:
        raw_items = _run_apify(token, payload)
    except requests.exceptions.RequestException as e:
        print(f"[reddit_agent] ERROR -- Request failed: {e}")
        sys.exit(1)

    if not isinstance(raw_items, list):
        print(f"[reddit_agent] ERROR -- Unexpected response shape: {type(raw_items)}")
        print(f"[reddit_agent] Response: {str(raw_items)[:500]}")
        sys.exit(1)

    total_raw = len(raw_items)
    print(f"[reddit_agent] Received {total_raw} raw items from Apify")

    # ── STEP 4 — normalize ───────────────────────────────────────────────────
    normalized = [_normalize(item) for item in raw_items]

    # ── STEP 5 — deduplicate by post_url ─────────────────────────────────────
    seen_urls: set[str] = set()
    deduped = []
    for post in normalized:
        url = post["post_url"]
        if url and url not in seen_urls:
            seen_urls.add(url)
            deduped.append(post)
    dupes_removed = total_raw - len(deduped)

    # ── STEP 6 — pre-filter ──────────────────────────────────────────────────
    filtered = [
        p for p in deduped
        if p["post_title"]
        and len(p["post_body"]) >= 30
        and p["author_username"] not in ("u/", "u/unknown", "")
        and p["author_username"] != "u/AutoModerator"
        and p["upvotes"] >= 5
        and p["post_url"]
    ]
    prefilter_removed = len(deduped) - len(filtered)

    # ── STEP 7 — summary ─────────────────────────────────────────────────────
    subreddit_counts: dict[str, int] = {}
    for p in filtered:
        sr = p["subreddit"] or "unknown"
        subreddit_counts[sr] = subreddit_counts.get(sr, 0) + 1

    print(f"\n[reddit_agent] Summary")
    print(f"  Total raw posts from Apify:  {total_raw}")
    print(f"  Removed by dedup:            {dupes_removed}")
    print(f"  Removed by pre-filter:       {prefilter_removed}")
    print(f"  Final posts remaining:       {len(filtered)}")
    print(f"\n  Per-subreddit breakdown:")
    for sr, count in sorted(subreddit_counts.items(), key=lambda x: -x[1]):
        print(f"    r/{sr:<30} {count:>4} posts")

    return filtered


# ─── standalone entry point ───────────────────────────────────────────────────

if __name__ == "__main__":
    posts = fetch_reddit_posts()
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print(f"\n[reddit_agent] Saved {len(posts)} posts to {OUTPUT_PATH}")
