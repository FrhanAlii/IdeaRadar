from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from db.supabase import get_client
from utils import get_user_tier

router = APIRouter()

FREE_BOOKMARK_LIMIT = 5


class SaveRequest(BaseModel):
    user_id: str
    idea_id: str
    notes: str = ""


@router.post("/")
def save_idea(body: SaveRequest):
    client = get_client()

    tier = get_user_tier(body.user_id)
    if tier == "free":
        existing = client.table("saved_ideas").select("id", count="exact").eq("user_id", body.user_id).execute()
        if (existing.count or 0) >= FREE_BOOKMARK_LIMIT:
            raise HTTPException(
                status_code=403,
                detail=f"Free tier limit: {FREE_BOOKMARK_LIMIT} saved bookmarks. Upgrade to Pro for unlimited.",
            )

    result = (
        client.table("saved_ideas")
        .insert({
            "user_id": body.user_id,
            "idea_id": body.idea_id,
            "notes": body.notes,
            "saved_at": datetime.now(timezone.utc).isoformat(),
        })
        .execute()
    )
    return result.data[0]


@router.delete("/{saved_id}")
def unsave_idea(saved_id: str):
    client = get_client()
    client.table("saved_ideas").delete().eq("id", saved_id).execute()
    return {"deleted": saved_id}
