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
create table public.competition_events (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,64}$'),
  name text not null check (length(btrim(name)) between 2 and 120),
  season text not null default '2026' check (length(btrim(season)) between 1 and 32),
  event_date date,
  venue text not null default '',
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index competition_events_created_by_idx on public.competition_events(created_by) where created_by is not null;
create index competition_events_created_at_idx on public.competition_events(created_at desc);

create table public.competition_state (
  id text primary key references public.competition_events(id) on update cascade on delete restrict check (id ~ '^[a-zA-Z0-9_-]{1,64}$'),
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
create index competition_state_updated_by_idx on public.competition_state(updated_by) where updated_by is not null;
create index competition_audit_updated_by_idx on app_private.competition_audit(updated_by) where updated_by is not null;

alter table public.competition_members enable row level security;
alter table public.competition_events enable row level security;
alter table public.competition_state enable row level security;
alter table app_private.competition_audit enable row level security;
revoke all on public.competition_members from public, anon, authenticated;
revoke all on public.competition_events from public, anon, authenticated;
revoke all on public.competition_state from public, anon, authenticated;
revoke all on app_private.competition_audit from public, anon, authenticated;
grant select on public.competition_members to authenticated;
grant select, insert on public.competition_events to authenticated;
grant select, insert on public.competition_state to authenticated;
grant update(data,revision) on public.competition_state to authenticated;

create policy members_read_self on public.competition_members for select
  to authenticated using(user_id=(select auth.uid()));
create policy competition_events_read_by_members on public.competition_events for select
  to authenticated using(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid())));
create policy competition_events_insert_by_admin on public.competition_events for insert
  to authenticated with check(created_by=(select auth.uid()) and exists(
    select 1 from public.competition_members m where m.user_id=(select auth.uid()) and m.role='admin'));
create policy competition_read_by_members on public.competition_state for select
  to authenticated using(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid())));
create policy competition_insert_by_admin on public.competition_state for insert
  to authenticated with check(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid()) and m.role='admin'));
create policy competition_update_by_referees on public.competition_state for update
  to authenticated
  using(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid()) and m.role in ('admin','referee'))
    and exists(select 1 from public.competition_events e where e.id=competition_state.id and e.status='active'))
  with check(exists(select 1 from public.competition_members m
    where m.user_id=(select auth.uid()) and m.role in ('admin','referee'))
    and exists(select 1 from public.competition_events e where e.id=competition_state.id and e.status='active'));

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
  if new.data->>'version' is distinct from '1'
     or jsonb_typeof(new.data->'teams') is distinct from 'array'
     or jsonb_typeof(new.data->'invention') is distinct from 'array'
     or jsonb_typeof(new.data->'battles') is distinct from 'array'
     or jsonb_typeof(new.data->'layouts') is distinct from 'array'
     or jsonb_typeof(new.data->'rounds') is distinct from 'number'
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

create function public.create_competition_event(
  p_id text,p_name text,p_season text,p_event_date date,p_venue text,p_initial_data jsonb
)
returns setof public.competition_events
language plpgsql security invoker set search_path=''
as $fn$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null or not exists(select 1 from public.competition_members m
    where m.user_id=v_user and m.role='admin') then
    raise exception 'Only an admin can create a competition event';
  end if;
  if p_id is null or p_id !~ '^[a-zA-Z0-9_-]{1,64}$' or p_id='main'
    or p_name is null or length(btrim(p_name)) not between 2 and 120
    or p_season is null or length(btrim(p_season)) not between 1 and 32
    or p_venue is null or length(p_venue)>160 then
    raise exception 'Invalid competition event metadata';
  end if;
  if p_initial_data is null or jsonb_typeof(p_initial_data) is distinct from 'object'
    or p_initial_data->>'version' is distinct from '1'
    or jsonb_typeof(p_initial_data->'teams') is distinct from 'array'
    or jsonb_typeof(p_initial_data->'invention') is distinct from 'array'
    or jsonb_typeof(p_initial_data->'battles') is distinct from 'array'
    or jsonb_typeof(p_initial_data->'layouts') is distinct from 'array'
    or jsonb_typeof(p_initial_data->'rounds') is distinct from 'number' then
    raise exception 'Invalid Enjoy AI initial data format';
  end if;
  if (p_initial_data->>'rounds')::numeric not between 1 and 20 then
    raise exception 'Enjoy AI rounds must be between 1 and 20';
  end if;
  insert into public.competition_events(id,name,season,event_date,venue,status,created_by)
  values(p_id,btrim(p_name),btrim(p_season),p_event_date,p_venue,'active',v_user);
  insert into public.competition_state(id,revision,data) values(p_id,0,p_initial_data);
  return query select e.* from public.competition_events e where e.id=p_id;
end
$fn$;
revoke all on function public.create_competition_event(text,text,text,date,text,jsonb) from public,anon;
grant execute on function public.create_competition_event(text,text,text,date,text,jsonb) to authenticated;

insert into public.competition_events(id,name,season,status)
values('main','Đợt thi hiện tại','2026','active');
insert into public.competition_state(id,data)
values('main', '{"version":1,"rounds":2,"teams":[],"invention":[],"battles":[],"layouts":[],"placementApprovals":{},"bonusEnabled":false,"bonusDescription":""}'::jsonb);
