-- The shape someone gave Belluh (a giraffe, a heart) stays with their account, so it's still that shape on any
-- device and after signing out and back in. Null means plain water.
alter table public.agent_settings add column if not exists shape jsonb check (shape is null or pg_column_size(shape) < 8000);
grant insert (shape), update (shape) on public.agent_settings to authenticated;
