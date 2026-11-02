-- Chạy bằng Supabase SQL Editor (quyền chủ dự án); không chạy SQL này trên GitHub Pages.
-- Một sự kiện/competition_state với revision chống ghi đè, chỉ thành viên mới đọc được.
create table if not exists public.competition_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check(role in ('admin','referee','viewer'))
);
create table if not exists public.competition_state (
  id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,64}$'),
  revision bigint not null default 0 check(revision >= 0),
  data jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists public.competition_audit (
  id bigint generated always as identity primary key,
  competition_id text not null,
  revision bigint not null,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  team_count integer not null,
  invention_count integer not null,
  battle_count integer not null,
  layout_count integer not null
);
create index if not exists competition_audit_competition_revision on public.competition_audit(competition_id,revision desc);

alter table public.competition_members enable row level security;
alter table public.competition_state enable row level security;
alter table public.competition_audit enable row level security;
revoke all on public.competition_members from anon,authenticated;
revoke all on public.competition_state from anon,authenticated;
revoke all on public.competition_audit from anon,authenticated;
grant select on public.competition_members to authenticated;
grant select on public.competition_state to authenticated;
grant update(data,revision) on public.competition_state to authenticated;
-- Không cấp INSERT/DELETE/TRUNCATE cho phía trình duyệt.
create policy "read own membership" on public.competition_members
  for select to authenticated using(user_id=(select auth.uid()));
create policy "members can read competition" on public.competition_state
  for select to authenticated
  using(exists(select 1 from public.competition_members m where m.user_id=(select auth.uid())));
create policy "editors can update competition" on public.competition_state
  for update to authenticated
  using(exists(select 1 from public.competition_members m where m.user_id=(select auth.uid()) and m.role in ('admin','referee')))
  with check(exists(select 1 from public.competition_members m where m.user_id=(select auth.uid()) and m.role in ('admin','referee')));

create or replace function public.guard_competition_update()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'Missing authenticated user'; end if;
  if new.id is distinct from old.id or new.revision <> old.revision + 1 then
    raise exception 'Invalid revision update';
  end if;
  if jsonb_typeof(new.data) <> 'object' or new.data->>'version' <> '1'
     or jsonb_typeof(new.data->'teams') <> 'array'
     or jsonb_typeof(new.data->'invention') <> 'array'
     or jsonb_typeof(new.data->'battles') <> 'array'
     or jsonb_typeof(new.data->'layouts') <> 'array' then
    raise exception 'Invalid ENJOY AI data structure';
  end if;
  if octet_length(new.data::text)>8000000 then
    raise exception 'Competition snapshot exceeds 8 MB';
  end if;
  new.updated_by:=auth.uid();new.updated_at:=now();
  insert into public.competition_audit(competition_id,revision,updated_by,team_count,invention_count,battle_count,layout_count)
  values(new.id,new.revision,auth.uid(),jsonb_array_length(new.data->'teams'),
  jsonb_array_length(new.data->'invention'),jsonb_array_length(new.data->'battles'),
  jsonb_array_length(new.data->'layouts'));
  return new;
end;
$$;
drop trigger if exists competition_guard on public.competition_state;
create trigger competition_guard before update on public.competition_state
for each row execute function public.guard_competition_update();

-- Dữ liệu khởi tạo: chỉ làm sau khi đã sao lưu/kiểm tra bảng chưa tồn tại.
insert into public.competition_state(id,data)
values('main','{"version":1,"rounds":2,"teams":[],"invention":[],"battles":[],"layouts":[],"placementApprovals":{},"bonusEnabled":false,"bonusDescription":""}'::jsonb)
on conflict(id) do nothing;
-- Tạo tài khoản trong Authentication > Users, sau đó cấp quyền thủ công:
-- insert into public.competition_members(user_id,role)
-- select id,'admin' from auth.users where email='email-quan-tri@example.com'
-- on conflict(user_id) do update set role=excluded.role;
