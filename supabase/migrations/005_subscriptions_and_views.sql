-- viewed_ideas: tracks which ideas each user has been shown
-- prevents duplicates when they "run crawl" multiple times
CREATE TABLE IF NOT EXISTS public.viewed_ideas (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id     uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idea_id)
);

CREATE INDEX IF NOT EXISTS viewed_ideas_user_id_idx
  ON public.viewed_ideas(user_id, viewed_at DESC);

ALTER TABLE public.viewed_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "viewed_ideas_user_owns_row" ON public.viewed_ideas;
CREATE POLICY "viewed_ideas_user_owns_row"
  ON public.viewed_ideas FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update default tier limits to match the actual plan
UPDATE public.user_subscriptions
SET ideas_per_crawl = 6, crawls_per_day = 2
WHERE tier = 'free' AND ideas_per_crawl != 9999;

-- Auto-create a free subscription row for every new signup
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier, ideas_per_crawl, crawls_per_day)
  VALUES (NEW.id, 'free', 6, 2)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_create_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_create_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();

-- Helper RPC function: fetch random unseen ideas for a user
-- biased toward recent + high grade
CREATE OR REPLACE FUNCTION public.fetch_random_unseen_ideas(
  p_user_id uuid,
  p_limit   integer DEFAULT 6
)
RETURNS SETOF public.ideas
LANGUAGE sql STABLE AS $$
  SELECT i.*
  FROM public.ideas i
  WHERE i.id NOT IN (
    SELECT idea_id FROM public.viewed_ideas WHERE user_id = p_user_id
  )
  ORDER BY
    CASE
      WHEN i.created_at >  now() - interval '7 days'  THEN 1
      WHEN i.created_at >  now() - interval '30 days' THEN 2
      ELSE 3
    END,
    CASE i.grade
      WHEN 'A' THEN 1
      WHEN 'B' THEN 2
      WHEN 'C' THEN 3
      ELSE 4
    END,
    random()
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_random_unseen_ideas(uuid, integer) TO authenticated;
