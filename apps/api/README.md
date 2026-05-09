# IdeaRadar API

FastAPI backend for IdeaRadar. Handles idea listing, crawl job management, saved ideas, and a daily crawl scheduler.

## Setup

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Ensure `apps/api/.env` is populated (copy from `.env.example` and fill values).

## Run

```bash
uvicorn main:app --reload
```

API available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/ideas/` | List ideas (optional `?grade=A&source=reddit`) |
| GET | `/ideas/{id}` | Get single idea |
| POST | `/crawl/run` | Trigger a crawl job |
| GET | `/crawl/jobs` | List all crawl jobs |
| POST | `/saved/` | Save an idea |
| DELETE | `/saved/{id}` | Unsave an idea |
| GET | `/settings/weights` | Get scoring weights |
| POST | `/settings/weights` | Update scoring weights |

## Scheduler

The daily crawl runs automatically at `CRAWL_SCHEDULE_HOUR` (default 3 AM UTC). It is started inside the FastAPI lifespan. To run a crawl manually, use `POST /crawl/run` or run `python agents/run_all.py`.
