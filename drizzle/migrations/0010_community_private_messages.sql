CREATE TABLE IF NOT EXISTS public.community_private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email text NOT NULL,
  recipient_email text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS community_private_pair_idx
  ON public.community_private_messages(sender_email, recipient_email, created_at DESC);
CREATE INDEX IF NOT EXISTS community_private_recipient_idx
  ON public.community_private_messages(recipient_email, created_at DESC);

ALTER TABLE public.community_private_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_private_messages FROM anon, authenticated;
GRANT ALL ON public.community_private_messages TO service_role;
