-- Sample pre-graded ideas for local development and demos.
-- Run after migrations: supabase db seed
--
-- The demand-sync trigger (idea_sources_sync_demand) fires after each
-- idea_sources INSERT and rewrites source_count / unique_users /
-- total_upvotes / total_comments / last_seen_at on the parent idea row.
-- So the initial values set on ideas below are overwritten automatically.

-- ── crawl job ────────────────────────────────────────────────
INSERT INTO public.crawl_jobs (id, status, started_at, finished_at, sources, posts_scanned, posts_filtered, ideas_new, ideas_updated)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'done',
  now() - interval '2 hours',
  now() - interval '1 hour 55 minutes',
  ARRAY['reddit', 'hn'],
  61, 18, 3, 0
);

-- ── ideas ─────────────────────────────────────────────────────
-- grade A: Medication photo logger
INSERT INTO public.ideas (id, title, summary, grade,
  score_demand, score_mobile_fit, score_monetization, score_buildability, score_competition,
  crawl_job_id, first_seen_at)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Medication photo logger with interaction alerts',
  'Snap a photo of any pill bottle and the app logs your dosage history, flags potential drug interactions using an open formulary database, and exports a clean PDF timeline for your doctor. Designed for caregivers managing elderly relatives on 5+ medications.',
  'A', 91, 97, 88, 71, 34,
  '00000000-0000-0000-0000-000000000001',
  now() - interval '26 hours'
);

-- grade B: Gym equipment wait-time predictor
INSERT INTO public.ideas (id, title, summary, grade,
  score_demand, score_mobile_fit, score_monetization, score_buildability, score_competition,
  crawl_job_id, first_seen_at)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'Gym equipment wait-time predictor',
  'Uses anonymised check-in history from gym apps (or a lightweight companion badge scanner) to predict when the squat rack, bench, or cable machine will be free. Shows a 30-minute heatmap so you can plan your session around the crowd.',
  'B', 74, 88, 62, 79, 61,
  '00000000-0000-0000-0000-000000000001',
  now() - interval '25 hours'
);

-- grade C: Hyperlocal street-noise map
INSERT INTO public.ideas (id, title, summary, grade,
  score_demand, score_mobile_fit, score_monetization, score_buildability, score_competition,
  crawl_job_id, first_seen_at)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  'Hyperlocal street-noise crowdsource map',
  'A crowdsourced heatmap where residents tag blocks by noise level (construction, bar noise, traffic) with timestamps. Useful for apartment hunters, new parents, and remote workers deciding where to rent. Monetises via a premium "quiet score" API sold to real-estate platforms.',
  'C', 58, 79, 44, 85, 72,
  '00000000-0000-0000-0000-000000000001',
  now() - interval '24 hours'
);

-- ── idea_sources ──────────────────────────────────────────────
-- The trigger will auto-update source_count, unique_users,
-- total_upvotes, total_comments, last_seen_at on the ideas rows above.

-- Sources for: Medication photo logger (grade A)
INSERT INTO public.idea_sources
  (idea_id, post_url, post_title, post_body_excerpt, source_type, subreddit,
   author_username, author_profile_url, upvotes, comment_count, posted_at)
VALUES
(
  '00000000-0000-0000-0000-000000000010',
  'https://reddit.com/r/SomebodyMakeThis/comments/t4rx9p/app_that_scans_pill_bottles_and_tracks_meds',
  'App that scans pill bottles and tracks meds for elderly parents',
  'My mom takes 9 different pills. Every time she sees a new specialist they ask for her medication list and she hands them a crumpled paper from 2019. I would pay $15/month for an app that just lets me photograph each bottle and keeps a running log with interaction warnings.',
  'reddit', 'SomebodyMakeThis',
  'u/caregiving_in_chaos', 'https://reddit.com/user/caregiving_in_chaos',
  847, 94,
  now() - interval '3 days'
),
(
  '00000000-0000-0000-0000-000000000010',
  'https://reddit.com/r/startupideas/comments/v2km4a/medication_photo_log_with_doctor_export',
  'Medication photo log with doctor export — anyone building this?',
  'Searched the app store, found a bunch of reminder apps but nothing that actually identifies what the pill IS from a photo and checks interactions against your other meds. The interaction check alone is the killer feature.',
  'reddit', 'startupideas',
  'u/pharmtech_watcher', 'https://reddit.com/user/pharmtech_watcher',
  412, 57,
  now() - interval '6 days'
),
(
  '00000000-0000-0000-0000-000000000010',
  'https://news.ycombinator.com/item?id=34821901',
  'Ask HN: Why is there no good medication management app for family caregivers?',
  'I manage medications for both my parents. Every app I''ve tried is either a simple reminder or requires manual data entry for every drug. An OCR-based logger that cross-references the NIH drug database would solve this. Is anyone working on this?',
  'hn', null,
  'svenlayton', 'https://news.ycombinator.com/user?id=svenlayton',
  389, 112,
  now() - interval '10 days'
);

-- Sources for: Gym equipment wait-time predictor (grade B)
INSERT INTO public.idea_sources
  (idea_id, post_url, post_title, post_body_excerpt, source_type, subreddit,
   author_username, author_profile_url, upvotes, comment_count, posted_at)
VALUES
(
  '00000000-0000-0000-0000-000000000011',
  'https://reddit.com/r/SomebodyMakeThis/comments/s9hf3m/app_that_shows_gym_equipment_wait_times',
  'App that shows gym equipment wait times in real time',
  'Every gym has peak hours but nobody tells you exactly which machines are free. I want a heatmap that shows me the squat rack is going to be free in 12 minutes so I can time my warmup. Could use historical data + live occupancy sensors or even just crowdsourced taps.',
  'reddit', 'SomebodyMakeThis',
  'u/powerlifter_pete', 'https://reddit.com/user/powerlifter_pete',
  634, 78,
  now() - interval '5 days'
),
(
  '00000000-0000-0000-0000-000000000011',
  'https://reddit.com/r/Fitness/comments/u1cz7k/is_there_an_app_that_predicts_when_the_bench_will',
  'Is there an app that predicts when the bench will be free?',
  'I go to the gym at lunch which is always slammed. Would love something that says "benches are usually free at 1:15pm on Tuesdays based on historical check-in data." Planet Fitness has an app that shows capacity but not per-equipment.',
  'reddit', 'Fitness',
  'u/lunchbreak_lifter', 'https://reddit.com/user/lunchbreak_lifter',
  289, 43,
  now() - interval '8 days'
);

-- Sources for: Hyperlocal street-noise map (grade C)
INSERT INTO public.idea_sources
  (idea_id, post_url, post_title, post_body_excerpt, source_type, subreddit,
   author_username, author_profile_url, upvotes, comment_count, posted_at)
VALUES
(
  '00000000-0000-0000-0000-000000000012',
  'https://reddit.com/r/startupideas/comments/q8tm2n/crowdsourced_noise_map_for_apartment_hunters',
  'Crowdsourced noise map for apartment hunters',
  'Moving to a new city and every listing says "quiet street" but I have no idea if that''s true. A community-maintained map where people tag specific blocks with noise levels (bar noise, construction, highway hum) would have saved me $200 in Uber costs scouting neighborhoods.',
  'reddit', 'startupideas',
  'u/remote_worker_nomad', 'https://reddit.com/user/remote_worker_nomad',
  178, 31,
  now() - interval '4 days'
),
(
  '00000000-0000-0000-0000-000000000012',
  'https://news.ycombinator.com/item?id=33947201',
  'Ask HN: Tools for evaluating neighbourhood noise before signing a lease?',
  'Walked around 3 apartments at 2pm on a Tuesday. Moved in, discovered bar below closes at 3am on weekends. Any crowdsourced data source for street-level noise beyond just Google Street View guesswork?',
  'hn', null,
  'quietquitter99', 'https://news.ycombinator.com/user?id=quietquitter99',
  94, 47,
  now() - interval '12 days'
)
ON CONFLICT (post_url) DO NOTHING;
