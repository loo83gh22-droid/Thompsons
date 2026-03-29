-- Add share tokens to journal entries
alter table journal_entries
  add column if not exists is_public boolean not null default false,
  add column if not exists share_token text unique;

-- Add share tokens to voice memos
alter table voice_memos
  add column if not exists is_public boolean not null default false,
  add column if not exists share_token text unique;

create index if not exists idx_journal_entries_share_token on journal_entries(share_token) where share_token is not null;
create index if not exists idx_voice_memos_share_token on voice_memos(share_token) where share_token is not null;
