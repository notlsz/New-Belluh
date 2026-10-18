insert into auth.users values ('aaaaaaaa-0000-0000-0000-000000000001','jimmy@test.com'),
 ('bbbbbbbb-0000-0000-0000-000000000001','ana@test.com'),('bbbbbbbb-0000-0000-0000-000000000002','bea@test.com'),
 ('3ccccccc-0000-0000-0000-000000000003','cara@test.com'),('bbbbbbbb-0000-0000-0000-000000000004','dee@test.com'),
 ('bbbbbbbb-0000-0000-0000-000000000005','eli@test.com') on conflict do nothing;
insert into public.profiles (id, email, full_name) values ('aaaaaaaa-0000-0000-0000-000000000001','jimmy@test.com','Jimmy Liu'),
 ('bbbbbbbb-0000-0000-0000-000000000001','ana@test.com','Ana Park'),('bbbbbbbb-0000-0000-0000-000000000002','bea@test.com','Bea Gomez'),
 ('3ccccccc-0000-0000-0000-000000000003','cara@test.com','Cara Wu'),('bbbbbbbb-0000-0000-0000-000000000004','dee@test.com','Dee Shah'),
 ('bbbbbbbb-0000-0000-0000-000000000005','eli@test.com','Eli Ross') on conflict do nothing;
insert into public.partner_connections (user_id, partner_id, status, created_at) values
 ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','connected','2025-12-13'),
 ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','connected','2026-01-13'),
 ('3ccccccc-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','connected','2026-01-12'),
 ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000004','connected','2026-01-13'),
 ('bbbbbbbb-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000005','connected','2026-01-14');
-- Jimmy's own: old types and moods, some untagged, some with the first partner (c1), three with Cara
insert into public.journal_entries (user_id, content, title, type, mood, is_shared, tags, created_at, photo_url, audio_url) values
 ('aaaaaaaa-0000-0000-0000-000000000001','First night we cooked together, the kitchen smelled like garlic for days.',null,'text','Joy',true,null,'2025-12-14',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','Walked the long way home from the train.',null,'text','Observation',true,'{}','2025-12-20',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','She laughed at my terrible pun.',null,'journal','Appreciation',false,null,'2025-12-28',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','We argued about the dishes, then made up.',null,'text','Conflict',true,'{circle:c1}','2026-01-02',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','What made you smile today? Her voice note.','What made you smile today?','Prompt','Grateful',true,'{circle:c1}','2026-01-05',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','',null,'Photo','Playful',true,'{circle:c1}','2026-01-08','https://ctbsycrlakdanfzbaqmz.supabase.co/storage/v1/object/public/journal-media/photos/old.jpg',null),
 ('aaaaaaaa-0000-0000-0000-000000000001','Voice note from the beach',null,'Voice','Playful',true,'{circle:c1}','2026-01-10',null,'sb://journal-private/aaaaaaaa-0000-0000-0000-000000000001/voice/a.webm'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Drop: thinking of you',null,'Drop',null,true,'{circle:c1}','2026-02-14',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','A new chapter, coffee with Cara.',null,'Freeform',null,true,'{circle:partner_3ccccccc-0000-0000-0000-000000000003}','2026-05-20',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','Cara and I painted the hallway.',null,'Prompt','Romantic',true,'{circle:partner_3ccccccc-0000-0000-0000-000000000003}','2026-05-25',null,null),
 ('aaaaaaaa-0000-0000-0000-000000000001','Notes on us',null,'Milestone',null,true,'{system_facts,circle:c1}','2026-01-01',null,null);
-- Custom chapters he made (one archived), and a member added to c1
insert into public.journal_entries (user_id, title, content, type, is_shared, tags, created_at) values
 ('aaaaaaaa-0000-0000-0000-000000000001','College friends','#cbd5e1','Milestone',true,'{system_circle_def,status:archived}','2026-01-20'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Family','#cbd5e1','Milestone',true,'{system_circle_def}','2026-01-21'),
 ('aaaaaaaa-0000-0000-0000-000000000001','Roommates','#cbd5e1','Milestone',true,'{system_circle_def}','2026-01-22'),
 ('aaaaaaaa-0000-0000-0000-000000000001','member','','Milestone',true,'{system_circle_member,circle:c1,member:bbbbbbbb-0000-0000-0000-000000000005}','2026-01-23');
-- Partners' shared entries, tagged c1 from their own side
insert into public.journal_entries (user_id, content, type, mood, is_shared, tags, created_at) values
 ('bbbbbbbb-0000-0000-0000-000000000001','Ana: our first winter together.','text','Joy',true,'{circle:c1}','2025-12-15'),
 ('bbbbbbbb-0000-0000-0000-000000000001','Ana: he fixed my bike.','Freeform',null,true,'{circle:c1}','2026-01-03'),
 ('bbbbbbbb-0000-0000-0000-000000000002','Bea: brunch with Eli.','text',null,true,'{circle:c1}','2026-01-15'),
 ('3ccccccc-0000-0000-0000-000000000003','Cara: the hallway is blue now.','Freeform',null,true,'{circle:c1}','2026-05-26'),
 ('bbbbbbbb-0000-0000-0000-000000000004','Dee: game night.','text',null,true,'{circle:c1}','2026-01-16');
