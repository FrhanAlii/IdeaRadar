# IdeaRadar

AI-powered startup idea discovery — crawls Reddit and Hacker News, grades ideas with GPT-4o-mini, and surfaces the best ones for founders.

## Structure

| Folder | Description |
|--------|-------------|
| `apps/web/` | React + TypeScript frontend (Vite, shadcn/ui, Tailwind) |
| `apps/api/` | FastAPI backend — REST endpoints, scheduler, Supabase integration |
| `apps/landing/` | Static landing page |
| `agents/` | Standalone Python agents: Reddit crawler, HN crawler, scorer |
| `packages/types/` | Shared TypeScript interfaces |
| `supabase/` | Database migrations and seed data |

## Running each service

```bash
# Frontend
cd apps/web && npm run dev

# API
cd apps/api && uvicorn main:app --reload

# Agents (manual run)
python agents/run_all.py
```

## Environment

All services read from `apps/api/.env`. Copy `apps/api/.env.example` to `apps/api/.env` and fill in your keys before starting.
