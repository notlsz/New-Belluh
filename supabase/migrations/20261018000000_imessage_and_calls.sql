-- iMessage joins WhatsApp, SMS and Telegram (through Linq: a real iPhone number, blue bubbles), and Belluh can call a
-- restaurant to book a table once the person says "call for me".

-- iMessage: the person's phone number (or Apple ID email) is stored in phone_e164, like SMS
alter table public.whatsapp_links drop constraint if exists whatsapp_links_channel_check;
alter table public.whatsapp_links add constraint whatsapp_links_channel_check check (channel in ('whatsapp', 'sms', 'telegram', 'imessage'));
alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_channel_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_channel_check check (channel in ('whatsapp', 'sms', 'telegram', 'imessage'));
alter table public.occasions drop constraint if exists occasions_source_check;
alter table public.occasions add constraint occasions_source_check check (source in ('app', 'whatsapp', 'sms', 'telegram', 'imessage'));

-- Calls: the restaurant's number, where the call is, and what came of it
alter table public.bookings add column if not exists phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$');
alter table public.bookings add column if not exists people integer check (people is null or people between 1 and 20);
alter table public.bookings add column if not exists call_status text check (call_status in ('ready', 'calling', 'booked', 'failed'));
alter table public.bookings add column if not exists call_id text;
alter table public.bookings add column if not exists called_at timestamptz;
alter table public.bookings add column if not exists call_summary text check (char_length(call_summary) <= 2000);
create unique index if not exists bookings_call_id on public.bookings (call_id) where call_id is not null;
