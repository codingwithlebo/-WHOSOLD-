-- Phase 3 (M3): the group wishlist. Its total is the fund the group plays for.
--
-- Members add, edit and delete items straight from the app (RLS decides who
-- may do what), so no extra functions are needed:
--   * every member can read the group's items and add new ones
--   * a member can edit or delete their own items; the leader can edit or
--     delete any item in the group
--   * prices are stored in cents (R12.50 = 1250)
-- Phase 4 adds "no changes while a round is open" once rounds exist.

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  added_by uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  name text not null
    constraint wishlist_items_name_length
      check (char_length(name) between 1 and 100),
  -- Up to R10 million per item, so totals stay exact in JavaScript numbers.
  price_cents bigint not null
    constraint wishlist_items_price_range
      check (price_cents between 1 and 1000000000),
  created_at timestamptz not null default now()
);

comment on table public.wishlist_items is
  'Items a group wants. The sum of price_cents is the group''s fund.';
comment on column public.wishlist_items.price_cents is
  'Price in cents (R1.00 = 100).';

create index wishlist_items_group_id_idx on public.wishlist_items (group_id);
create index wishlist_items_added_by_idx on public.wishlist_items (added_by);

alter table public.wishlist_items enable row level security;

-- ---------------------------------------------------------------------------
-- Privileges: players choose the group, name and price; the id, owner and
-- timestamp are set by the database. Only name and price can be edited.
-- ---------------------------------------------------------------------------
revoke all on table public.wishlist_items from anon, authenticated;
grant select, delete on table public.wishlist_items to authenticated;
grant insert (group_id, name, price_cents) on table public.wishlist_items to authenticated;
grant update (name, price_cents) on table public.wishlist_items to authenticated;

-- ---------------------------------------------------------------------------
-- Helper for "the leader can manage any item"
-- ---------------------------------------------------------------------------
create function private.is_group_leader(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = target_group_id
      and g.leader_id = (select auth.uid())
  );
$$;

comment on function private.is_group_leader(uuid) is
  'True when the signed-in player leads the group. Used by RLS.';

revoke all on function private.is_group_leader(uuid) from public;
grant execute on function private.is_group_leader(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy "Members can read their group's wishlist"
  on public.wishlist_items
  for select
  to authenticated
  using (private.is_group_member(group_id));

create policy "Members can add items to their group's wishlist"
  on public.wishlist_items
  for insert
  to authenticated
  with check (
    private.is_group_member(group_id)
    and added_by = (select auth.uid())
  );

create policy "Owners and the leader can edit items"
  on public.wishlist_items
  for update
  to authenticated
  using (
    private.is_group_member(group_id)
    and (added_by = (select auth.uid()) or private.is_group_leader(group_id))
  )
  with check (
    private.is_group_member(group_id)
    and (added_by = (select auth.uid()) or private.is_group_leader(group_id))
  );

create policy "Owners and the leader can delete items"
  on public.wishlist_items
  for delete
  to authenticated
  using (
    private.is_group_member(group_id)
    and (added_by = (select auth.uid()) or private.is_group_leader(group_id))
  );

-- ---------------------------------------------------------------------------
-- Friendly validation: trims the name and explains what is wrong, so the UI
-- can show the message as is (instead of a constraint name).
-- ---------------------------------------------------------------------------
create function private.check_wishlist_item()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(coalesce(new.name, ''));

  if char_length(new.name) not between 1 and 100 then
    raise exception 'Item name must be 1 to 100 characters.';
  end if;

  if new.price_cents is null or new.price_cents not between 1 and 1000000000 then
    raise exception 'Price must be between R0.01 and R10 000 000.00.';
  end if;

  if tg_op = 'INSERT' and (
    select count(*) from public.wishlist_items w where w.group_id = new.group_id
  ) >= 50 then
    raise exception 'This wishlist is full (50 items).';
  end if;

  return new;
end;
$$;

comment on function private.check_wishlist_item() is
  'Trims and validates wishlist items with player-friendly messages.';

revoke all on function private.check_wishlist_item() from public;

create trigger check_wishlist_item
  before insert or update on public.wishlist_items
  for each row execute function private.check_wishlist_item();
