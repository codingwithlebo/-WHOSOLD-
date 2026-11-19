-- Phase 2 (M2): groups and group members.
--
-- Players create a group (they become its leader), share its 6-character join
-- code, and friends join with that code. The leader locks the group when
-- everyone is in. Groups hold 2 to 10 members.
--
-- Security model (same pattern as profiles):
--   * Players can only READ groups they belong to (RLS).
--   * Players never write these tables directly. Every change goes through
--     the create_group, join_group and lock_group functions below, which
--     check the rules and run with the owner's rights (security definer).
--   * Members of the same group can see each other's display names.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint groups_name_length
      check (char_length(name) between 2 and 50),
  join_code text not null
    constraint groups_join_code_unique unique
    constraint groups_join_code_format
      check (join_code ~ '^[A-Z0-9]{6}$'),
  leader_id uuid not null references public.profiles (id) on delete cascade,
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.groups is
  'A savings crew. Created by create_group; joined with join_group; locked by lock_group.';

create index groups_leader_id_idx on public.groups (leader_id);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  -- References profiles (not auth.users) so the API can embed display names.
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

comment on table public.group_members is
  'Who is in which group. Rows are added by create_group and join_group only.';

-- The primary key covers lookups by group; this covers "my groups".
create index group_members_user_id_idx on public.group_members (user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- ---------------------------------------------------------------------------
-- Privileges: read-only for signed-in players; all writes go through the
-- functions below.
-- ---------------------------------------------------------------------------
revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_members from anon, authenticated;
grant select on table public.groups to authenticated;
grant select on table public.group_members to authenticated;

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------
-- The private schema is not exposed by the API, so these cannot be called as
-- RPCs. RLS policies call them; they are security definer so a policy on
-- group_members can check group_members without recursing into itself.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members m
    where m.group_id = target_group_id
      and m.user_id = (select auth.uid())
  );
$$;

comment on function private.is_group_member(uuid) is
  'True when the signed-in player is a member of the group. Used by RLS.';

create function private.shares_group_with(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = other_user_id
  );
$$;

comment on function private.shares_group_with(uuid) is
  'True when the signed-in player and the other player are in a group together. Used by RLS.';

-- Join codes use letters and digits that are hard to mix up (no I, O, 0, 1).
-- 32 symbols, so each random byte maps evenly onto the alphabet.
create function private.generate_join_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea := extensions.gen_random_bytes(6);
  code text := '';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(random_bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

comment on function private.generate_join_code() is
  'Random 6-character join code. Uniqueness is enforced by groups_join_code_unique.';

revoke all on function private.is_group_member(uuid) from public;
revoke all on function private.shares_group_with(uuid) from public;
revoke all on function private.generate_join_code() from public;
grant execute on function private.is_group_member(uuid) to authenticated;
grant execute on function private.shares_group_with(uuid) to authenticated;
-- generate_join_code is only called inside create_group (as the owner).

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy "Members can read their groups"
  on public.groups
  for select
  to authenticated
  using (private.is_group_member(id));

create policy "Members can see who is in their groups"
  on public.group_members
  for select
  to authenticated
  using (private.is_group_member(group_id));

-- Promised in the profiles migration: group mates can see each other's names.
create policy "Players can read profiles of their group mates"
  on public.profiles
  for select
  to authenticated
  using (private.shares_group_with(id));

-- ---------------------------------------------------------------------------
-- create_group(group_name): creates the group and adds the caller as leader
-- ---------------------------------------------------------------------------
create function public.create_group(group_name text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  clean_name text := btrim(coalesce(group_name, ''));
  new_group public.groups;
begin
  if caller is null then
    raise exception 'You need to be logged in to create a group.';
  end if;

  if char_length(clean_name) not between 2 and 50 then
    raise exception 'Group name must be 2 to 50 characters.';
  end if;

  -- Retry on the (very rare) chance the random code is already taken.
  for attempt in 1..5 loop
    begin
      insert into public.groups (name, join_code, leader_id)
      values (clean_name, private.generate_join_code(), caller)
      returning * into new_group;
      exit;
    exception when unique_violation then
      if attempt = 5 then
        raise exception 'Could not create a join code. Please try again.';
      end if;
    end;
  end loop;

  insert into public.group_members (group_id, user_id)
  values (new_group.id, caller);

  return new_group;
end;
$$;

comment on function public.create_group(text) is
  'Creates a group with a unique join code. The caller becomes leader and first member.';

-- ---------------------------------------------------------------------------
-- join_group(code): adds the caller to the group with that join code
-- ---------------------------------------------------------------------------
create function public.join_group(code text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  clean_code text := upper(btrim(coalesce(code, '')));
  target public.groups;
  member_count int;
begin
  if caller is null then
    raise exception 'You need to be logged in to join a group.';
  end if;

  if clean_code !~ '^[A-Z0-9]{6}$' then
    raise exception 'Enter a valid 6-character group code.';
  end if;

  -- Lock the group row so two people joining at once cannot pass 10 members.
  select * into target
  from public.groups g
  where g.join_code = clean_code
  for update;

  if not found then
    raise exception 'No group found with that code.';
  end if;

  -- Already a member: nothing to do (safe to retry).
  if exists (
    select 1 from public.group_members m
    where m.group_id = target.id and m.user_id = caller
  ) then
    return target;
  end if;

  if target.is_locked then
    raise exception 'This group is locked, so no new members can join.';
  end if;

  select count(*) into member_count
  from public.group_members m
  where m.group_id = target.id;

  if member_count >= 10 then
    raise exception 'This group is full (10 members).';
  end if;

  insert into public.group_members (group_id, user_id)
  values (target.id, caller);

  return target;
end;
$$;

comment on function public.join_group(text) is
  'Joins the group with this code. Fails if the group is locked or already has 10 members.';

-- ---------------------------------------------------------------------------
-- lock_group(target_group_id): the leader closes the group to new members
-- ---------------------------------------------------------------------------
create function public.lock_group(target_group_id uuid)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target public.groups;
begin
  if caller is null then
    raise exception 'You need to be logged in to lock a group.';
  end if;

  select * into target
  from public.groups g
  where g.id = target_group_id
  for update;

  -- Same message for "no such group" and "not the leader", so the function
  -- does not reveal which groups exist.
  if not found or target.leader_id <> caller then
    raise exception 'Only the group leader can lock this group.';
  end if;

  update public.groups g
  set is_locked = true
  where g.id = target.id
  returning * into target;

  return target;
end;
$$;

comment on function public.lock_group(uuid) is
  'Locks the group so nobody else can join. Leader only.';

-- Only signed-in players can call the functions.
revoke execute on function public.create_group(text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
revoke execute on function public.lock_group(uuid) from public, anon;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.lock_group(uuid) to authenticated;
