-- Thompsons - Death Box checklist with file upload
-- Run in Supabase SQL Editor

-- Add columns for checklist behaviour
alter table public.death_box_items add column if not exists is_completed boolean default false;
alter table public.death_box_items add column if not exists file_url text;

-- Storage bucket for death box files (auth required for upload; readable by authenticated)
insert into storage.buckets (id, name, public)
values ('death-box-files', 'death-box-files', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload death box files"
  on storage.objects for insert
  with check (
    bucket_id = 'death-box-files' and auth.role() = 'authenticated'
  );

create policy "Authenticated users can manage death box files"
  on storage.objects for all
  using (bucket_id = 'death-box-files' and auth.role() = 'authenticated');

-- Seed default checklist (skip if item already exists)
insert into public.death_box_items (title, category, content, sort_order)
select v.title, v.category, v.content, v.sort_order
from (values
  ('Last Will and Testament', 'Legal', 'Your will specifies how assets are distributed and who cares for dependents.', 1),
  ('Revocable Living Trust', 'Legal', 'A trust can help avoid probate and manage assets during life.', 2),
  ('Durable Financial Power of Attorney', 'Legal', 'Authorizes someone to manage finances if you become incapacitated.', 3),
  ('Healthcare Power of Attorney', 'Legal', 'Designates someone to make medical decisions on your behalf.', 4),
  ('Living Will / Advance Care Directive', 'Healthcare', 'Documents your wishes for end-of-life medical care.', 5),
  ('DNR or POLST Orders', 'Healthcare', 'Do Not Resuscitate or Physician Orders for Life-Sustaining Treatment.', 6),
  ('Organ Donation Registration', 'Healthcare', 'Register your wish to donate organs or tissue.', 7),
  ('Life Insurance Policies', 'Financial', 'Policy numbers, company names, and beneficiary information.', 8),
  ('Bank Account Information', 'Financial', 'Account numbers, institutions, and who has access.', 9),
  ('Investment & Retirement Accounts', 'Financial', 'Pension, 401k, IRA, and other investment details.', 10),
  ('Property Deeds & Mortgage Info', 'Financial', 'Real estate documents and mortgage statements.', 11),
  ('Tax Returns & Business Records', 'Financial', 'Recent returns and any business ownership documents.', 12),
  ('Funeral & Burial Preferences', 'Personal', 'Burial, cremation, or green burial wishes. Service details.', 13),
  ('Letters to Loved Ones', 'Personal', 'Final messages, video legacies, or written letters.', 14),
  ('Care Arrangements (Children/Pets)', 'Personal', 'Guardianship plans and pet care instructions.', 15),
  ('Digital Passwords & Account Access', 'Digital', 'Email, social media, cloud storage, and subscription logins.', 16),
  ('Important Contacts', 'Personal', 'Lawyer, executor, accountant, healthcare providers, family.', 17),
  ('Safe Deposit Box Location', 'Financial', 'Bank name, box number, and key location.', 18)
) as v(title, category, content, sort_order)
where not exists (select 1 from public.death_box_items d where d.title = v.title and d.category = v.category);
