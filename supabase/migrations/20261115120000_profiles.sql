-- Phase 1 (M1): player profiles.
--
-- One row per auth user, created automatically on sign-up by a trigger.
-- Players can read and rename only their own profile for now. Phase 2 adds a
-- policy so members of the same group can see each other's display names.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint profiles_display_name_length
      check (char_length(display_name) between 2 and 30),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Public player profile, one per auth user. Created by the on_auth_user_created trigger.';

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Privileges: least privilege first, then RLS narrows rows further.
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
-- Only the display name can be changed; id and created_at are fixed.
grant update (display_name) on table public.profiles to authenticated;
-- No insert or delete grants: rows are created by the trigger below and
-- removed when the auth user is deleted (on delete cascade).

create policy "Players can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Players can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- Sign-up trigger
-- ---------------------------------------------------------------------------
-- The frontend sends the chosen name as user metadata (display_name).
-- If it is missing or too short, fall back to the part of the email before @.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen text := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 30);
begin
  if char_length(chosen) < 2 then
    chosen := left(split_part(coalesce(new.email, ''), '@', 1), 30);
  end if;
  if char_length(chosen) < 2 then
    chosen := 'Player';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, chosen);

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates a public.profiles row for every new auth user.';

-- Only the trigger should run this function.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
