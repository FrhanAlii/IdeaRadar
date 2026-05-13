from db.supabase import get_client


def get_user_tier(user_id: str) -> str:
    """Return the user's subscription tier, auto-creating a free row if missing."""
    db = get_client()
    resp = db.table("user_subscriptions").select("tier").eq("user_id", user_id).maybe_single().execute()
    if resp.data:
        return resp.data["tier"]
    db.table("user_subscriptions").insert({
        "user_id": user_id,
        "tier": "free",
        "ideas_per_crawl": 6,
        "crawls_per_day": 2,
    }).execute()
    return "free"
