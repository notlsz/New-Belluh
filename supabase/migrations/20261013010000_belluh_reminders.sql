-- Everything WhatsApp does for dates also works inside Belluh:
-- reminders a week before and on the day arrive in the Belluh tab, and can be paused like WhatsApp's STOP.
alter table public.agent_settings add column if not exists reminders_enabled boolean not null default true;
grant insert (reminders_enabled), update (reminders_enabled) on public.agent_settings to authenticated;

-- At most one reminder per date, per occurrence, per stage (and still one weekly insight and check-in per week)
drop index if exists public.agent_messages_weekly_once;
create unique index if not exists agent_messages_weekly_once
  on public.agent_messages (user_id, (meta->>'kind'), (meta->>'week'))
  where meta->>'kind' in ('weekly', 'checkin', 'reminder');
