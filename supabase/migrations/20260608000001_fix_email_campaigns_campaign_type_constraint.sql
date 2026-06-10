-- Fix: email_campaigns.campaign_type CHECK constraint had drifted badly.
--
-- The original constraint only permitted the 6 first-generation drip types
-- ('welcome', 'day1_nudge', 'day3_discovery', 'day5_invite', 'day14_upgrade',
-- 'day30_reengagement'). But the notifications cron has since grown to also
-- write many more campaign_type values:
--   - day0_welcome
--   - birthday_<year>_<memberId>
--   - capsule_unlock_<capsuleId>
--   - weekly-digest ISO-week keys (e.g. 2026-W23)
--   - storage_warning_<tier>_<yyyy-mm>
--   - event_<id> / event_<year>_<id>   (new: event reminders)
--
-- Every one of those INSERTs was silently FAILING this CHECK constraint, so
-- the dedup record never persisted. Because the cron uses a multi-day retry
-- window (e.g. matches birthdays 3 AND 4 days out), a missing dedup record
-- means those emails could send again on the retry day — i.e. duplicate
-- sends. Confirmed empirically: email_campaigns contained only drip rows;
-- zero birthday_/capsule_/day0_welcome rows had ever persisted.
--
-- campaign_type is entirely code-controlled (never user input), so the rigid
-- allowlist provided no real safety while actively breaking deduplication and
-- requiring a migration every time a new campaign type is introduced. Replace
-- it with a loose sanity check on length so dedup can never silently break
-- again. All existing rows satisfy this check.

alter table public.email_campaigns
  drop constraint if exists email_campaigns_campaign_type_check;

alter table public.email_campaigns
  add constraint email_campaigns_campaign_type_check
  check (char_length(campaign_type) between 1 and 120);
