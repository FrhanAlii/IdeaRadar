"""
Google Trends agent — fetches trending searches via Google's public RSS feeds
plus autocomplete suggestions for product-signal seed phrases, filters to
app/SaaS problems via OpenAI, saves to agents/trends_posts.json.

Run standalone: python agents/trends_agent.py
Import:         from agents.trends_agent import fetch_trends_posts
"""
import os
import sys
import json
import time
import random
import urllib.parse
import xml.etree.ElementTree as ET
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

# Make print() safe on Windows cp1252 terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"), override=True)
os.environ.pop("OPENAI_BASE_URL", None)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
_HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(_HERE, "trends_posts.json")

_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# Google Trends public RSS feed (no auth, returns ~10 trending topics per feed)
RSS_TARGETS = [
    ("US", None),   # US general
    ("US", "t"),    # US Sci/Tech
    ("US", "b"),    # US Business/Finance
    ("GB", "t"),    # GB Sci/Tech
    ("CA", "t"),    # CA Sci/Tech
    ("AU", "b"),    # AU Business
]

# Seed phrases for pytrends suggestions() — Google autocomplete for product searches
# suggestions() hits a different, less-throttled endpoint than related_queries()
SUGGESTION_SEEDS = [
    "best app for",
    "best software for",
    "alternative to",
    "how to track",
    "how to manage",
    "how to automate",
    "free tool for",
    "app to manage",
    "tool for tracking",
    "software to automate",
    "open source alternative to",
]

# Pre-filter — must contain at least one signal
PROBLEM_SIGNALS = [
    # Short-form product/comparison signals (trend title style)
    " app", " apps", " software", " tool", " tools", " platform", " service",
    " extension", " plugin", " api", " integration", " manager", " tracker",
    " calculator", " generator", " builder", " planner", " monitor",
    " vs ", " vs.", "versus", "alternative", "compare", "comparison",
    "best ", "top ", "free ", "pricing", "subscription", "affordable",
    # Long-form signals (Reddit/HN style)
    "how to", "how do i", "why is", "why can't", "why won't",
    "not working", "tool for", "app for", "software for",
    "looking for", "need a tool", "need an app",
    "is there a ", "does anyone know", "recommend a",
    # Review/evaluation
    "review", "tutorial", "guide",
]

# Always drop these
NOISE_PATTERNS = [
    "weather", "forecast",
    "score", "standings", "playoffs", "championship", "tournament",
    "died", "death", "obituary", "funeral",
    "lyrics", "album", "concert",
    "breaking news", "news today",
]

OPENAI_FILTER_PROMPT = """\
You are a startup idea filter. Given a trending Google search query, determine if
it signals a problem or need that could be solved by building a mobile app or SaaS product.

Return JSON only, no other text:
{
  "is_app_or_saas_problem": true/false,
  "problem_statement": "one sentence describing the user problem (or null if false)",
  "product_category": "one of: productivity, finance, health, education, communication, ecommerce, developer_tools, marketing, hr, other (or null if false)",
  "confidence": 0-100
}

Rules:
- true if the query shows someone looking for a tool, app, software, or workflow solution
- true if the query is comparing products/tools (signals shopping intent for software)
- true if the query shows a recurring pain point a subscription product could solve
- false if it's a one-time question answered by a blog post
- false if it's a news/entertainment/celebrity query
- false if it requires physical hardware to solve (not pure software)
- false if confidence is below 40\
"""

REQUIRED_KEYS = {"is_app_or_saas_problem", "problem_statement", "product_category", "confidence"}


def _fetch_rss(geo: str, cat: str | None = None) -> list[str]:
    url = f"https://trends.google.com/trending/rss?geo={geo}"
    if cat:
        url += f"&cat={cat}"
    label = f"{geo}/{cat}" if cat else geo
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": _BROWSER_UA})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        titles = [
            item.findtext("title", default="").strip()
            for item in root.findall(".//item")
            if item.findtext("title", default="").strip()
        ]
        print(f"[trends_agent] RSS {label:<8} -> {len(titles)} topics")
        return titles
    except Exception as e:
        print(f"[trends_agent] WARNING - RSS {label} failed: {e}")
        return []


def _fetch_suggestions(pytrends_client, seed: str) -> list[str]:
    """Query Google Trends autocomplete suggestions for a seed phrase."""
    try:
        results = pytrends_client.suggestions(keyword=seed)
        titles = [r.get("title", "").strip() for r in (results or []) if r.get("title", "").strip()]
        print(f"[trends_agent] suggestions({seed!r:<35}) -> {len(titles)} results")
        return titles
    except Exception as e:
        print(f"[trends_agent] WARNING - suggestions({seed!r}) failed: {e}")
        return []


def _passes_keyword_filter(q: str) -> bool:
    ql = q.lower()
    if len(ql) < 4:
        return False
    if any(noise in ql for noise in NOISE_PATTERNS):
        return False
    return any(sig in ql for sig in PROBLEM_SIGNALS)


def _call_openai_filter(client, query: str) -> dict | None:
    delays = [2, 4, 8, None]
    for attempt, delay in enumerate(delays):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.0,
                max_tokens=200,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": OPENAI_FILTER_PROMPT},
                    {"role": "user",   "content": query},
                ],
            )
            data = json.loads(resp.choices[0].message.content)
            if not REQUIRED_KEYS.issubset(data.keys()):
                return None
            return data
        except Exception as e:
            if delay is None:
                print(f"  [trends_agent] ERROR - retries exhausted for {query!r}: {e}")
                return None
            print(f"  [trends_agent] WARNING - attempt {attempt + 1} failed: {e} - retrying in {delay}s")
            time.sleep(delay)
    return None


def fetch_trends_posts() -> list[dict]:
    """Fetch Google Trends data and filter results to app/SaaS problems."""
    raw_queries: list[tuple[str, int]] = []

    # -- Phase 1 — RSS trending feeds -----------------------------------------
    print("[trends_agent] Phase 1: RSS trending feeds")
    for geo, cat in RSS_TARGETS:
        titles = _fetch_rss(geo, cat)
        for title in titles:
            raw_queries.append((title, 0))
        time.sleep(random.uniform(0.5, 1.5))

    # -- Phase 2 — Autocomplete suggestions via pytrends ----------------------
    print("\n[trends_agent] Phase 2: Autocomplete suggestions")
    try:
        from pytrends.request import TrendReq
        # retries=0 avoids pytrends using urllib3's removed 'method_whitelist' param
        pt = TrendReq(
            hl="en-US",
            tz=360,
            timeout=(10, 25),
            retries=0,
            requests_args={"headers": {"User-Agent": _BROWSER_UA}},
        )
        for seed in SUGGESTION_SEEDS:
            titles = _fetch_suggestions(pt, seed)
            for title in titles:
                raw_queries.append((title, 0))
            time.sleep(random.uniform(0.5, 1.5))
    except ImportError:
        print("[trends_agent] pytrends not installed — skipping suggestions phase")

    # -- Phase 3 — deduplicate by lowercased text ------------------------------
    seen_lower: set[str] = set()
    unique: list[tuple[str, int]] = []
    for q, v in raw_queries:
        key = q.strip().lower()
        if key and len(key) >= 4 and key not in seen_lower:
            seen_lower.add(key)
            unique.append((q.strip(), v))

    print(f"\n[trends_agent] Fetched {len(raw_queries)} raw -> {len(unique)} after dedup")
    print("[trends_agent] All unique topics:")
    for q, _ in unique:
        print(f"  - {q}")

    # -- Phase 4 — keyword pre-filter -----------------------------------------
    step1 = [(q, v) for q, v in unique if _passes_keyword_filter(q)]
    print(f"\n[trends_agent] After keyword filter: {len(step1)} queries")
    for q, _ in step1:
        print(f"  + {q}")

    if not step1:
        print("[trends_agent] Nothing survived the keyword filter - returning empty list")
        return []

    # -- Phase 5 — OpenAI validation ------------------------------------------
    if not OPENAI_API_KEY:
        print("[trends_agent] ERROR - OPENAI_API_KEY not set in apps/api/.env")
        return []

    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    now_iso = datetime.now(timezone.utc).isoformat()
    results: list[dict] = []
    dropped_ai = 0

    for q, upvotes_proxy in step1:
        data = _call_openai_filter(client, q)
        if data is None:
            dropped_ai += 1
            continue
        if not data.get("is_app_or_saas_problem") or (data.get("confidence") or 0) < 40:
            dropped_ai += 1
            continue
        problem_stmt = data.get("problem_statement") or ""
        results.append({
            "post_url":           f"https://trends.google.com/trends/explore?q={urllib.parse.quote_plus(q)}",
            "post_title":         q.title(),
            "post_body":          problem_stmt,
            "post_body_excerpt":  problem_stmt[:500],
            "source_type":        "google_trends",
            "subreddit":          None,
            "author_username":    None,
            "author_profile_url": None,
            "upvotes":            upvotes_proxy,
            "comment_count":      0,
            "posted_at":          now_iso,
            "fetched_at":         datetime.now(timezone.utc).isoformat(),
            "product_category":   data.get("product_category"),
        })

    print(f"\n[trends_agent] After OpenAI filter: {len(results)} valid app/saas problems "
          f"({dropped_ai} dropped)")
    return results


if __name__ == "__main__":
    posts = fetch_trends_posts()
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)
    print(f"[trends_agent] Saved {len(posts)} posts to {OUTPUT_PATH}")
