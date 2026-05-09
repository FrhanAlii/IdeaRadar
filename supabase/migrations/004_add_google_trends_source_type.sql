-- Allow google_trends as a valid source_type in idea_sources
-- Previously only 'reddit' and 'hn' were permitted, causing crawl failures
-- whenever the trends agent tried to write posts.

ALTER TABLE public.idea_sources
  DROP CONSTRAINT IF EXISTS idea_sources_source_type_check;

ALTER TABLE public.idea_sources
  ADD CONSTRAINT idea_sources_source_type_check
  CHECK (source_type IN ('reddit', 'hn', 'google_trends'));
