-- Secure round, choice, quiz and release behavior.
-- Run with: npm run db:test
begin;

create extension if not exists pgtap with schema extensions;

select plan(53);

select has_table('public', 'rounds', 'rounds table exists');
select has_table('public', 'choices', 'choices table exists');
select has_table('public', 'questions', 'questions table exists');
select has_table('public', 'question_answers', 'private answer table exists');
select has_table('public', 'quiz_attempts', 'quiz attempts table exists');
select has_table('public', 'quiz_responses', 'quiz responses table exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.rounds'::regclass),
  true,
  'RLS is enabled on rounds'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.choices'::regclass),
  true,
  'RLS is enabled on choices'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.question_answers'::regclass),
  true,
  'RLS is enabled on question answers'
);
select ok(
  not has_table_privilege('authenticated', 'public.choices', 'select')
  and not has_table_privilege('authenticated', 'public.question_answers', 'select')
  and not has_table_privilege('authenticated', 'public.quiz_attempts', 'select')
  and not has_table_privilege('authenticated', 'public.quiz_responses', 'select'),
  'game secrets cannot be selected directly by authenticated users'
);
select is((select count(*)::integer from public.questions), 30,
  'the seeded quiz has 30 questions');
select ok(
  not has_function_privilege('anon', 'public.start_round(uuid,timestamp with time zone,timestamp with time zone,timestamp with time zone)', 'execute'),
  'anonymous callers cannot start rounds'
);
select ok(
  not has_function_privilege('authenticated', 'private.resolve_round(uuid)', 'execute'),
  'members cannot resolve rounds directly'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('44444444-4444-4444-4444-444444444444', 'round-leader@example.test', '{"display_name": "Round Leader"}'),
  ('55555555-5555-5555-5555-555555555555', 'round-member@example.test', '{"display_name": "Round Member"}'),
  ('66666666-6666-6666-6666-666666666666', 'round-outsider@example.test', '{"display_name": "Round Outsider"}');

insert into public.groups (id, name, join_code, leader_id, is_locked)
values
  ('aaaaaaaa-1111-4111-8111-111111111111', 'Round Crew', 'RND001',
   '44444444-4444-4444-4444-444444444444', true),
  ('aaaaaaaa-2222-4222-8222-222222222222', 'Quiz Crew', 'RND002',
   '44444444-4444-4444-4444-444444444444', true),
  ('aaaaaaaa-3333-4333-8333-333333333333', 'Unlocked Crew', 'RND003',
   '44444444-4444-4444-4444-444444444444', false);

insert into public.group_members (group_id, user_id)
values
  ('aaaaaaaa-1111-4111-8111-111111111111', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-1111-4111-8111-111111111111', '55555555-5555-5555-5555-555555555555'),
  ('aaaaaaaa-2222-4222-8222-222222222222', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-2222-4222-8222-222222222222', '55555555-5555-5555-5555-555555555555');

insert into public.wishlist_items (group_id, added_by, name, price_cents)
values
  ('aaaaaaaa-1111-4111-8111-111111111111', '44444444-4444-4444-4444-444444444444', 'Round item', 10000),
  ('aaaaaaaa-2222-4222-8222-222222222222', '44444444-4444-4444-4444-444444444444', 'Quiz item', 10000);

create schema test_helpers;
create table test_helpers.game_rounds (label text primary key, id uuid);
create table test_helpers.quiz_fixture (
  round_id uuid,
  attempt_id uuid,
  first_question_id uuid,
  options text[]
);
create table test_helpers.answer_keys (
  round_id uuid,
  question_index integer,
  question_id uuid,
  correct_index smallint
);
grant usage on schema test_helpers to authenticated;
grant select, insert on test_helpers.game_rounds to authenticated;
grant select, insert on test_helpers.quiz_fixture to authenticated;
grant select, insert on test_helpers.answer_keys to authenticated;

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';

insert into test_helpers.game_rounds
select 'choices', public.start_round(
  'aaaaaaaa-1111-4111-8111-111111111111',
  clock_timestamp() + interval '1 minute',
  clock_timestamp() + interval '7 minutes',
  clock_timestamp() + interval '1 hour'
);

select ok(
  (select id is not null from test_helpers.game_rounds where label = 'choices'),
  'the locked group leader can start a round with a positive fund'
);
select is(
  (select answered_count from public.get_group_round('aaaaaaaa-1111-4111-8111-111111111111')),
  0,
  'a new round starts with zero answers'
);
select is(
  (select my_choice from public.get_group_round('aaaaaaaa-1111-4111-8111-111111111111')),
  null,
  'the leader sees only their own empty choice'
);
set local request.jwt.claims to
  '{"sub": "66666666-6666-6666-6666-666666666666", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.get_group_round('aaaaaaaa-1111-4111-8111-111111111111') $$,
  'P0001',
  'This group could not be found or you are not a member.',
  'an outsider cannot load a round'
);
set local request.jwt.claims to
  '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';
select throws_ok(
  $$ select public.start_round(
       'aaaaaaaa-1111-4111-8111-111111111111',
       clock_timestamp() + interval '1 minute',
       clock_timestamp() + interval '7 minutes',
       clock_timestamp() + interval '1 hour'
     ) $$,
  'P0001',
  'Only the group leader can start a round.',
  'a non-leader cannot start a round'
);
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ select public.start_round(
       'aaaaaaaa-1111-4111-8111-111111111111',
       clock_timestamp() + interval '1 minute',
       clock_timestamp() + interval '7 minutes',
       clock_timestamp() + interval '1 hour'
     ) $$,
  'P0001',
  'This group already has an active round.',
  'a group cannot start a second active round'
);

reset role;
update public.rounds
set opens_at = clock_timestamp() - interval '1 minute',
    closes_at = clock_timestamp() + interval '6 minutes',
    release_at = clock_timestamp() + interval '1 hour'
where id = (select id from test_helpers.game_rounds where label = 'choices');

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';

select is(
  public.submit_choice((select id from test_helpers.game_rounds where label = 'choices'), 'pass'),
  true,
  'a member can submit a choice while the window is open'
);
select is(
  (select my_choice from public.get_group_round('aaaaaaaa-1111-4111-8111-111111111111')),
  'pass',
  'a member sees their own submitted choice'
);
select is(
  (select answered_count from public.get_group_round('aaaaaaaa-1111-4111-8111-111111111111')),
  1,
  'the group sees only the aggregate answer count'
);
select throws_ok(
  $$ select public.submit_choice(
       (select id from test_helpers.game_rounds where label = 'choices'),
       'double'
     ) $$,
  'P0001',
  'Your choice has already been submitted.',
  'a submitted choice cannot be changed'
);
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select is(
  (select my_choice from public.get_group_round('aaaaaaaa-1111-4111-8111-111111111111')),
  null,
  'the leader cannot see the other member''s choice'
);
select throws_ok(
  $$ select * from public.choices $$,
  '42501',
  null,
  'members cannot read the choices table directly'
);
select throws_ok(
  $$ insert into public.wishlist_items (group_id, name, price_cents)
     values ('aaaaaaaa-1111-4111-8111-111111111111', 'Late item', 100) $$,
  'P0001',
  'The wishlist cannot change while a round is active.',
  'the fund cannot change during an active round'
);

reset role;
update public.rounds
set opens_at = statement_timestamp() - interval '10 minutes',
    closes_at = statement_timestamp() - interval '1 second'
where id = (select id from test_helpers.game_rounds where label = 'choices');
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ select public.submit_choice(
       (select id from test_helpers.game_rounds where label = 'choices'),
       'double'
     ) $$,
  'P0001',
  'The choice window is closed.',
  'a choice after the close time is rejected'
);

insert into test_helpers.game_rounds
select 'quiz', public.start_round(
  'aaaaaaaa-2222-4222-8222-222222222222',
  clock_timestamp() + interval '1 minute',
  clock_timestamp() + interval '7 minutes',
  clock_timestamp() + interval '1 hour'
);

reset role;
update public.rounds
set opens_at = clock_timestamp() - interval '1 minute',
    closes_at = clock_timestamp() + interval '6 minutes',
    release_at = clock_timestamp() + interval '1 hour'
where id = (select id from test_helpers.game_rounds where label = 'quiz');
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';

select is(
  public.submit_choice((select id from test_helpers.game_rounds where label = 'quiz'), 'double'),
  true,
  'a member can submit Double'
);
insert into test_helpers.quiz_fixture
select
  (select id from test_helpers.game_rounds where label = 'quiz'),
  attempt_id,
  question_id,
  options
from public.start_quiz((select id from test_helpers.game_rounds where label = 'quiz'));
select is(
  (select cardinality(options) from test_helpers.quiz_fixture),
  4,
  'the quiz returns four options for a question'
);
select throws_ok(
  $$ select * from public.start_quiz(
       (select id from test_helpers.game_rounds where label = 'quiz')
     ) $$,
  'P0001',
  'You have already started this quiz.',
  'a member cannot start a second quiz attempt'
);
select ok(
  (select row_to_json(q)::text !~ '"(correct_index|is_correct|score|passed)"'
   from public.get_quiz_state((select id from test_helpers.game_rounds where label = 'quiz')) q),
  'quiz state does not expose answers or score'
);
set local request.jwt.claims to
  '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';
select throws_ok(
  $$ select public.answer_question(
       (select attempt_id from test_helpers.quiz_fixture),
       (select first_question_id from test_helpers.quiz_fixture),
       4
     ) $$,
  'P0001',
  'Quiz attempt not found.',
  'another member cannot answer an attempt'
);

reset role;
insert into test_helpers.answer_keys
select
  a.round_id,
  question_number,
  a.question_ids[question_number],
  answer.correct_index
from public.quiz_attempts a
cross join generate_series(1, 5) as question_number
join public.question_answers answer
  on answer.question_id = a.question_ids[question_number]
where a.id = (select attempt_id from test_helpers.quiz_fixture);
update public.quiz_attempts
set current_question_served_at = clock_timestamp() - interval '21 seconds'
where id = (select attempt_id from test_helpers.quiz_fixture);

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';

select throws_ok(
  $$ select * from public.answer_question(
       (select attempt_id from test_helpers.quiz_fixture),
       (select question_id from test_helpers.answer_keys where question_index = 2),
       (select correct_index from test_helpers.answer_keys where question_index = 2)
     ) $$,
  'P0001',
  'This quiz question is no longer current.',
  'a member cannot skip ahead to a later question'
);
select ok(
  (select row_to_json(state)::text !~ '"(correct_index|is_correct|score|passed)"'
   from public.answer_question(
     (select attempt_id from test_helpers.quiz_fixture),
     (select question_id from test_helpers.answer_keys where question_index = 1),
     (select correct_index from test_helpers.answer_keys where question_index = 1)
   ) state),
  'answer responses do not reveal correctness or score'
);
select is(
  (select question_index from public.answer_question(
    (select attempt_id from test_helpers.quiz_fixture),
    (select question_id from test_helpers.answer_keys where question_index = 1),
    (select correct_index from test_helpers.answer_keys where question_index = 1)
  )),
  2,
  'retrying an answer does not submit the next question'
);
select lives_ok(
  $$ select * from public.answer_question(
       (select attempt_id from test_helpers.quiz_fixture),
       (select question_id from test_helpers.answer_keys where question_index = 2),
       (select correct_index from test_helpers.answer_keys where question_index = 2)
     ) $$,
  'the member can submit the next timed answer'
);
select lives_ok(
  $$ select * from public.answer_question(
       (select attempt_id from test_helpers.quiz_fixture),
       (select question_id from test_helpers.answer_keys where question_index = 3),
       (select correct_index from test_helpers.answer_keys where question_index = 3)
     ) $$,
  'the member can submit a third timed answer'
);
select lives_ok(
  $$ select * from public.answer_question(
       (select attempt_id from test_helpers.quiz_fixture),
       (select question_id from test_helpers.answer_keys where question_index = 4),
       (select correct_index from test_helpers.answer_keys where question_index = 4)
     ) $$,
  'the member can submit a fourth timed answer'
);
select is(
  (select status from public.answer_question(
    (select attempt_id from test_helpers.quiz_fixture),
    (select question_id from test_helpers.answer_keys where question_index = 5),
    (select correct_index from test_helpers.answer_keys where question_index = 5)
  )),
  'finished',
  'the fifth answer finishes the quiz'
);
reset role;
select is(
  (select score::integer from public.quiz_attempts
   where id = (select attempt_id from test_helpers.quiz_fixture)),
  4,
  'the server marks a correct answer submitted after its deadline as wrong'
);
select is(
  (select passed from public.quiz_attempts
   where id = (select attempt_id from test_helpers.quiz_fixture)),
  true,
  'four or more correct answers pass the quiz'
);

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.get_reveal(
       (select id from test_helpers.game_rounds where label = 'quiz')
     ) $$,
  'P0001',
  'Round results are not ready yet.',
  'results remain hidden until the release time'
);

reset role;
update public.rounds
set status = 'closed',
    opens_at = statement_timestamp() - interval '10 minutes',
    closes_at = statement_timestamp() - interval '1 second',
    release_at = statement_timestamp() - interval '1 second'
where id = (select id from test_helpers.game_rounds where label = 'quiz');
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select is(
  (select outcome from public.get_reveal(
    (select id from test_helpers.game_rounds where label = 'quiz')
  )),
  'doubled',
  'a successful Double resolves the fund as doubled'
);
select is(
  (select final_fund_cents::integer from public.get_reveal(
    (select id from test_helpers.game_rounds where label = 'quiz')
  )),
  20000,
  'the fund doubles once regardless of the number of winners'
);
select ok(
  (select members @> '[{"display_name":"Round Leader","result":"doubled_and_won"},{"display_name":"Round Member","result":"passed"}]'::jsonb
   from public.get_reveal(
     (select id from test_helpers.game_rounds where label = 'quiz')
   )),
  'release shows named results only after the release time'
);
set local request.jwt.claims to
  '{"sub": "66666666-6666-6666-6666-666666666666", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.get_reveal(
       (select id from test_helpers.game_rounds where label = 'quiz')
     ) $$,
  'P0001',
  'Round not found or you are not a member.',
  'an outsider cannot view the released results'
);

reset role;
update public.rounds
set opens_at = statement_timestamp() - interval '10 minutes',
    closes_at = statement_timestamp() - interval '1 second',
    release_at = statement_timestamp() - interval '1 second'
where id = (select id from test_helpers.game_rounds where label = 'choices');
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select is(
  (select outcome from public.get_reveal(
    (select id from test_helpers.game_rounds where label = 'choices')
  )),
  'intact',
  'non-responders default to Pass and leave the fund intact'
);
select is(
  (select final_fund_cents::integer from public.get_reveal(
    (select id from test_helpers.game_rounds where label = 'choices')
  )),
  10000,
  'a round without a failed Double preserves the starting fund'
);

insert into test_helpers.game_rounds
select 'unfinished', public.start_round(
  'aaaaaaaa-1111-4111-8111-111111111111',
  clock_timestamp() + interval '1 minute',
  clock_timestamp() + interval '7 minutes',
  clock_timestamp() + interval '1 hour'
);
reset role;
update public.rounds
set opens_at = clock_timestamp() - interval '1 minute',
    closes_at = clock_timestamp() + interval '6 minutes',
    release_at = clock_timestamp() + interval '1 hour'
where id = (select id from test_helpers.game_rounds where label = 'unfinished');
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select is(
  public.submit_choice(
    (select id from test_helpers.game_rounds where label = 'unfinished'),
    'double'
  ),
  true,
  'a member can choose Double in a later round'
);
select lives_ok(
  $$ select * from public.start_quiz(
       (select id from test_helpers.game_rounds where label = 'unfinished')
     )
     $$,
  'a member can start an unfinished quiz'
);
reset role;
update public.rounds
set status = 'closed',
    opens_at = statement_timestamp() - interval '10 minutes',
    closes_at = statement_timestamp() - interval '1 second',
    release_at = statement_timestamp() - interval '1 second'
where id = (select id from test_helpers.game_rounds where label = 'unfinished');
set local role authenticated;
set local request.jwt.claims to
  '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';
select is(
  (select outcome from public.get_reveal(
    (select id from test_helpers.game_rounds where label = 'unfinished')
  )),
  'lost',
  'an unfinished Double quiz loses the fund at release'
);
select is(
  (select final_fund_cents::integer from public.get_reveal(
    (select id from test_helpers.game_rounds where label = 'unfinished')
  )),
  0,
  'a failed Double reduces the fund to zero'
);
select ok(
  (select members @> '[{"display_name":"Round Leader","result":"doubled_and_lost"},{"display_name":"Round Member","result":"passed"}]'::jsonb
   from public.get_reveal(
     (select id from test_helpers.game_rounds where label = 'unfinished')
   )),
  'release marks an unfinished quiz as lost and a non-responder as passed'
);

select * from finish();
rollback;
