"""
Reddit agent (JSON API) — fetches posts via Reddit's free public JSON endpoint.
No API key, no Apify, no auth required.

Run standalone:  python agents/reddit_agent_json.py
Import:          from agents.reddit_agent_json import fetch_reddit_posts
"""
import os
import json
import time
import requests
from datetime import datetime, timezone
from collections import Counter
from dotenv import load_dotenv

# Make print() safe on Windows cp1252 terminals
import sys
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../apps/api/.env"))

USER_AGENT    = "IdeaRadar/1.0 (personal project, low volume)"
BASE_URL      = "https://www.reddit.com/r/{subreddit}/{sort}.json"
POSTS_PER_PAGE = 100
SORT_TYPES    = ["hot", "top"]


# ─── Paginated fetcher for a single subreddit + sort ─────────────────────────

def fetch_subreddit_paginated(subreddit: str, sort: str = "hot", max_posts: int = 200) -> list:
    """
    Fetches up to max_posts posts from a subreddit using Reddit's .json endpoint.
    Each page returns up to 100 posts; pagination uses the 'after' cursor token.
    """
    all_posts = []
    after     = None
    page      = 1
    headers   = {"User-Agent": USER_AGENT}

    while len(all_posts) < max_posts:
        params = {"limit": POSTS_PER_PAGE, "t": "week"}
        if after:
            params["after"] = after

        url = BASE_URL.format(subreddit=subreddit, sort=sort)

        try:
            print(f"[reddit_json] r/{subreddit}/{sort} — page {page} (fetched {len(all_posts)} so far)")
            response = requests.get(url, params=params, headers=headers, timeout=15)

            if response.status_code == 429:
                print(f"[reddit_json] Rate limited — waiting 15s before retry")
                time.sleep(15)
                response = requests.get(url, params=params, headers=headers, timeout=15)

            if response.status_code == 403:
                print(f"[reddit_json] r/{subreddit} is private or banned — skipping")
                break

            if response.status_code == 404:
                print(f"[reddit_json] r/{subreddit} not found — skipping")
                break

            response.raise_for_status()
            data     = response.json().get("data", {})
            children = data.get("children", [])

            if not children:
                print(f"[reddit_json] r/{subreddit}/{sort} — no more posts at page {page}")
                break

            posts = [p["data"] for p in children if p.get("kind") == "t3"]
            all_posts.extend(posts)

            after = data.get("after")
            if not after:
                print(f"[reddit_json] r/{subreddit}/{sort} — reached end at page {page}")
                break

            page += 1
            time.sleep(1.5)

        except requests.exceptions.Timeout:
            print(f"[reddit_json] Timeout on r/{subreddit}/{sort} page {page} — stopping pagination")
            break
        except Exception as e:
            print(f"[reddit_json] Error on r/{subreddit}/{sort} page {page}: {e} — stopping pagination")
            break

    print(f"[reddit_json] r/{subreddit}/{sort} — total fetched: {len(all_posts)} posts across {page} pages")
    return all_posts[:max_posts]


# ─── Normalize raw Reddit JSON post to shared pipeline shape ─────────────────

def normalize_post(raw: dict, subreddit: str) -> dict:
    body     = raw.get("selftext") or ""
    if body in ("[deleted]", "[removed]"):
        body = ""

    username = raw.get("author") or ""
    valid_author = username and username not in ("[deleted]", "AutoModerator")

    return {
        "post_url":           f"https://reddit.com{raw.get('permalink', '')}",
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
    """Fetch Reddit posts via Reddit's public JSON API. Returns normalized, filtered post list."""

    subreddits = [
        s.strip()
        for s in os.getenv(
            "REDDIT_SUBREDDITS",
            "SomebodyMakeThis,startupideas,entrepreneur,apps,Nocode,indiehackers,SideProject"
        ).split(",")
        if s.strip()
    ]

    max_per_sub = int(os.getenv("REDDIT_MAX_POSTS_PER_SUBREDDIT", "200"))

    print(f"[reddit_json] Fetching up to {max_per_sub} posts per subreddit")
    print(f"[reddit_json] Subreddits: {subreddits}")

    all_raw: list[tuple[dict, str]] = []

    for subreddit in subreddits:
        for sort in SORT_TYPES:
            posts = fetch_subreddit_paginated(subreddit, sort, max_per_sub)
            all_raw.extend((p, subreddit) for p in posts)
            time.sleep(2)

    # Normalize
    normalized = [normalize_post(raw, sub) for raw, sub in all_raw]

    # Deduplicate by post_url — same post can appear in hot AND top
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

    print(f"\n[reddit_json] ─── Final Summary ───")
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
    print(f"\n[reddit_json] Saved {len(posts)} posts to {out_path}")
    print(f"[reddit_json] Run scorer next: python agents/scorer_agent.py")
