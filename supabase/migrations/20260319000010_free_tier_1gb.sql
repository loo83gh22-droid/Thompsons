-- Bump free tier storage from 500 MB to 1 GB

-- Update column default so new families get 1 GB
alter table families
  alter column storage_limit_bytes set default 1073741824;

-- Update all existing free families still at 500 MB
update families
set storage_limit_bytes = 1073741824
where plan_type = 'free'
  and storage_limit_bytes = 524288000;
