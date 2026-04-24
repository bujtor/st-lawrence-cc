-- Club name, competition id + a proper league standings table.
--
-- match_scorecards additions:
-- - home/away_club_name: Play-Cricket's home/away_team_name is just XI designation
--   ("1st XI"). The actual club is in home/away_club_name ("Bearsted CC"). Needed
--   for opponent labels across stats pages.
-- - competition_id: the PC division identifier; used to filter each club's matches
--   down to our division when aggregating the league table.
--
-- league_standings: pre-aggregated division table. Sync fetches every club in our
-- division's result_summary, dedupes by match_id, sums points, stores the result
-- here. /table reads from this directly.

alter table match_scorecards
  add column if not exists home_club_name text,
  add column if not exists away_club_name text,
  add column if not exists competition_id text;

create table if not exists league_standings (
  season          integer not null,
  competition_id  text    not null,
  team_id         text    not null,
  team_name       text    not null,
  club_id         text,
  club_name       text,
  played          integer default 0,
  won             integer default 0,
  lost            integer default 0,
  tied            integer default 0,
  drew            integer default 0,
  abandoned       integer default 0,
  cancelled       integer default 0,
  bonus_batting   numeric default 0,
  bonus_bowling   numeric default 0,
  bonus_together  numeric default 0,
  penalty_points  numeric default 0,
  points          numeric default 0,
  synced_at       timestamptz default now(),
  primary key (season, competition_id, team_id)
);

alter table league_standings enable row level security;
drop policy if exists "public read standings" on league_standings;
create policy "public read standings" on league_standings for select using (true);

create index if not exists league_standings_season_idx on league_standings (season, competition_id, points desc);
