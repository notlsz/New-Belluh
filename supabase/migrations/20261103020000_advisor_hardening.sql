-- What Supabase's security and performance advisors flag, fixed in one place. Written to work on whatever the live
-- database has (including tables and functions made before migrations existed), and safe to run more than once.
--
-- 1. Every function in public gets a fixed search_path (advisor: function_search_path_mutable). Functions that belong to
--    an extension are left alone. public then extensions, so a body that uses an extension's function still finds it.
-- 2. Trigger functions that run as their owner (security definer) can't be called by anyone: a trigger fires them, and
--    Postgres checks EXECUTE only when the trigger is created (advisor: anon/authenticated_security_definer_function_executable).
-- 3. Every single-column foreign key gets an index led by that column when it has none, since the policies and the
--    "delete my account" cascades look rows up by these columns (advisor: unindexed_foreign_keys).

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
      and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('alter function %s set search_path = public, extensions', f.sig);
  end loop;
end $$;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prorettype = 'trigger'::regtype
      and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

do $$
declare k record; v_name text;
begin
  for k in
    select c.conrelid::regclass as tbl, cl.relname as tname, a.attname as col
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and n.nspname = 'public' and cardinality(c.conkey) = 1
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    v_name := left(k.tname || '_' || k.col || '_fk', 63);
    execute format('create index if not exists %I on %s (%I)', v_name, k.tbl, k.col);
  end loop;
end $$;
