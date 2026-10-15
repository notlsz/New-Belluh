-- Belluh comes to you and does things:
--   reminders Belluh sets when you ask ("remind me to call his mom Sunday at 5"),
--   offers it makes on its own (a birthday coming up, a plan nobody answered, how last night went),
--   and Telegram as a third way to text Belluh (no business number or carrier registration needed).

-- Telegram joins WhatsApp and SMS. A Telegram chat is stored as "tg:<chat id>" in phone_e164.
alter table public.whatsapp_links drop constraint if exists whatsapp_links_channel_check;
alter table public.whatsapp_links add constraint whatsapp_links_channel_check check (channel in ('whatsapp', 'sms', 'telegram'));
alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_channel_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_channel_check check (channel in ('whatsapp', 'sms', 'telegram'));
alter table public.occasions drop constraint if exists occasions_source_check;
alter table public.occasions add constraint occasions_source_check check (source in ('app', 'whatsapp', 'sms', 'telegram'));

-- Reminders Belluh set for someone, sent by the nudges job when they're due
create table if not exists public.personal_reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 2 and 300),
  due_at      timestamptz not null,
  status      text not null default 'scheduled' check (status in ('scheduled', 'sending', 'sent', 'cancelled')),
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index if not exists personal_reminders_due on public.personal_reminders (status, due_at);
create index if not exists personal_reminders_user on public.personal_reminders (user_id, due_at);
alter table public.personal_reminders enable row level security;
drop policy if exists personal_reminders_own on public.personal_reminders;
create policy personal_reminders_own on public.personal_reminders for select to authenticated using (user_id = auth.uid());
revoke all on public.personal_reminders from anon;
revoke insert, update, delete on public.personal_reminders from authenticated;  -- only Belluh writes, after checking who you are

-- Each proactive message at most once (same rule as the weekly loop and date reminders)
drop index if exists public.agent_messages_weekly_once;
create unique index if not exists agent_messages_weekly_once
  on public.agent_messages (user_id, (meta->>'kind'), (meta->>'week'))
  where meta->>'kind' in ('weekly', 'checkin', 'reminder', 'offer', 'plan_nudge', 'after_plan', 'remind');
