-- LINE, where couples in Japan message: one more channel for texting Bella, next to WhatsApp, SMS, Telegram and iMessage.
alter table public.whatsapp_links drop constraint if exists whatsapp_links_channel_check;
alter table public.whatsapp_links add constraint whatsapp_links_channel_check check (channel in ('whatsapp', 'sms', 'telegram', 'imessage', 'line'));
alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_channel_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_channel_check check (channel in ('whatsapp', 'sms', 'telegram', 'imessage', 'line'));
alter table public.occasions drop constraint if exists occasions_source_check;
alter table public.occasions add constraint occasions_source_check check (source in ('app', 'whatsapp', 'sms', 'telegram', 'imessage', 'line'));
