-- Add play_cricket_member_id to players for idempotent sync from Play-Cricket API.
-- Existing seeded players are matched by name on first sync; this column is populated then.

alter table players
  add column if not exists play_cricket_member_id integer;

create unique index if not exists players_play_cricket_member_id_key
  on players (play_cricket_member_id)
  where play_cricket_member_id is not null;
