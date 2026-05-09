from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Idea(BaseModel):
    id: str
    title: str
    summary: str
    evidence: str
    source_url: Optional[str] = None
    source_type: str
    subreddit: Optional[str] = None
    upvotes: int = 0
    grade: str
    score_demand: int
    score_mobile_fit: int
    score_monetization: int
    score_buildability: int
    score_competition: int
    crawled_at: datetime
    crawl_job_id: Optional[str] = None


class SavedIdea(BaseModel):
    id: str
    user_id: str
    idea_id: str
    notes: Optional[str] = None
    saved_at: datetime


class CrawlJob(BaseModel):
    id: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    posts_scanned: int = 0
    ideas_found: int = 0
    sources: Optional[str] = None
