-- Belluh Memory run reports (after Rollup's sendsRunReports): counts and timings of an indexing run, sent only when the
-- person turned on "Share run reports" in Memory settings and allows "Improving Belluh" in the Privacy Center.
-- No user or device column, no photos, labels, places, text or names; only the service role reads or writes it
-- (RLS on, no policies). The memory-report function deletes rows older than 90 days.
create table if not exists public.memory_run_reports (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  report jsonb not null check (jsonb_typeof(report) = 'object' and octet_length(report::text) < 4096)
);

alter table public.memory_run_reports enable row level security;
revoke all on public.memory_run_reports from anon, authenticated;

create index if not exists memory_run_reports_received_at on public.memory_run_reports (received_at);
