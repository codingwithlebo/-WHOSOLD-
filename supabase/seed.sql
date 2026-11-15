-- Test accounts for local development and the demo.
-- TEST DATA ONLY: never use these passwords for anything real.
--
--   alice@test.dev / Password123!
--   bob@test.dev   / Password123!
--   cara@test.dev  / Password123!
--
-- Profiles are created by the on_auth_user_created trigger.
-- Safe to run more than once.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  -- GoTrue fails to log in users whose token columns are NULL.
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  seed.id,
  'authenticated',
  'authenticated',
  seed.email,
  extensions.crypt('Password123!', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  jsonb_build_object('display_name', seed.display_name),
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    ('a1a1a1a1-0000-4000-8000-000000000001'::uuid, 'alice@test.dev', 'Alice'),
    ('b2b2b2b2-0000-4000-8000-000000000002'::uuid, 'bob@test.dev', 'Bob'),
    ('c3c3c3c3-0000-4000-8000-000000000003'::uuid, 'cara@test.dev', 'Cara')
) as seed (id, email, display_name)
on conflict (id) do nothing;

-- Email log-in also needs a matching identity row.
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email in ('alice@test.dev', 'bob@test.dev', 'cara@test.dev')
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );
