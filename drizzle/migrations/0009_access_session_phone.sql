ALTER TABLE "access_sessions" ADD COLUMN IF NOT EXISTS "phone" text;
CREATE INDEX IF NOT EXISTS "access_sessions_phone_idx" ON "access_sessions" ("phone");
