-- The language each person reads Belluh in ("ja-JP", "pt-PT", "es-MX"), saved by the app, so what Bella sends on her
-- own (reminders, nudges, "how was it?") reaches them in it
alter table public.agent_settings add column if not exists lang text check (lang is null or lang ~ '^[a-z]{2}(-[A-Z]{2})?$');
grant insert (lang), update (lang) on public.agent_settings to authenticated;
