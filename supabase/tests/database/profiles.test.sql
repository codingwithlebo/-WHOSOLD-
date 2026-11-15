-- Phase 1 (M1): profiles table, sign-up trigger and RLS.
-- Run with: npm run db:test   (needs Docker + the Supabase CLI)
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
select has_table('public', 'profiles', 'profiles table exists');
select col_is_pk('public', 'profiles', 'id', 'profiles.id is the primary key');
select col_not_null('public', 'profiles', 'display_name', 'display_name is required');
select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'RLS is enabled on profiles'
);

-- ---------------------------------------------------------------------------
-- Sign-up trigger: a profile is created for every new auth user
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', '{"display_name": "  Alice  "}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test', '{"display_name": "Bob"}'),
  ('33333333-3333-3333-3333-333333333333', 'charlie@example.test', '{}');

select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Alice',
  'trigger copies display_name from sign-up metadata (trimmed)'
);

select is(
  (select display_name from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'charlie',
  'trigger falls back to the email name when no display_name is given'
);

-- ---------------------------------------------------------------------------
-- RLS as Alice (a signed-in user)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is(
  (select count(*) from public.profiles)::int,
  1,
  'a user can only see their own profile'
);

select is(
  (select display_name from public.profiles),
  'Alice',
  'the visible profile is the user''s own'
);

update public.profiles
set display_name = 'Alice B'
where id = '11111111-1111-1111-1111-111111111111';

select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Alice B',
  'a user can update their own display name'
);

-- Updating someone else's row is silently filtered out by RLS.
update public.profiles
set display_name = 'Hacked'
where id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$ update public.profiles set id = gen_random_uuid()
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'a user cannot change their profile id'
);

select throws_ok(
  $$ update public.profiles set display_name = 'A'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514',
  null,
  'display names shorter than 2 characters are rejected'
);

select throws_ok(
  $$ update public.profiles set display_name = repeat('x', 31)
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514',
  null,
  'display names longer than 30 characters are rejected'
);

select throws_ok(
  $$ insert into public.profiles (id, display_name)
     values ('44444444-4444-4444-4444-444444444444', 'Mallory') $$,
  '42501',
  null,
  'users cannot insert profiles directly (only the trigger can)'
);

select throws_ok(
  $$ delete from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'users cannot delete profiles'
);

-- ---------------------------------------------------------------------------
-- Back as the database owner: check Bob's row was untouched
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'Bob',
  'a user cannot update someone else''s profile'
);

-- ---------------------------------------------------------------------------
-- Anonymous visitors cannot read profiles at all
-- ---------------------------------------------------------------------------
set local role anon;

select throws_ok(
  $$ select * from public.profiles $$,
  '42501',
  null,
  'anonymous visitors cannot read profiles'
);

select * from finish();
rollback;
