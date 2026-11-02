-- Belluh Memory places cache: public OpenStreetMap data per 0.01 degree cell (about 1 km), for the memory-places
-- function. No user column and nothing about who asked; only the service role reads or writes it (RLS on, no policies).
create table if not exists public.memory_place_cells (
  cell text primary key check (cell ~ '^-?[0-9]{1,2}\.[0-9]{2},-?[0-9]{1,3}\.[0-9]{2}$'),
  data jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.memory_place_cells enable row level security;
revoke all on public.memory_place_cells from anon, authenticated;

create index if not exists memory_place_cells_fetched_at on public.memory_place_cells (fetched_at);
