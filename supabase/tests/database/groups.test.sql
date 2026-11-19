-- Phase 2 (M2): groups, group members, create/join/lock functions and RLS.
-- Run with: npm run db:test   (needs Docker + the Supabase CLI; CI runs it too)
begin;

create extension if not exists pgtap with schema extensions;

select plan(37);

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
select has_table('public', 'groups', 'groups table exists');
select has_table('public', 'group_members', 'group_members table exists');
select col_is_pk('public', 'group_members', array['group_id', 'user_id'],
  'a player can be in a group only once');
select col_is_unique('public', 'groups', 'join_code', 'join codes are unique');
select is(
  (select relrowsecurity from pg_class where oid = 'public.groups'::regclass),
  true,
  'RLS is enabled on groups'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.group_members'::regclass),
  true,
  'RLS is enabled on group_members'
);
select ok(
  not has_function_privilege('anon', 'public.create_group(text)', 'execute'),
  'logged-out visitors cannot call create_group'
);

-- ---------------------------------------------------------------------------
-- Test players (profiles are created by the sign-up trigger)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', '{"display_name": "Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test', '{"display_name": "Bob"}'),
  ('33333333-3333-3333-3333-333333333333', 'cara@example.test', '{"display_name": "Cara"}');

-- Nine extra players to fill a group to 10.
insert into auth.users (id, email, raw_user_meta_data)
select
  ('99999999-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'filler' || n || '@example.test',
  jsonb_build_object('display_name', 'Filler ' || n)
from generate_series(1, 9) as n;

-- Remembers the groups' ids and codes between the different players below.
-- (A throwaway schema, removed by the rollback at the end.)
create schema test_helpers;
create table test_helpers.test_groups (label text primary key, id uuid, join_code text);
grant usage on schema test_helpers to authenticated;
grant select, insert on test_helpers.test_groups to authenticated;

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Alice creates a group
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

insert into test_helpers.test_groups
select 'crew', g.id, g.join_code from public.create_group('  Friday Crew  ') as g;

select is(
  (select name from public.groups where id = (select id from test_helpers.test_groups where label = 'crew')),
  'Friday Crew',
  'create_group trims the group name'
);

select matches(
  (select join_code from test_helpers.test_groups where label = 'crew'),
  '^[A-Z0-9]{6}$',
  'the join code is 6 capital letters or digits'
);

select is(
  (select leader_id from public.groups where id = (select id from test_helpers.test_groups where label = 'crew')),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'the creator is the leader'
);

select is(
  (select count(*) from public.group_members
   where group_id = (select id from test_helpers.test_groups where label = 'crew'))::int,
  1,
  'the creator is the first member'
);

select is(
  (select is_locked from public.groups where id = (select id from test_helpers.test_groups where label = 'crew')),
  false,
  'a new group is open for joining'
);

select throws_ok(
  $$ select public.create_group('   ') $$,
  'P0001',
  'Group name must be 2 to 50 characters.',
  'create_group rejects a blank name'
);

select throws_ok(
  $$ select public.create_group(repeat('x', 51)) $$,
  'P0001',
  'Group name must be 2 to 50 characters.',
  'create_group rejects a name over 50 characters'
);

-- A second group gets a different code.
insert into test_helpers.test_groups
select 'big', g.id, g.join_code from public.create_group('Big Crew') as g;

select isnt(
  (select join_code from test_helpers.test_groups where label = 'big'),
  (select join_code from test_helpers.test_groups where label = 'crew'),
  'each group gets its own join code'
);

-- ---------------------------------------------------------------------------
-- Bob, not yet a member, cannot see anything; then joins
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select is((select count(*) from public.groups)::int, 0,
  'a non-member cannot see the group');
select is((select count(*) from public.group_members)::int, 0,
  'a non-member cannot see the member list');
select is((select count(*) from public.profiles)::int, 1,
  'a non-member cannot see the leader''s profile');

select throws_ok(
  $$ insert into public.group_members (group_id, user_id)
     values ((select id from test_helpers.test_groups where label = 'crew'),
             '22222222-2222-2222-2222-222222222222') $$,
  '42501',
  null,
  'players cannot add themselves to a group directly (must use join_group)'
);

select throws_ok(
  $$ select public.join_group('ZZZZZZ') $$,
  'P0001',
  'No group found with that code.',
  'join_group rejects an unknown code'
);

select throws_ok(
  $$ select public.join_group('abc') $$,
  'P0001',
  'Enter a valid 6-character group code.',
  'join_group rejects a badly formatted code'
);

select is(
  (select g.id from public.join_group(
     lower((select join_code from test_helpers.test_groups where label = 'crew'))) as g),
  (select id from test_helpers.test_groups where label = 'crew'),
  'join_group accepts the code in lower case and returns the group'
);

select is((select count(*) from public.groups)::int, 1,
  'after joining, the member can see the group');
select is((select count(*) from public.group_members)::int, 2,
  'after joining, the member can see both members');
select is(
  (select array_agg(display_name order by display_name) from public.profiles),
  array['Alice', 'Bob'],
  'group mates can see each other''s display names'
);

select lives_ok(
  $$ select public.join_group((select join_code from test_helpers.test_groups where label = 'crew')) $$,
  'joining a group you are already in succeeds (safe to retry)'
);
select is(
  (select count(*) from public.group_members
   where group_id = (select id from test_helpers.test_groups where label = 'crew'))::int,
  2,
  'joining twice does not add the member twice'
);

select throws_ok(
  $$ select public.lock_group((select id from test_helpers.test_groups where label = 'crew')) $$,
  'P0001',
  'Only the group leader can lock this group.',
  'a member who is not the leader cannot lock the group'
);

select throws_ok(
  $$ update public.groups set is_locked = true
     where id = (select id from test_helpers.test_groups where label = 'crew') $$,
  '42501',
  null,
  'players cannot change a group directly (must use lock_group)'
);

-- ---------------------------------------------------------------------------
-- Alice locks the group
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is(
  (select g.is_locked from public.lock_group((select id from test_helpers.test_groups where label = 'crew')) as g),
  true,
  'the leader can lock the group'
);

-- ---------------------------------------------------------------------------
-- Cara, an outsider
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

select throws_ok(
  $$ select public.join_group((select join_code from test_helpers.test_groups where label = 'crew')) $$,
  'P0001',
  'This group is locked, so no new members can join.',
  'nobody can join a locked group'
);

select throws_ok(
  $$ select public.lock_group((select id from test_helpers.test_groups where label = 'big')) $$,
  'P0001',
  'Only the group leader can lock this group.',
  'a non-member cannot lock someone else''s group'
);

select is(
  (select count(*) from public.profiles)::int,
  1,
  'an outsider still sees only their own profile'
);

-- ---------------------------------------------------------------------------
-- A full group (10 members) rejects an 11th
-- ---------------------------------------------------------------------------
reset role;
insert into public.group_members (group_id, user_id)
select (select id from test_helpers.test_groups where label = 'big'), p.id
from public.profiles p
where p.display_name like 'Filler %';
set local role authenticated;

select is(
  (select count(*) from public.group_members
   where group_id = (select id from test_helpers.test_groups where label = 'big'))::int,
  0,
  'an outsider cannot see the member list of another group'
);

reset role;
select is(
  (select count(*) from public.group_members
   where group_id = (select id from test_helpers.test_groups where label = 'big'))::int,
  10,
  'setup: the big group now has 10 members'
);
set local role authenticated;

select throws_ok(
  $$ select public.join_group((select join_code from test_helpers.test_groups where label = 'big')) $$,
  'P0001',
  'This group is full (10 members).',
  'nobody can join a group that already has 10 members'
);

-- ---------------------------------------------------------------------------
-- Deleting a group removes its member rows
-- ---------------------------------------------------------------------------
reset role;
delete from public.groups where id = (select id from test_helpers.test_groups where label = 'big');
select is(
  (select count(*) from public.group_members
   where group_id = (select id from test_helpers.test_groups where label = 'big'))::int,
  0,
  'deleting a group also deletes its members'
);

select * from finish();
rollback;
