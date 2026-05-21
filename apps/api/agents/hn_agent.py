"""
HN agent — queries Algolia HN API for demand-signal posts, saves to /tmp/hn_posts.json.
Run standalone: python agents/hn_agent.py
"""
import os
import sys
import json
import time
import requests
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Make print() safe on Windows cp1252 terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

SEARCH_PHRASES = [
    # Direct demand signals
    "I wish there was an app",
    "why is there no app",
    "someone should build",
    "would pay for an app",
    "nobody has built this",
    "why doesn't this exist",
    "somebody make this",
    "I would pay for",
    "desperately need an app",
    "can't believe there is no",

    # Problem-first phrases
    "frustrated that there is no",
    "annoyed that nothing exists",
    "struggling to find a tool",
    "there has to be a better way",
    "sick of using spreadsheets for",
    "manually doing this is painful",
    "no good solution exists for",
    "every tool I tried is bad",

    # Builder-facing phrases
    "is anyone building",
    "has anyone built",
    "looking for a tool that",
    "does anyone know of an app",
    "ask HN what tools do you use for",
    "what software do you use to",
    "is there a service that",
    "recommend a tool for",

    # Mobile-specific (important for your iOS/Android goal)
    "need a mobile app for",
    "wish there was an iOS app",
    "wish there was an Android app",
    "no good mobile app for",
]


def fetch_hn_posts() -> list[dict]:
    seen = set()
    posts = []

    six_months_ago_dt = datetime.now(timezone.utc) - timedelta(days=182)
    six_months_ago_ts = int(six_months_ago_dt.timestamp())
    print(f"[hn_agent] Filtering posts after: {six_months_ago_dt.strftime('%Y-%m-%d')} (6 months ago)")

    for phrase in SEARCH_PHRASES:
        url = "https://hn.algolia.com/api/v1/search"
        params = {"query": phrase, "tags": "story", "hitsPerPage": 70,
                  "numericFilters": f"points>=5,created_at>={six_months_ago_ts}"}
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"[hn_agent] WARNING — query failed: {phrase!r} — {e} — skipping")
            continue

        hits = response.json().get("hits", [])
        added = 0
        dupes = 0
        for hit in hits:
            obj_id = hit.get("objectID")
            if obj_id in seen:
                dupes += 1
                continue
            seen.add(obj_id)
            username = hit.get("author", "")
            body = hit.get("story_text") or hit.get("comment_text") or ""
            posts.append({
                "post_url":           f"https://news.ycombinator.com/item?id={obj_id}",
                "post_title":         hit.get("title") or "",
                "post_body":          body,
                "post_body_excerpt":  body[:500],
                "source_type":        "hn",
                "subreddit":          None,
                "author_username":    username,
                "author_profile_url": f"https://news.ycombinator.com/user?id={username}",
                "upvotes":            hit.get("points") or 0,
                "comment_count":      hit.get("num_comments") or 0,
                "posted_at":          hit.get("created_at") or None,
                "fetched_at":         datetime.now(timezone.utc).isoformat(),
            })
            added += 1
        print(f"[hn_agent] {phrase!r:<42} -> {len(hits):>3} hits | +{added} new | {dupes} dupes skipped")
        time.sleep(0.3)

    cutoff_iso = six_months_ago_dt.isoformat()
    before_date_filter = len(posts)
    posts = [p for p in posts if p["posted_at"] and p["posted_at"] >= cutoff_iso]
    date_dropped = before_date_filter - len(posts)
    if date_dropped:
        print(f"[hn_agent] Safety filter removed {date_dropped} post(s) older than 6 months")
    if posts:
        oldest = min(p["posted_at"] for p in posts)
        print(f"[hn_agent] Oldest post in results: {oldest[:10]}")

    before_filter = len(posts)
    posts = [
        p for p in posts
        if p["post_title"]
        and p["author_username"]
    ]
    filtered_out = before_filter - len(posts)

    print(f"\n[hn_agent] Summary: {before_filter} after dedup, {filtered_out} removed by pre-filter, {len(posts)} final")
    return posts


if __name__ == "__main__":
    posts = fetch_hn_posts()
    out = os.path.join(os.path.dirname(__file__), "hn_posts.json")
    with open(out, "w") as f:
        json.dump(posts, f, indent=2)
    print(f"[hn_agent] Saved {len(posts)} posts to {out}")
