-- Knockout stage: matches and bracket predictions

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

insert into scoring_rules (rule_key, points) values
  ('correct_round_of_32', 2),
  ('correct_round_of_16', 3),
  ('correct_quarter_final', 5),
  ('correct_semi_final', 7),
  ('correct_third_place', 5),
  ('correct_final', 10)
on conflict (rule_key) do update set points = excluded.points;

update scoring_rules set points = 20 where rule_key = 'correct_champion';
