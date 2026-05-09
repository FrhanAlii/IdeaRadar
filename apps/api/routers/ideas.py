from fastapi import APIRouter, Query
from db.supabase import get_client

router = APIRouter()


@router.get("/")
def list_ideas(
    grade: str = Query(None, description="Filter by grade: A, B, C, D"),
    source: str = Query(None, description="Filter by source_type: reddit, hn"),
):
    client = get_client()
    query = client.table("ideas").select("*").order("crawled_at", desc=True)
    if grade:
        query = query.eq("grade", grade.upper())
    if source:
        query = query.eq("source_type", source.lower())
    result = query.execute()
    return result.data


@router.get("/{idea_id}")
def get_idea(idea_id: str):
    client = get_client()
    result = client.table("ideas").select("*").eq("id", idea_id).single().execute()
    return result.data
