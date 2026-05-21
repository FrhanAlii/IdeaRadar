"""
Reddit agent — fetches posts via Pullpush.io (community Reddit archive API).
No credentials or authentication required.

Run standalone:  python agents/reddit_agent_json.py
Import:          from agents.reddit_agent_json import fetch_reddit_posts
"""
import os
import json
import time
import requests
from datetime import datetime, timezone, timedelta
from collections import Counter
from dotenv import load_dotenv

# Make print() safe on Windows cp1252 terminals
import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

USER_AGENT   = "IdeaRadar/1.0 (startup idea discovery tool)"
PULLPUSH_URL = "https://api.pullpush.io/reddit/search/submission/"


# ─── Fetch posts for a single subreddit via Pullpush ─────────────────────────

def fetch_subreddit_pullpush(subreddit: str, max_posts: int = 100) -> list:
    """
    Returns up to max_posts posts from the last 7 days sorted by score descending.
    Uses Pullpush.io — no Reddit credentials required.
    """
    seven_days_ago = int((datetime.now(timezone.utc) - timedelta(days=7)).timestamp())
    params = {
        "subreddit": subreddit,
        "size":      min(max_posts, 100),
        "sort_type": "score",
        "sort":      "desc",
        "after":     seven_days_ago,
        "score":     ">4",
    }
    headers = {"User-Agent": USER_AGENT}

    try:
        print(f"[reddit_pp] r/{subreddit} — fetching top posts of last 7 days")
        resp = requests.get(PULLPUSH_URL, params=params, headers=headers, timeout=20)

        if resp.status_code == 429:
            print(f"[reddit_pp] r/{subreddit} — rate limited, waiting 10s")
            time.sleep(10)
            resp = requests.get(PULLPUSH_URL, params=params, headers=headers, timeout=20)

        resp.raise_for_status()
        posts = resp.json().get("data", [])
        print(f"[reddit_pp] r/{subreddit} — {len(posts)} posts returned")
        return posts

    except requests.exceptions.Timeout:
        print(f"[reddit_pp] r/{subreddit} — timeout, skipping")
        return []
    except Exception as e:
        print(f"[reddit_pp] r/{subreddit} — failed: {e}")
        return []


# ─── Normalize Pullpush post to shared pipeline shape ────────────────────────

def normalize_post(raw: dict, subreddit: str) -> dict:
    body = raw.get("selftext") or ""
    if body in ("[deleted]", "[removed]"):
        body = ""

    username = raw.get("author") or ""
    valid_author = username and username not in ("[deleted]", "AutoModerator")

    permalink = raw.get("permalink") or ""
    if not permalink.startswith("/"):
        permalink = f"/r/{subreddit}/comments/{raw.get('id', '')}/"

    return {
        "post_url":           f"https://reddit.com{permalink}",
        "post_title":         raw.get("title") or "",
        "post_body":          body,
        "post_body_excerpt":  body[:500],
        "source_type":        "reddit",
        "subreddit":          subreddit,
        "author_username":    f"u/{username}" if valid_author else "",
        "author_profile_url": f"https://reddit.com/user/{username}" if valid_author else "",
        "upvotes":            raw.get("score") or 0,
        "comment_count":      raw.get("num_comments") or 0,
        "posted_at":          datetime.fromtimestamp(
                                  raw.get("created_utc", 0), tz=timezone.utc
                              ).isoformat(),
        "fetched_at":         datetime.now(timezone.utc).isoformat(),
    }


# ─── CORE PIPELINE ───────────────────────────────────────────────────────────

def fetch_reddit_posts() -> list:
    """Fetch Reddit posts via Pullpush.io. Returns normalized, filtered post list."""

    subreddits = [
        s.strip()
        for s in os.getenv(
            "REDDIT_SUBREDDITS",
            "SomebodyMakeThis,startupideas,entrepreneur,apps,Nocode,indiehackers,SideProject"
        ).split(",")
        if s.strip()
    ]

    max_per_sub = int(os.getenv("REDDIT_MAX_POSTS_PER_SUBREDDIT", "100"))

    print(f"[reddit_pp] Fetching up to {max_per_sub} posts per subreddit")
    print(f"[reddit_pp] Subreddits: {subreddits}")

    all_raw: list[tuple[dict, str]] = []

    for subreddit in subreddits:
        posts = fetch_subreddit_pullpush(subreddit, max_per_sub)
        all_raw.extend((p, subreddit) for p in posts)
        time.sleep(1)

    # Normalize
    normalized = [normalize_post(raw, sub) for raw, sub in all_raw]

    # Deduplicate by post_url
    seen_urls: set[str] = set()
    deduped = []
    for post in normalized:
        url = post["post_url"]
        if url and url not in seen_urls:
            seen_urls.add(url)
            deduped.append(post)

    # Pre-filter
    filtered = [
        p for p in deduped
        if p["post_title"]
        and len(p["post_body"]) >= 30
        and p["author_username"]
        and p["author_username"] not in ("u/AutoModerator", "u/[deleted]", "u/")
        and p["upvotes"] >= 5
    ]

    counts = Counter(p["subreddit"] for p in filtered)

    print(f"\n[reddit_pp] ─── Final Summary ───")
    print(f"  Raw posts fetched:       {len(all_raw)}")
    print(f"  After dedup:             {len(deduped)}")
    print(f"  After pre-filter:        {len(filtered)}")
    print(f"  Dropped (dedup):         {len(all_raw) - len(deduped)}")
    print(f"  Dropped (pre-filter):    {len(deduped) - len(filtered)}")
    print(f"\n  Per-subreddit breakdown:")
    for sub, count in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"    r/{sub}: {count} posts")

    return filtered


# ─── Standalone entry point ───────────────────────────────────────────────────

if __name__ == "__main__":
    posts    = fetch_reddit_posts()
    out_path = os.path.join(os.path.dirname(__file__), "reddit_json_posts.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print(f"\n[reddit_pp] Saved {len(posts)} posts to {out_path}")
