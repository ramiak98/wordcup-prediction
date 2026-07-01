create extension if not exists pgcrypto;

create table if not exists teams (
  id text primary key,
  name text not null,
  code text not null unique,
  group_letter text not null check (group_letter in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  flag_url text,
  created_at timestamptz not null default now()
);

create table if not exists users_predictions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  vote_token text not null unique,
  ip_hash text not null,
  user_agent_hash text not null,
  predictions jsonb not null,
  total_points integer not null default 0,
  created_at timestamptz not null default now()
);

alter table users_predictions
  drop constraint if exists users_predictions_device_unique;

create index if not exists users_predictions_created_at_idx
  on users_predictions (created_at desc);

create index if not exists users_predictions_device_signals_idx
  on users_predictions (ip_hash, user_agent_hash);

create index if not exists users_predictions_full_name_idx
  on users_predictions using gin (to_tsvector('simple', full_name));

create index if not exists users_predictions_predictions_idx
  on users_predictions using gin (predictions);

create table if not exists actual_results (
  id uuid primary key default gen_random_uuid(),
  results jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists scoring_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  points integer not null check (points >= 0),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists actual_results_updated_at on actual_results;
create trigger actual_results_updated_at
before update on actual_results
for each row execute procedure set_updated_at();

drop trigger if exists scoring_rules_updated_at on scoring_rules;
create trigger scoring_rules_updated_at
before update on scoring_rules
for each row execute procedure set_updated_at();

alter table teams enable row level security;
alter table users_predictions enable row level security;
alter table actual_results enable row level security;
alter table scoring_rules enable row level security;

create table if not exists matches (
  match_number integer primary key check (match_number between 73 and 104),
  round text not null check (
    round in (
      'round-of-32',
      'round-of-16',
      'quarter-finals',
      'semi-finals',
      'third-place',
      'final'
    )
  ),
  team_a text references teams(id) on delete set null,
  team_b text references teams(id) on delete set null,
  team_a_label text,
  team_b_label text,
  stadium text not null,
  city text not null,
  kickoff timestamptz not null,
  winner text references teams(id) on delete set null,
  next_match integer references matches(match_number) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists matches_round_idx on matches (round);
create index if not exists matches_kickoff_idx on matches (kickoff);

create table if not exists bracket_predictions (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null unique references users_predictions(id) on delete cascade,
  round32 jsonb not null default '{}'::jsonb,
  round16 jsonb not null default '{}'::jsonb,
  quarter_finals jsonb not null default '{}'::jsonb,
  semi_finals jsonb not null default '{}'::jsonb,
  final jsonb not null default '{}'::jsonb,
  third_place jsonb not null default '{}'::jsonb,
  champion text references teams(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists bracket_predictions_prediction_id_idx
  on bracket_predictions (prediction_id);

drop trigger if exists matches_updated_at on matches;
create trigger matches_updated_at
before update on matches
for each row execute procedure set_updated_at();

drop trigger if exists bracket_predictions_updated_at on bracket_predictions;
create trigger bracket_predictions_updated_at
before update on bracket_predictions
for each row execute procedure set_updated_at();

alter table matches enable row level security;
alter table bracket_predictions enable row level security;

-- The app uses SUPABASE_SERVICE_ROLE_KEY from Next.js route handlers.
-- No anon policies are required unless you intentionally expose direct client reads.
