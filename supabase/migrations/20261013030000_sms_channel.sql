-- Text Belluh by plain SMS too (Twilio), with exactly what works on WhatsApp:
-- one-tap link, text a date, LIST, FORGET, STOP/START, and reminders a week before and on the day.
-- A person links one phone number; it remembers which channel they linked from and replies there.

alter table public.whatsapp_links
  add column if not exists channel text not null default 'whatsapp';
alter table public.whatsapp_links drop constraint if exists whatsapp_links_channel_check;
alter table public.whatsapp_links add constraint whatsapp_links_channel_check check (channel in ('whatsapp', 'sms'));

alter table public.whatsapp_messages
  add column if not exists channel text not null default 'whatsapp';
alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_channel_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_channel_check check (channel in ('whatsapp', 'sms'));

-- Dates texted by SMS are labelled as such
alter table public.occasions drop constraint if exists occasions_source_check;
alter table public.occasions add constraint occasions_source_check check (source in ('app', 'whatsapp', 'sms'));
