-- À coller dans Supabase → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS grub_inbox (
  id          TEXT PRIMARY KEY,
  prospect    JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grub_processed (
  thread_id   TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
