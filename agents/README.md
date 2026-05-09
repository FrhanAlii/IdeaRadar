# IdeaRadar Agents

Standalone Python scripts for crawling and scoring startup ideas.

## Setup

```bash
pip install -r agents/requirements.txt
```

Env is loaded from `apps/api/.env` automatically.

## Running manually

```bash
# Run the full pipeline (fetch Reddit + HN, score, write to Supabase)
python agents/run_all.py

# Run individual agents
python agents/reddit_agent.py   # → /tmp/reddit_posts.json
python agents/hn_agent.py       # → /tmp/hn_posts.json
python agents/scorer_agent.py   # reads both, → /tmp/graded_ideas.json
```

## What each agent does

| Agent | Input | Output | Description |
|-------|-------|--------|-------------|
| `reddit_agent.py` | Apify API | `/tmp/reddit_posts.json` | Fetches hot posts from configured subreddits via Apify |
| `hn_agent.py` | Algolia HN API | `/tmp/hn_posts.json` | Searches HN for 4 demand-signal phrases (free, no key needed) |
| `scorer_agent.py` | `/tmp/*.json` | `/tmp/graded_ideas.json` | Grades each post with GPT-4o-mini, filters invalid ideas |
| `run_all.py` | Everything above | Supabase `ideas` table | Runs full pipeline and writes results to the database |

## Expected output

After `run_all.py`:
- `crawl_jobs` table has a new row with `status: "done"` and idea counts
- `ideas` table has new rows for each valid idea graded A–D
