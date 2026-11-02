-- Enjoy AI Competition Desk — initial Supabase PostgreSQL schema (deployed 2026-11-02).
-- Already applied to Supabase project oooiaqnzqcvodjuwnagh as migration enjoy_ai_competition_cloud_v1.
-- Run only against a NEW/EMPTY project; do not rerun on an existing project.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.competition_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check(role in ('admin','referee','viewer')),
  created_at timestamptz not null default now()
);
create table public.competition_state (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,64}$'),
  revision bigint not null default 0 check(revision>=0),
  data jsonb not null check (jsonb_typeof(data)='object'),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table app_private.competition_audit (
  id bigint generated always as identity primary key,
  competition_id text not null references public.competition_state(id) on delete cascade,
  revision bigint not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  team_count integer not null,
  invention_count integer not null,
  battle_count integer not null,
  layout_count integer not null,
  unique(competition_id,revision)
);
create index competition_audit_recent on app_private.competition_audit(competition_id,updated_at desc);

alter table public.competition_members enable row level security;
alter table public.competition_state enable row level security;
alter table app_private.competition_audit enable row level security;
revoke all on public.competition_members from public, anon, authenticated;
revoke all on public.competition_state from public, anon, authenticated;
revoke all on app_private.competition_audit from public, anon, authenticated;
grant select on public.competition_members to authenticated;
grant select on public.competition_state to authenticated;
grant update(data,revision) on public.competition_state to authenticated;

create policy members_read_self on public.competition_members for select
  to authenticated using(user_id=(select auth.uid()));
create policy competition_read_by_members on public.competition_state for select
  to authenticated using(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid())));
create policy competition_update_by_referees on public.competition_state for update
  to authenticated
  using(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid()) and m.role in ('admin','referee')))
  with check(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid()) and m.role in ('admin','referee')));

-- Trigger is SECURITY DEFINER strictly to write an audit row in private schema.
-- It is NOT an exposed RPC; EXECUTE is revoked from PUBLIC/anon/authenticated.
create function app_private.guard_competition_update()
returns trigger language plpgsql security definer
set search_path=''
as $fn$
begin
  if (select auth.uid()) is null then
    raise exception 'Unauthorized update';
  end if;
  if new.id is distinct from old.id
    or new.revision is distinct from old.revision + 1
    or new.updated_by is distinct from old.updated_by
    or new.updated_at is distinct from old.updated_at then
    raise exception 'Invalid revision or immutable field update';
  end if;
  if new.data->>'version' <> '1'
     or jsonb_typeof(new.data->'teams') <> 'array'
     or jsonb_typeof(new.data->'invention') <> 'array'
     or jsonb_typeof(new.data->'battles') <> 'array'
     or jsonb_typeof(new.data->'layouts') <> 'array'
     or jsonb_typeof(new.data->'rounds') <> 'number'
     or (new.data->>'rounds')::numeric not between 1 and 20 then
    raise exception 'Invalid Enjoy AI data format';
  end if;
  if octet_length(new.data::text)>8000000 then
    raise exception 'Enjoy AI state exceeds 8MB limit';
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  insert into app_private.competition_audit
    (competition_id,revision,updated_by,team_count,invention_count,battle_count,layout_count)
  values
    (new.id,new.revision,(select auth.uid()),
     jsonb_array_length(new.data->'teams'),
     jsonb_array_length(new.data->'invention'),
     jsonb_array_length(new.data->'battles'),
     jsonb_array_length(new.data->'layouts'));
  return new;
end
$fn$;
revoke all on function app_private.guard_competition_update() from public, anon, authenticated;
create trigger competition_guard before update on public.competition_state
  for each row execute function app_private.guard_competition_update();

insert into public.competition_state(id,data)
values('main', '{"version":1,"rounds":2,"teams":[],"invention":[],"battles":[],"layouts":[],"placementApprovals":{},"bonusEnabled":false,"bonusDescription":""}'::jsonb);
