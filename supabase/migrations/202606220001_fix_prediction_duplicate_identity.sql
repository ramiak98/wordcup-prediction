alter table users_predictions
  drop constraint if exists users_predictions_device_unique;

create index if not exists users_predictions_device_signals_idx
  on users_predictions (ip_hash, user_agent_hash);
