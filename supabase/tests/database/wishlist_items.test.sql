-- Phase 3 (M3): wishlist items, RLS and validation.
-- Run with: npm run db:test   (needs Docker + the Supabase CLI; CI runs it too)
begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
select has_table('public', 'wishlist_items', 'wishlist_items table exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.wishlist_items'::regclass),
  true,
  'RLS is enabled on wishlist_items'
);
select ok(
  not has_table_privilege('anon', 'public.wishlist_items', 'select'),
  'logged-out visitors cannot read wishlists'
);

-- ---------------------------------------------------------------------------
-- Setup: Alice leads a group with Bob; Cara is an outsider
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', '{"display_name": "Alice"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test', '{"display_name": "Bob"}'),
  ('33333333-3333-3333-3333-333333333333', 'cara@example.test', '{"display_name": "Cara"}');

insert into public.groups (id, name, join_code, leader_id)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'Wish Crew', 'WISH01',
        '11111111-1111-1111-1111-111111111111');

insert into public.group_members (group_id, user_id)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Bob (a member) adds items
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.wishlist_items (group_id, name, price_cents)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '  Headphones  ', 250000) $$,
  'a member can add an item'
);

select is(
  (select name from public.wishlist_items where price_cents = 250000),
  'Headphones',
  'the item name is trimmed'
);

select is(
  (select added_by from public.wishlist_items where name = 'Headphones'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'the item is recorded as added by the member'
);

select throws_ok(
  $$ insert into public.wishlist_items (group_id, added_by, name, price_cents)
     values ('aaaaaaaa-0000-4000-8000-000000000001',
             '11111111-1111-1111-1111-111111111111', 'Fake', 100) $$,
  '42501',
  null,
  'a member cannot add an item in someone else''s name'
);

select throws_ok(
  $$ insert into public.wishlist_items (group_id, name, price_cents)
     values ('aaaaaaaa-0000-4000-8000-000000000001', '   ', 100) $$,
  'P0001',
  'Item name must be 1 to 100 characters.',
  'a blank item name is rejected'
);

select throws_ok(
  $$ insert into public.wishlist_items (group_id, name, price_cents)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Free lunch', 0) $$,
  'P0001',
  'Price must be between R0.01 and R10 000 000.00.',
  'a zero price is rejected'
);

select throws_ok(
  $$ insert into public.wishlist_items (group_id, name, price_cents)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Island', 1000000001) $$,
  'P0001',
  'Price must be between R0.01 and R10 000 000.00.',
  'a price over R10 million is rejected'
);

select lives_ok(
  $$ update public.wishlist_items set name = 'Wireless headphones', price_cents = 300000
     where name = 'Headphones' $$,
  'a member can edit their own item'
);

select is(
  (select price_cents from public.wishlist_items where name = 'Wireless headphones'),
  300000::bigint,
  'the edit is saved'
);

-- ---------------------------------------------------------------------------
-- Alice (the leader) adds an item, and can manage Bob's
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

insert into public.wishlist_items (group_id, name, price_cents)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'Concert tickets', 120000);

select is(
  (select count(*) from public.wishlist_items)::int,
  2,
  'members see every item in their group'
);

select is(
  (select sum(price_cents) from public.wishlist_items
   where group_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  420000::numeric,
  'the fund is the sum of the item prices'
);

select lives_ok(
  $$ update public.wishlist_items set price_cents = 280000
     where name = 'Wireless headphones' $$,
  'the leader can edit a member''s item'
);

select is(
  (select price_cents from public.wishlist_items where name = 'Wireless headphones'),
  280000::bigint,
  'the leader''s edit is saved'
);

select throws_ok(
  $$ update public.wishlist_items set added_by = '11111111-1111-1111-1111-111111111111'
     where name = 'Wireless headphones' $$,
  '42501',
  null,
  'nobody can change who added an item'
);

select throws_ok(
  $$ update public.wishlist_items set group_id = gen_random_uuid()
     where name = 'Wireless headphones' $$,
  '42501',
  null,
  'nobody can move an item to another group'
);

-- ---------------------------------------------------------------------------
-- Bob cannot change Alice's item
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

update public.wishlist_items set price_cents = 1 where name = 'Concert tickets';
delete from public.wishlist_items where name = 'Concert tickets';

select is(
  (select price_cents from public.wishlist_items where name = 'Concert tickets'),
  120000::bigint,
  'a member cannot edit someone else''s item'
);

select is(
  (select count(*) from public.wishlist_items where name = 'Concert tickets')::int,
  1,
  'a member cannot delete someone else''s item'
);

select lives_ok(
  $$ delete from public.wishlist_items where name = 'Wireless headphones' $$,
  'a member can delete their own item'
);

select is(
  (select count(*) from public.wishlist_items where name = 'Wireless headphones')::int,
  0,
  'the delete is saved'
);

-- ---------------------------------------------------------------------------
-- Cara, an outsider
-- ---------------------------------------------------------------------------
set local request.jwt.claims to
  '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

select is(
  (select count(*) from public.wishlist_items)::int,
  0,
  'an outsider cannot see the group''s wishlist'
);

select throws_ok(
  $$ insert into public.wishlist_items (group_id, name, price_cents)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'Sneaky item', 100) $$,
  '42501',
  null,
  'an outsider cannot add items to the group'
);

delete from public.wishlist_items;
reset role;
-- Counted as the database owner (no RLS), so filter to the test group.
select is(
  (select count(*) from public.wishlist_items
   where group_id = 'aaaaaaaa-0000-4000-8000-000000000001')::int,
  1,
  'an outsider cannot delete the group''s items'
);

-- ---------------------------------------------------------------------------
-- A wishlist holds at most 50 items
-- ---------------------------------------------------------------------------
insert into public.wishlist_items (group_id, added_by, name, price_cents)
select 'aaaaaaaa-0000-4000-8000-000000000001',
       '11111111-1111-1111-1111-111111111111', 'Filler ' || n, 100
from generate_series(1, 49) as n;

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.wishlist_items (group_id, name, price_cents)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'One too many', 100) $$,
  'P0001',
  'This wishlist is full (50 items).',
  'a 51st item is rejected'
);

-- ---------------------------------------------------------------------------
-- Leaving data tidy: deleting the group deletes its wishlist
-- ---------------------------------------------------------------------------
reset role;
delete from public.groups where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(
  (select count(*) from public.wishlist_items
   where group_id = 'aaaaaaaa-0000-4000-8000-000000000001')::int,
  0,
  'deleting a group also deletes its wishlist'
);

select * from finish();
rollback;
