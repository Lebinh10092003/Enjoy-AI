-- Enjoy AI Competition Desk — multi-event support.
-- Safe additive migration: preserves the existing "main" competition_state row.
create table public.competition_events (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,64}$'),
  name text not null check (length(btrim(name)) between 2 and 120),
  season text not null default '2026' check (length(btrim(season)) between 1 and 32),
  event_date date,
  venue text not null default '' check (length(venue) <= 160),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index competition_events_created_by_idx on public.competition_events(created_by) where created_by is not null;
create index competition_events_created_at_idx on public.competition_events(created_at desc);

alter table public.competition_events enable row level security;
revoke all on public.competition_events from public, anon, authenticated;
grant select, insert on public.competition_events to authenticated;

create policy competition_events_read_by_members on public.competition_events
  for select to authenticated
  using (exists (
    select 1 from public.competition_members m
    where m.user_id = (select auth.uid())
  ));

create policy competition_events_insert_by_admin on public.competition_events
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.competition_members m
      where m.user_id = (select auth.uid()) and m.role = 'admin'
    )
  );

-- Preserve the current single-workspace data as the first event.
insert into public.competition_events (id, name, season, status)
values ('main', 'Đợt thi hiện tại', '2026', 'active')
on conflict (id) do nothing;

-- Every scoring workspace must have a matching event record.
alter table public.competition_state
  add constraint competition_state_event_id_fkey
  foreign key (id) references public.competition_events(id)
  on update cascade on delete restrict;

-- Admins may create a new state row through the transactional RPC below.
grant insert on public.competition_state to authenticated;
create policy competition_insert_by_admin on public.competition_state
  for insert to authenticated
  with check (exists (
    select 1 from public.competition_members m
    where m.user_id = (select auth.uid()) and m.role = 'admin'
  ));

-- Archived events remain readable but cannot receive new scores.
drop policy if exists competition_update_by_referees on public.competition_state;
create policy competition_update_by_referees on public.competition_state
  for update to authenticated
  using (
    exists (
      select 1 from public.competition_members m
      where m.user_id = (select auth.uid()) and m.role in ('admin', 'referee')
    )
    and exists (
      select 1 from public.competition_events e
      where e.id = competition_state.id and e.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.competition_members m
      where m.user_id = (select auth.uid()) and m.role in ('admin', 'referee')
    )
    and exists (
      select 1 from public.competition_events e
      where e.id = competition_state.id and e.status = 'active'
    )
  );

-- SECURITY INVOKER is intentional: RLS policies above still enforce admin-only inserts.
create or replace function public.create_competition_event(
  p_id text,
  p_name text,
  p_season text,
  p_event_date date,
  p_venue text,
  p_initial_data jsonb
)
returns setof public.competition_events
language plpgsql
security invoker
set search_path = ''
as $fn$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null or not exists (
    select 1 from public.competition_members m
    where m.user_id = v_user and m.role = 'admin'
  ) then
    raise exception 'Only an admin can create a competition event';
  end if;

  if p_id is null or p_id !~ '^[a-zA-Z0-9_-]{1,64}$' or p_id = 'main' then
    raise exception 'Invalid competition event id';
  end if;
  if p_name is null or length(btrim(p_name)) not between 2 and 120 then
    raise exception 'Competition event name must contain 2 to 120 characters';
  end if;
  if p_season is null or length(btrim(p_season)) not between 1 and 32 then
    raise exception 'Invalid competition season';
  end if;
  if p_venue is null or length(p_venue) > 160 then
    raise exception 'Venue must not exceed 160 characters';
  end if;

  if p_initial_data is null
     or jsonb_typeof(p_initial_data) <> 'object'
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

  insert into public.competition_events (id, name, season, event_date, venue, status, created_by)
  values (p_id, btrim(p_name), btrim(p_season), p_event_date, p_venue, 'active', v_user);

  insert into public.competition_state (id, revision, data)
  values (p_id, 0, p_initial_data);

  return query
    select e.* from public.competition_events e where e.id = p_id;
end
$fn$;

revoke all on function public.create_competition_event(text, text, text, date, text, jsonb)
  from public, anon;
grant execute on function public.create_competition_event(text, text, text, date, text, jsonb)
  to authenticated;

notify pgrst, 'reload schema';
