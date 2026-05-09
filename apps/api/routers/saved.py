from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
from db.supabase import get_client

router = APIRouter()


class SaveRequest(BaseModel):
    user_id: str
    idea_id: str
    notes: str = ""


@router.post("/")
def save_idea(body: SaveRequest):
    client = get_client()
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
