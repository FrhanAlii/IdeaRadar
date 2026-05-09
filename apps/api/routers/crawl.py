from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse
import uuid
import asyncio
import logging
import os
import sys
import random
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

from db.supabase import get_client

router = APIRouter()
logger = logging.getLogger(__name__)

TIER_LIMITS = {"free": 6, "pro": 25, "pro_plus": 60}


def run_pipeline_sync(job_id: str):
    """Runs the full crawl pipeline synchronously in a background thread."""
    try:
        from agents.run_all import run_all
        run_all(job_id=job_id)
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        try:
            get_client().table("crawl_jobs").update({
                "status": "failed",
                "error_message": str(e),
                "finished_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", job_id).execute()
        except Exception as db_err:
            logger.error(f"Could not update job status: {db_err}")


def get_user_from_request(request: Request):
    """Extract and verify the user from the Authorization Bearer token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.removeprefix("Bearer ").strip()
    try:
        resp = get_client().auth.get_user(token)
        if not resp or not resp.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return resp.user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {e}")


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


@router.post("/run")
async def trigger_crawl(request: Request, background_tasks: BackgroundTasks):
    db = get_client()

    user = get_user_from_request(request)
    user_id = user.id
    tier = get_user_tier(user_id)

    if tier != "admin":
        sub_resp = db.table("user_subscriptions").select("crawls_per_day").eq("user_id", user_id).maybe_single().execute()
        user_sub = sub_resp.data or {}

        start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        viewed_today = db.table("viewed_ideas") \
            .select("viewed_at") \
            .eq("user_id", user_id) \
            .gte("viewed_at", start_of_day.isoformat()) \
            .order("viewed_at", desc=False) \
            .execute()

        sessions_today = 0
        if viewed_today.data:
            sessions_today = 1
            for i in range(1, len(viewed_today.data)):
                prev = datetime.fromisoformat(viewed_today.data[i - 1]["viewed_at"].replace("Z", "+00:00"))
                curr = datetime.fromisoformat(viewed_today.data[i]["viewed_at"].replace("Z", "+00:00"))
                if (curr - prev).total_seconds() > 60:
                    sessions_today += 1

        daily_limit = user_sub.get("crawls_per_day", 2)
        if sessions_today >= daily_limit:
            return JSONResponse(
                status_code=429,
                content={
                    "message": f"Daily limit of {daily_limit} crawls reached. Resets at midnight UTC.",
                    "limit_reached": True,
                }
            )

    if tier == "admin":
        running = db.table("crawl_jobs").select("id").eq("status", "running").execute()
        if running.data:
            return JSONResponse(
                status_code=409,
                content={"message": "A crawl is already running. Check back in a few minutes."}
            )

        job_id = str(uuid.uuid4())
        db.table("crawl_jobs").insert({
            "id": job_id,
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "sources": ["reddit", "hn"],
            "posts_scanned": 0,
            "posts_filtered": 0,
            "ideas_new": 0,
            "ideas_updated": 0,
        }).execute()

        background_tasks.add_task(
            asyncio.get_event_loop().run_in_executor,
            None,
            run_pipeline_sync,
            job_id
        )

        return {
            "job_id": job_id,
            "status": "running",
            "message": "Crawl started successfully"
        }

    # Simulated path for free / pro / pro_plus
    limit = TIER_LIMITS.get(tier, 6)

    ideas_resp = db.rpc("fetch_random_unseen_ideas", {
        "p_user_id": user_id,
        "p_limit": limit,
    }).execute()
    ideas = ideas_resp.data or []

    if ideas:
        now = datetime.now(timezone.utc).isoformat()
        db.table("viewed_ideas").insert([
            {"user_id": user_id, "idea_id": idea["id"], "viewed_at": now}
            for idea in ideas
        ]).execute()

    await asyncio.sleep(random.uniform(180, 300))

    return {
        "simulated": True,
        "ideas": [idea["id"] for idea in ideas],
    }


@router.get("/jobs")
async def list_crawl_jobs(limit: int = 20):
    db = get_client()
    result = db.table("crawl_jobs").select("*").order(
        "started_at", desc=True
    ).limit(limit).execute()
    return {"data": result.data}


@router.get("/jobs/{job_id}")
async def get_crawl_job(job_id: str):
    db = get_client()
    result = db.table("crawl_jobs").select("*").eq("id", job_id).single().execute()
    return result.data
