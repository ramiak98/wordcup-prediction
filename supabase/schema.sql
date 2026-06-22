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

-- The app uses SUPABASE_SERVICE_ROLE_KEY from Next.js route handlers.
-- No anon policies are required unless you intentionally expose direct client reads.
