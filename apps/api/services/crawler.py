import os
import requests
from datetime import datetime, timezone


def fetch_reddit_posts() -> list[dict]:
    token = os.getenv("APIFY_API_TOKEN")
    subreddits = os.getenv("REDDIT_SUBREDDITS", "SomebodyMakeThis,startupideas,entrepreneur").split(",")

    run_url = "https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/run-sync-get-dataset-items"
    payload = {
        "subreddits": subreddits,
        "maxPostCount": 50,
        "sort": "hot",
    }
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.post(run_url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    raw = response.json()

    posts = []
    for item in raw:
        posts.append({
            "title": item.get("title", ""),
            "body": item.get("selftext", ""),
            "url": item.get("url", ""),
            "upvotes": item.get("score", 0),
            "subreddit": item.get("subreddit", ""),
            "source": "reddit",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        })
    return posts


def fetch_hn_posts() -> list[dict]:
    phrases = [
        "somebody make this",
        "why doesn't this exist",
        "I would pay for",
        "nobody has built",
    ]

    seen = set()
    posts = []

    for phrase in phrases:
        url = "https://hn.algolia.com/api/v1/search"
        params = {"query": phrase, "tags": "story", "hitsPerPage": 30}
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()

        for hit in response.json().get("hits", []):
            obj_id = hit.get("objectID")
            if obj_id in seen:
                continue
            seen.add(obj_id)
            posts.append({
                "title": hit.get("title", ""),
                "body": hit.get("story_text") or "",
                "url": hit.get("url") or f"https://news.ycombinator.com/item?id={obj_id}",
                "upvotes": hit.get("points", 0),
                "subreddit": None,
                "source": "hn",
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            })

    return posts
