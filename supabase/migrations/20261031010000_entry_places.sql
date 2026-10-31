-- Where an entry was written, for the love map: from a photo's GPS or, if they turned places on, from the phone when
-- they wrote it. Only coordinates and an optional place name; nothing about routes or tracking.
alter table public.journal_entries add column if not exists lat double precision;
alter table public.journal_entries add column if not exists lng double precision;
alter table public.journal_entries add column if not exists place text;
do $$ begin
  alter table public.journal_entries add constraint journal_entries_latlng_ok check (
    (lat is null and lng is null) or (lat between -90 and 90 and lng between -180 and 180));
exception when duplicate_object then null; end $$;
