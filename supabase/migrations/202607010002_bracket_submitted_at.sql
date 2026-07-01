alter table bracket_predictions
  add column if not exists submitted_at timestamptz;
