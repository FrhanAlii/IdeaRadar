-- IdeaRadar core schema
-- Replaces the minimal first-draft schema with a production-quality, multi-table design.

-- ─────────────────────────────────────────────────────────────
-- STEP 1 — EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─────────────────────────────────────────────────────────────
-- STEP 2 — crawl_jobs (no inbound FKs — must come before ideas)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crawl_jobs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  status          text NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'done', 'failed', 'partial')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  sources         text[] NOT NULL DEFAULT '{}',
  posts_scanned   integer NOT NULL DEFAULT 0,
  posts_filtered  integer NOT NULL DEFAULT 0,
  ideas_new       integer NOT NULL DEFAULT 0,
  ideas_updated   integer NOT NULL DEFAULT 0,
  error_message   text
);

-- ─────────────────────────────────────────────────────────────
-- STEP 3 — ideas
-- crawl_job_id is intentionally NOT a FK — avoids cascade/ordering
-- issues during bulk inserts and lets ideas outlive their crawl job.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ideas (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- AI-generated content
  title               text NOT NULL,
  summary             text NOT NULL,

  -- Cluster demand signals (auto-aggregated from idea_sources via trigger)
  source_count        integer NOT NULL DEFAULT 1,
  unique_users        integer NOT NULL DEFAULT 1,
  total_upvotes       integer NOT NULL DEFAULT 0,
  total_comments      integer NOT NULL DEFAULT 0,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),

  -- AI-graded scores 0–100; demand is computed, not AI-graded
  grade               text NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  score_demand        integer NOT NULL CHECK (score_demand BETWEEN 0 AND 100),
  score_mobile_fit    integer NOT NULL CHECK (score_mobile_fit BETWEEN 0 AND 100),
  score_monetization  integer NOT NULL CHECK (score_monetization BETWEEN 0 AND 100),
  score_buildability  integer NOT NULL CHECK (score_buildability BETWEEN 0 AND 100),
  score_competition   integer NOT NULL CHECK (score_competition BETWEEN 0 AND 100),

  -- Semantic embedding (text-embedding-3-small = 1536 dims)
  embedding           vector(1536),

  -- Metadata
  crawl_job_id        uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- STEP 4 — idea_sources (one row per contributing Reddit/HN post)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.idea_sources (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id             uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,

  -- The original post
  post_url            text NOT NULL,
  post_title          text NOT NULL,
  post_body_excerpt   text,         -- first ~500 chars only; full body lives in raw_posts

  -- Origin
  source_type         text NOT NULL CHECK (source_type IN ('reddit', 'hn')),
  subreddit           text,         -- null for HN posts

  -- Author public data — displayed openly on Reddit/HN; used for outreach
  author_username     text,         -- reddit: "u/username", hn: "username"
  author_profile_url  text,

  -- Engagement at time of fetch
  upvotes             integer NOT NULL DEFAULT 0,
  comment_count       integer NOT NULL DEFAULT 0,

  -- Embedding for this post (used when clustering new posts against existing ones)
  embedding           vector(1536),

  -- Timestamps
  posted_at           timestamptz,
  fetched_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT idea_sources_post_url_unique UNIQUE (post_url)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 5 — saved_ideas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_ideas (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id     uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  notes       text,
  saved_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT saved_ideas_user_idea_unique UNIQUE (user_id, idea_id)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 6 — raw_posts (staging; rows older than 7 days are purged by cron)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.raw_posts (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_job_id       uuid REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
  post_url           text NOT NULL,
  post_title         text NOT NULL,
  post_body          text,         -- full body stored here only
  source_type        text NOT NULL CHECK (source_type IN ('reddit', 'hn')),
  subreddit          text,
  author_username    text,
  author_profile_url text,
  upvotes            integer DEFAULT 0,
  comment_count      integer DEFAULT 0,
  posted_at          timestamptz,
  fetched_at         timestamptz NOT NULL DEFAULT now(),
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'clustered', 'filtered_out', 'failed')),
  filtered_reason    text,         -- e.g. 'low_quality', 'duplicate_url', 'non_english'
  idea_id            uuid REFERENCES public.ideas(id),
  embedding          vector(1536),

  CONSTRAINT raw_posts_post_url_unique UNIQUE (post_url)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 7 — outreach_log
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_log (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_source_id    uuid NOT NULL REFERENCES public.idea_sources(id) ON DELETE CASCADE,
  platform          text NOT NULL CHECK (platform IN ('reddit', 'hn', 'email', 'other')),
  status            text NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned', 'sent', 'replied', 'no_reply', 'not_interested')),
  contacted_at      timestamptz,
  replied_at        timestamptz,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT outreach_log_user_source_unique UNIQUE (user_id, idea_source_id)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 8 — INDEXES
-- ─────────────────────────────────────────────────────────────

-- ideas: scalar
CREATE INDEX IF NOT EXISTS ideas_created_at_idx   ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS ideas_last_seen_at_idx ON public.ideas(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS ideas_grade_idx        ON public.ideas(grade);
CREATE INDEX IF NOT EXISTS ideas_score_demand_idx ON public.ideas(score_demand DESC);

-- ideas: ivfflat nearest-neighbor (lists=100 suits up to ~1M rows)
CREATE INDEX IF NOT EXISTS ideas_embedding_idx ON public.ideas
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- idea_sources: scalar
CREATE INDEX IF NOT EXISTS idea_sources_idea_id_idx     ON public.idea_sources(idea_id);
CREATE INDEX IF NOT EXISTS idea_sources_source_type_idx ON public.idea_sources(source_type);
CREATE INDEX IF NOT EXISTS idea_sources_fetched_at_idx  ON public.idea_sources(fetched_at DESC);

-- idea_sources: ivfflat for matching new posts against stored sources
CREATE INDEX IF NOT EXISTS idea_sources_embedding_idx ON public.idea_sources
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- raw_posts
CREATE INDEX IF NOT EXISTS raw_posts_crawl_job_idx ON public.raw_posts(crawl_job_id);
CREATE INDEX IF NOT EXISTS raw_posts_status_idx    ON public.raw_posts(status);

-- raw_posts: ivfflat for clustering during ingestion
CREATE INDEX IF NOT EXISTS raw_posts_embedding_idx ON public.raw_posts
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- saved_ideas
CREATE INDEX IF NOT EXISTS saved_ideas_user_id_idx ON public.saved_ideas(user_id, saved_at DESC);

-- outreach_log
CREATE INDEX IF NOT EXISTS outreach_user_status_idx ON public.outreach_log(user_id, status);

-- ─────────────────────────────────────────────────────────────
-- STEP 9 — AUTO-UPDATE updated_at ON ideas
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ideas_updated_at ON public.ideas;
CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- STEP 10 — AUTO-SYNC ideas DEMAND COLUMNS WHEN idea_sources CHANGES
-- Keeps source_count, unique_users, total_upvotes, total_comments,
-- and last_seen_at always in sync — no manual updates needed in Python.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_idea_demand_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ideas SET
    source_count   = (SELECT COUNT(*)                        FROM public.idea_sources WHERE idea_id = NEW.idea_id),
    unique_users   = (SELECT COUNT(DISTINCT author_username) FROM public.idea_sources WHERE idea_id = NEW.idea_id AND author_username IS NOT NULL),
    total_upvotes  = (SELECT COALESCE(SUM(upvotes), 0)       FROM public.idea_sources WHERE idea_id = NEW.idea_id),
    total_comments = (SELECT COALESCE(SUM(comment_count), 0) FROM public.idea_sources WHERE idea_id = NEW.idea_id),
    last_seen_at   = (SELECT MAX(fetched_at)                 FROM public.idea_sources WHERE idea_id = NEW.idea_id),
    updated_at     = now()
  WHERE id = NEW.idea_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS idea_sources_sync_demand ON public.idea_sources;
CREATE TRIGGER idea_sources_sync_demand
  AFTER INSERT OR UPDATE ON public.idea_sources
  FOR EACH ROW EXECUTE FUNCTION public.sync_idea_demand_stats();

-- ─────────────────────────────────────────────────────────────
-- STEP 11 — AUTO-DELETE raw_posts OLDER THAN 7 DAYS
-- Conditional: migration succeeds even if pg_cron is not enabled.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-old-raw-posts',
      '0 4 * * *',
      $cron$DELETE FROM public.raw_posts WHERE fetched_at < now() - interval '7 days'$cron$
    );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- STEP 12 — ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

-- ideas: authenticated read; service role write (no write policy needed)
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ideas_read_authenticated" ON public.ideas;
CREATE POLICY "ideas_read_authenticated"
  ON public.ideas FOR SELECT
  TO authenticated
  USING (true);

-- idea_sources: authenticated read; service role write
ALTER TABLE public.idea_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "idea_sources_read_authenticated" ON public.idea_sources;
CREATE POLICY "idea_sources_read_authenticated"
  ON public.idea_sources FOR SELECT
  TO authenticated
  USING (true);

-- raw_posts: service role only — no policies; anon/authenticated are blocked entirely
ALTER TABLE public.raw_posts ENABLE ROW LEVEL SECURITY;

-- crawl_jobs: authenticated read
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crawl_jobs_read_authenticated" ON public.crawl_jobs;
CREATE POLICY "crawl_jobs_read_authenticated"
  ON public.crawl_jobs FOR SELECT
  TO authenticated
  USING (true);

-- saved_ideas: strict user isolation
ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_ideas_user_owns_row" ON public.saved_ideas;
CREATE POLICY "saved_ideas_user_owns_row"
  ON public.saved_ideas FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- outreach_log: strict user isolation
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "outreach_log_user_owns_row" ON public.outreach_log;
CREATE POLICY "outreach_log_user_owns_row"
  ON public.outreach_log FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
