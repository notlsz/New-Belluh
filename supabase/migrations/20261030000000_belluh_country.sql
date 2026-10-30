-- The country someone lives in, when they've told Bella ("we live in Tokyo"). It picks the stores, booking sites and
-- customs Bella uses; without it Bella goes by their time zone. Two-letter code, or null.
alter table public.agent_settings add column if not exists country text check (country is null or country ~ '^[A-Z]{2}$');
