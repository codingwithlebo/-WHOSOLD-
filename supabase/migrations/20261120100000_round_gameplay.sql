-- Phase 4: private rounds and choices; Phase 5: server-scored quiz.
-- All game-changing reads and writes go through security-definer RPCs.

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  starting_fund_cents bigint not null check (starting_fund_cents > 0),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  release_at timestamptz not null,
  status text not null default 'open'
    check (status in ('open', 'closed', 'resolved')),
  outcome text
    check (outcome is null or outcome in ('intact', 'doubled', 'lost')),
  final_fund_cents bigint,
  created_at timestamptz not null default now(),
  constraint rounds_schedule_valid check (
    opens_at < closes_at
    and closes_at <= release_at
    and closes_at - opens_at >= interval '5 minutes'
  ),
  constraint rounds_resolution_consistent check (
    (status = 'resolved' and outcome is not null and final_fund_cents is not null)
    or (status <> 'resolved' and outcome is null and final_fund_cents is null)
  )
);

create index rounds_group_created_idx
  on public.rounds (group_id, created_at desc);
create unique index rounds_one_active_per_group
  on public.rounds (group_id)
  where status in ('open', 'closed');

alter table public.rounds enable row level security;
revoke all on table public.rounds from public, anon, authenticated;

create table public.choices (
  round_id uuid not null references public.rounds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  choice text not null check (choice in ('pass', 'double')),
  created_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

alter table public.choices enable row level security;
revoke all on table public.choices from public, anon, authenticated;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null unique,
  options text[] not null check (
    cardinality(options) = 4
    and array_position(options, null) is null
  ),
  category text not null
);

alter table public.questions enable row level security;
revoke all on table public.questions from public, anon, authenticated;

create table public.question_answers (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_index smallint not null check (correct_index between 0 and 3)
);

alter table public.question_answers enable row level security;
revoke all on table public.question_answers from public, anon, authenticated;

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_ids uuid[] not null check (cardinality(question_ids) = 5),
  current_index smallint not null default 1 check (current_index between 1 and 5),
  current_question_served_at timestamptz not null default clock_timestamp(),
  score smallint not null default 0 check (score between 0 and 5),
  started_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  passed boolean,
  unique (round_id, user_id),
  constraint quiz_attempt_completion_consistent check (
    (finished_at is null and passed is null)
    or (finished_at is not null and passed is not null)
  )
);

alter table public.quiz_attempts enable row level security;
revoke all on table public.quiz_attempts from public, anon, authenticated;

create table public.quiz_responses (
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  chosen_index smallint check (chosen_index is null or chosen_index between 0 and 3),
  is_correct boolean not null,
  served_at timestamptz not null,
  answered_at timestamptz not null,
  primary key (attempt_id, question_id)
);

alter table public.quiz_responses enable row level security;
revoke all on table public.quiz_responses from public, anon, authenticated;

-- A round locks the fund snapshot until it is resolved.
create function private.prevent_wishlist_change_during_round()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    perform 1
    from public.groups g
    where g.id in (old.group_id, new.group_id)
    order by g.id
    for update;

    if exists (
      select 1
      from public.rounds r
      where r.group_id in (old.group_id, new.group_id)
        and r.status in ('open', 'closed')
    ) then
      raise exception 'The wishlist cannot change while a round is active.';
    end if;
  else
    perform 1
    from public.groups g
    where g.id = case when tg_op = 'DELETE' then old.group_id else new.group_id end
    for update;

    if exists (
      select 1
      from public.rounds r
      where r.group_id = case when tg_op = 'DELETE' then old.group_id else new.group_id end
        and r.status in ('open', 'closed')
    ) then
      raise exception 'The wishlist cannot change while a round is active.';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.prevent_wishlist_change_during_round() from public;

create trigger prevent_wishlist_change_during_round
  before insert or update or delete on public.wishlist_items
  for each row execute function private.prevent_wishlist_change_during_round();

-- The browser receives prompts and options only through quiz RPCs. Correct
-- answers remain in a table with no client privileges.
with question_seed(prompt, options, category, correct_index) as (
  values
    ('What is South Africa''s administrative capital?', array['Pretoria', 'Cape Town', 'Bloemfontein', 'Johannesburg'], 'Geography', 0),
    ('Which planet is the largest in our solar system?', array['Saturn', 'Jupiter', 'Neptune', 'Earth'], 'Science', 1),
    ('What is the chemical formula for water?', array['CO2', 'O2', 'H2O', 'NaCl'], 'Science', 2),
    ('Which ocean lies east of South Africa?', array['Atlantic Ocean', 'Arctic Ocean', 'Pacific Ocean', 'Indian Ocean'], 'Geography', 3),
    ('On which continent is Egypt?', array['Africa', 'Asia', 'Europe', 'South America'], 'Geography', 0),
    ('Which planet is commonly called the Red Planet?', array['Venus', 'Mars', 'Mercury', 'Saturn'], 'Science', 1),
    ('How many minutes are in one hour?', array['30', '45', '60', '90'], 'General knowledge', 2),
    ('How many sides does an octagon have?', array['Six', 'Seven', 'Eight', 'Nine'], 'Mathematics', 2),
    ('Who wrote Romeo and Juliet?', array['Charles Dickens', 'Jane Austen', 'Mark Twain', 'William Shakespeare'], 'Literature', 3),
    ('What is the largest animal on Earth?', array['African elephant', 'Blue whale', 'Giraffe', 'Whale shark'], 'Science', 1),
    ('What is the currency of Japan?', array['Yen', 'Won', 'Yuan', 'Baht'], 'Geography', 0),
    ('Which star is closest to Earth?', array['Sirius', 'Proxima Centauri', 'The Sun', 'Vega'], 'Science', 2),
    ('At what temperature does water boil at sea level in Celsius?', array['50', '75', '90', '100'], 'Science', 3),
    ('What process do green plants use to make food from sunlight?', array['Fermentation', 'Photosynthesis', 'Respiration', 'Digestion'], 'Science', 1),
    ('Which animal is the fastest land runner?', array['Cheetah', 'Lion', 'Horse', 'Ostrich'], 'Science', 0),
    ('How many legs does a spider have?', array['Six', 'Eight', 'Ten', 'Twelve'], 'Science', 1),
    ('What is the natural satellite of Earth?', array['Phobos', 'Europa', 'The Moon', 'Titan'], 'Science', 2),
    ('Which instrument measures temperature?', array['Barometer', 'Compass', 'Altimeter', 'Thermometer'], 'Science', 3),
    ('Which is a primary color of light?', array['Red', 'Brown', 'Pink', 'Grey'], 'Science', 0),
    ('How many days are in a leap year?', array['364', '365', '366', '367'], 'General knowledge', 2),
    ('Which gas do humans need to breathe to live?', array['Helium', 'Oxygen', 'Hydrogen', 'Neon'], 'Science', 1),
    ('What is the largest desert on Earth by area?', array['Sahara', 'Gobi', 'Arabian', 'Antarctic'], 'Geography', 3),
    ('In which country are the Pyramids of Giza?', array['Egypt', 'Mexico', 'Peru', 'Greece'], 'Geography', 0),
    ('Which organ pumps blood around the human body?', array['Liver', 'Lungs', 'Heart', 'Kidney'], 'Science', 2),
    ('What is 9 multiplied by 7?', array['56', '63', '72', '81'], 'Mathematics', 1),
    ('Which is the largest continent by area?', array['Africa', 'Europe', 'Asia', 'Australia'], 'Geography', 2),
    ('Which mammal lays eggs?', array['Platypus', 'Dolphin', 'Bat', 'Koala'], 'Science', 0),
    ('What do honeybees collect from flowers to make honey?', array['Pollen only', 'Sap', 'Nectar', 'Dew'], 'Science', 2),
    ('What is the change from liquid water to water vapor called?', array['Condensation', 'Freezing', 'Melting', 'Evaporation'], 'Science', 3),
    ('Which instrument has black and white keys and is played with both hands?', array['Violin', 'Piano', 'Flute', 'Trumpet'], 'Arts', 1)
),
inserted_questions as (
  insert into public.questions (prompt, options, category)
  select prompt, options, category from question_seed
  on conflict (prompt) do nothing
  returning id, prompt
)
insert into public.question_answers (question_id, correct_index)
select q.id, s.correct_index::smallint
from inserted_questions q
join question_seed s using (prompt)
on conflict (question_id) do nothing;

create function private.resolve_round(target_round_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.rounds;
  resolved_outcome text;
  resolved_fund bigint;
begin
  select r.* into target
  from public.rounds r
  where r.id = target_round_id
  for update;

  if not found then
    raise exception 'Round not found.';
  end if;

  if target.status = 'resolved' then return; end if;
  if clock_timestamp() < target.release_at then
    raise exception 'Round results are not ready yet.';
  end if;

  if exists (
    select 1
    from public.choices c
    left join public.quiz_attempts a
      on a.round_id = c.round_id and a.user_id = c.user_id
    where c.round_id = target.id
      and c.choice = 'double'
      and a.passed is distinct from true
  ) then
    resolved_outcome := 'lost';
    resolved_fund := 0;
  elsif exists (
    select 1
    from public.quiz_attempts a
    where a.round_id = target.id and a.passed is true
  ) then
    resolved_outcome := 'doubled';
    resolved_fund := target.starting_fund_cents * 2;
  else
    resolved_outcome := 'intact';
    resolved_fund := target.starting_fund_cents;
  end if;

  update public.rounds r
  set status = 'resolved',
      outcome = resolved_outcome,
      final_fund_cents = resolved_fund
  where r.id = target.id;
end;
$$;

revoke all on function private.resolve_round(uuid) from public;

create function public.start_round(
  target_group_id uuid,
  opens_at timestamptz,
  closes_at timestamptz,
  release_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target public.groups;
  member_count integer;
  fund bigint;
  new_round_id uuid;
begin
  if caller is null then
    raise exception 'You need to be logged in to start a round.';
  end if;

  select g.* into target
  from public.groups g
  where g.id = target_group_id
  for update;

  if not found or target.leader_id <> caller then
    raise exception 'Only the group leader can start a round.';
  end if;
  if not target.is_locked then
    raise exception 'Lock the group before starting a round.';
  end if;
  if opens_at is null or closes_at is null or release_at is null
    or opens_at < clock_timestamp()
    or closes_at - opens_at < interval '5 minutes'
    or closes_at <= opens_at
    or release_at < closes_at then
    raise exception 'The round schedule is invalid.';
  end if;

  select count(*)::integer into member_count
  from public.group_members m
  where m.group_id = target_group_id;
  if member_count < 2 then
    raise exception 'At least 2 members are required to start a round.';
  end if;

  select coalesce(sum(w.price_cents), 0)::bigint into fund
  from public.wishlist_items w
  where w.group_id = target_group_id;
  if fund <= 0 then
    raise exception 'Add items to the wishlist before starting a round.';
  end if;

  if exists (
    select 1 from public.rounds r
    where r.group_id = target_group_id and r.status in ('open', 'closed')
  ) then
    raise exception 'This group already has an active round.';
  end if;

  insert into public.rounds (
    group_id, starting_fund_cents, opens_at, closes_at, release_at
  )
  values (
    target_group_id, fund, opens_at, closes_at, release_at
  )
  returning id into new_round_id;

  return new_round_id;
end;
$$;

create function public.get_group_round(target_group_id uuid)
returns table (
  round_id uuid,
  group_id uuid,
  group_name text,
  starting_fund_cents bigint,
  opens_at timestamptz,
  closes_at timestamptz,
  release_at timestamptz,
  status text,
  answered_count integer,
  member_count integer,
  my_choice text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  latest public.rounds;
begin
  if caller is null then
    raise exception 'You need to be logged in to view this round.';
  end if;
  if not private.is_group_member(target_group_id) then
    raise exception 'This group could not be found or you are not a member.';
  end if;

  select r.* into latest
  from public.rounds r
  where r.group_id = target_group_id
  order by r.created_at desc, r.id desc
  limit 1;

  if not found then return; end if;

  if latest.status <> 'resolved' and clock_timestamp() >= latest.release_at then
    perform private.resolve_round(latest.id);
  elsif latest.status = 'open' and clock_timestamp() >= latest.closes_at then
    update public.rounds r set status = 'closed'
    where r.id = latest.id and r.status = 'open';
  end if;

  return query
  select
    r.id,
    r.group_id,
    g.name,
    r.starting_fund_cents,
    r.opens_at,
    r.closes_at,
    r.release_at,
    r.status,
    (select count(*)::integer from public.choices c where c.round_id = r.id),
    (select count(*)::integer from public.group_members m where m.group_id = r.group_id),
    (select c.choice from public.choices c where c.round_id = r.id and c.user_id = caller)
  from public.rounds r
  join public.groups g on g.id = r.group_id
  where r.id = latest.id;
end;
$$;

create function public.get_round_status(target_round_id uuid)
returns table (
  round_id uuid,
  group_id uuid,
  group_name text,
  starting_fund_cents bigint,
  opens_at timestamptz,
  closes_at timestamptz,
  release_at timestamptz,
  status text,
  answered_count integer,
  member_count integer,
  my_choice text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_group_id uuid;
begin
  select r.group_id into target_group_id
  from public.rounds r
  where r.id = target_round_id;
  if not found then
    raise exception 'Round not found or you are not a member.';
  end if;

  return query
  select s.*
  from public.get_group_round(target_group_id) s
  where s.round_id = target_round_id;
end;
$$;

create function public.submit_choice(target_round_id uuid, selected_choice text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target public.rounds;
begin
  if caller is null then
    raise exception 'You need to be logged in to submit a choice.';
  end if;
  if selected_choice is null or selected_choice not in ('pass', 'double') then
    raise exception 'Choose Pass or Double.';
  end if;

  select r.* into target
  from public.rounds r
  where r.id = target_round_id
  for update;
  if not found or not private.is_group_member(target.group_id) then
    raise exception 'Round not found or you are not a member.';
  end if;
  if clock_timestamp() < target.opens_at then
    raise exception 'The choice window has not opened yet.';
  end if;
  if clock_timestamp() >= target.closes_at then
    raise exception 'The choice window is closed.';
  end if;

  insert into public.choices (round_id, user_id, choice)
  values (target.id, caller, selected_choice);
  return true;
exception
  when unique_violation then
    raise exception 'Your choice has already been submitted.';
end;
$$;

create function public.start_quiz(target_round_id uuid)
returns table (
  status text,
  attempt_id uuid,
  question_id uuid,
  question_index integer,
  total integer,
  prompt text,
  options text[],
  seconds_left integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target public.rounds;
  selected_questions uuid[];
  new_attempt_id uuid;
begin
  if caller is null then
    raise exception 'You need to be logged in to start the quiz.';
  end if;
  select r.* into target
  from public.rounds r
  where r.id = target_round_id
  for update;
  if not found or not private.is_group_member(target.group_id) then
    raise exception 'Round not found or you are not a member.';
  end if;
  if not exists (
    select 1 from public.choices c
    where c.round_id = target.id and c.user_id = caller and c.choice = 'double'
  ) then
    raise exception 'Choose Double before starting the quiz.';
  end if;
  if clock_timestamp() < target.opens_at or clock_timestamp() >= target.closes_at then
    raise exception 'The quiz can only be started while the choice window is open.';
  end if;
  if exists (
    select 1 from public.quiz_attempts a
    where a.round_id = target.id and a.user_id = caller
  ) then
    raise exception 'You have already started this quiz.';
  end if;

  select array_agg(q.id) into selected_questions
  from (
    select questions.id
    from public.questions
    order by random()
    limit 5
  ) q;
  if coalesce(cardinality(selected_questions), 0) <> 5 then
    raise exception 'The quiz is not available yet. Please try again later.';
  end if;

  insert into public.quiz_attempts (
    round_id, user_id, question_ids, current_question_served_at
  )
  values (
    target.id, caller, selected_questions, clock_timestamp()
  )
  returning id into new_attempt_id;

  return query select * from public.get_quiz_state(target.id);
end;
$$;

create function public.get_quiz_state(target_round_id uuid)
returns table (
  status text,
  attempt_id uuid,
  question_id uuid,
  question_index integer,
  total integer,
  prompt text,
  options text[],
  seconds_left integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target public.rounds;
  attempt public.quiz_attempts;
  current_question public.questions;
  remaining integer;
begin
  if caller is null then
    raise exception 'You need to be logged in to view the quiz.';
  end if;
  select r.* into target from public.rounds r where r.id = target_round_id;
  if not found or not private.is_group_member(target.group_id) then
    raise exception 'Round not found or you are not a member.';
  end if;
  if not exists (
    select 1 from public.choices c
    where c.round_id = target.id and c.user_id = caller and c.choice = 'double'
  ) then
    raise exception 'Choose Double before viewing the quiz.';
  end if;

  select a.* into attempt
  from public.quiz_attempts a
  where a.round_id = target.id and a.user_id = caller;
  if not found then
    return query select 'not_started'::text, null::uuid, null::uuid, 0, 5,
      null::text, null::text[], 0;
    return;
  end if;
  if attempt.finished_at is not null then
    return query select 'finished'::text, attempt.id, null::uuid,
      attempt.current_index::integer, 5, null::text, null::text[], 0;
    return;
  end if;

  select q.* into current_question
  from public.questions q
  where q.id = attempt.question_ids[attempt.current_index];
  remaining := greatest(
    0,
    ceil(20 - extract(epoch from (clock_timestamp() - attempt.current_question_served_at)))::integer
  );

  return query select
    'in_progress'::text,
    attempt.id,
    current_question.id,
    attempt.current_index::integer,
    5,
    current_question.prompt,
    current_question.options,
    remaining;
end;
$$;

create function public.answer_question(
  target_attempt_id uuid,
  expected_question_id uuid,
  chosen_index smallint
)
returns table (
  status text,
  attempt_id uuid,
  question_id uuid,
  question_index integer,
  total integer,
  prompt text,
  options text[],
  seconds_left integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  attempt public.quiz_attempts;
  target public.rounds;
  current_question_id uuid;
  answer_index smallint;
  answered_at timestamptz;
  is_answer_correct boolean;
begin
  if caller is null then
    raise exception 'You need to be logged in to answer the quiz.';
  end if;
  select a.* into attempt
  from public.quiz_attempts a
  where a.id = target_attempt_id;
  if not found or attempt.user_id <> caller then
    raise exception 'Quiz attempt not found.';
  end if;

  select r.* into target
  from public.rounds r
  where r.id = attempt.round_id
  for update;
  select a.* into attempt
  from public.quiz_attempts a
  where a.id = target_attempt_id
  for update;
  if attempt.finished_at is not null then
    if exists (
      select 1 from public.quiz_responses response
      where response.attempt_id = attempt.id
        and response.question_id = expected_question_id
    ) then
      return query select * from public.get_quiz_state(attempt.round_id);
      return;
    end if;
    raise exception 'This quiz is already finished.';
  end if;
  current_question_id := attempt.question_ids[attempt.current_index];
  if expected_question_id is distinct from current_question_id then
    if exists (
      select 1 from public.quiz_responses response
      where response.attempt_id = attempt.id
        and response.question_id = expected_question_id
    ) then
      return query select * from public.get_quiz_state(attempt.round_id);
      return;
    end if;
    raise exception 'This quiz question is no longer current.';
  end if;
  answered_at := clock_timestamp();
  if answered_at >= target.closes_at then
    update public.quiz_attempts a
    set finished_at = answered_at, passed = false
    where a.id = attempt.id;
    return query select * from public.get_quiz_state(attempt.round_id);
    return;
  end if;
  if chosen_index is not null and chosen_index not between 0 and 3 then
    raise exception 'Choose one of the available answers.';
  end if;
  if answered_at < attempt.current_question_served_at + interval '20 seconds'
    and answered_at < target.closes_at
    and chosen_index is null then
    raise exception 'Wait for the question timer to finish before skipping.';
  end if;

  select qa.correct_index into answer_index
  from public.question_answers qa
  where qa.question_id = current_question_id;

  is_answer_correct :=
    chosen_index is not null
    and chosen_index = answer_index
    and answered_at <= attempt.current_question_served_at + interval '20 seconds'
    and answered_at < target.closes_at;

  insert into public.quiz_responses (
    attempt_id, question_id, chosen_index, is_correct, served_at, answered_at
  )
  values (
    attempt.id, current_question_id, chosen_index, is_answer_correct,
    attempt.current_question_served_at, answered_at
  );

  if attempt.current_index = 5 then
    update public.quiz_attempts a
    set score = a.score + case when is_answer_correct then 1 else 0 end,
        finished_at = answered_at,
        passed = a.score + case when is_answer_correct then 1 else 0 end >= 4
    where a.id = attempt.id;
  else
    update public.quiz_attempts a
    set score = a.score + case when is_answer_correct then 1 else 0 end,
        current_index = a.current_index + 1,
        current_question_served_at = answered_at
    where a.id = attempt.id;
  end if;

  return query select * from public.get_quiz_state(attempt.round_id);
end;
$$;

create function public.get_reveal(target_round_id uuid)
returns table (
  outcome text,
  starting_fund_cents bigint,
  final_fund_cents bigint,
  released_at timestamptz,
  members jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then
    raise exception 'You need to be logged in to view the results.';
  end if;
  if not exists (
    select 1 from public.rounds r
    where r.id = target_round_id and private.is_group_member(r.group_id)
  ) then
    raise exception 'Round not found or you are not a member.';
  end if;

  perform private.resolve_round(target_round_id);

  return query
  select
    r.outcome,
    r.starting_fund_cents,
    r.final_fund_cents,
    r.release_at,
    (
      select jsonb_agg(
        jsonb_build_object(
          'display_name', p.display_name,
          'result',
          case
            when c.choice = 'double' and a.passed is true then 'doubled_and_won'
            when c.choice = 'double' then 'doubled_and_lost'
            else 'passed'
          end
        )
        order by p.display_name, m.user_id
      )
      from public.group_members m
      join public.profiles p on p.id = m.user_id
      left join public.choices c
        on c.round_id = r.id and c.user_id = m.user_id
      left join public.quiz_attempts a
        on a.round_id = r.id and a.user_id = m.user_id
      where m.group_id = r.group_id
    )
  from public.rounds r
  where r.id = target_round_id;
end;
$$;

revoke all on function public.start_round(uuid, timestamptz, timestamptz, timestamptz) from public, anon;
revoke all on function public.get_group_round(uuid) from public, anon;
revoke all on function public.get_round_status(uuid) from public, anon;
revoke all on function public.submit_choice(uuid, text) from public, anon;
revoke all on function public.start_quiz(uuid) from public, anon;
revoke all on function public.get_quiz_state(uuid) from public, anon;
revoke all on function public.answer_question(uuid, uuid, smallint) from public, anon;
revoke all on function public.get_reveal(uuid) from public, anon;

grant execute on function public.start_round(uuid, timestamptz, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_group_round(uuid) to authenticated;
grant execute on function public.get_round_status(uuid) to authenticated;
grant execute on function public.submit_choice(uuid, text) to authenticated;
grant execute on function public.start_quiz(uuid) to authenticated;
grant execute on function public.get_quiz_state(uuid) to authenticated;
grant execute on function public.answer_question(uuid, uuid, smallint) to authenticated;
grant execute on function public.get_reveal(uuid) to authenticated;
