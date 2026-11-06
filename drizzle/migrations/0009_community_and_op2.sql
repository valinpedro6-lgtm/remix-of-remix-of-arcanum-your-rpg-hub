ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS age text NOT NULL DEFAULT '';
ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS occupation text NOT NULL DEFAULT '';
ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS profile text NOT NULL DEFAULT '';
ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS background text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  owner text NOT NULL,
  username text NOT NULL,
  topic text NOT NULL DEFAULT 'geral',
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_posts_created_idx ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_parent_idx ON public.community_posts(parent_id);
CREATE INDEX IF NOT EXISTS community_posts_topic_idx ON public.community_posts(topic, created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_posts FROM anon, authenticated;
GRANT ALL ON public.community_posts TO service_role;

CREATE TRIGGER community_posts_touch_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
