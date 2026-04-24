-- Scorecard tables for Play-Cricket match_detail data.
-- Drives: /stats (team + leaderboards), /stats/[id] (player pages),
-- /table (computed league standings), FixtureDetail (key players, H2H).

create table if not exists match_scorecards (
  match_id              integer primary key,        -- play_cricket_match_id
  fixture_id            integer references fixtures(id) on delete set null,
  season                integer not null,
  home_club_id          text,
  home_team_id          text,
  home_team_name        text,
  away_club_id          text,
  away_team_id          text,
  away_team_name        text,
  our_team_id           text,                       -- whichever side is 9754
  opponent_team_id      text,
  toss_won_by_team_id   text,
  batted_first_team_id  text,
  result                text,                       -- 'W','L','T','D','A' (raw)
  result_applied_to     text,
  result_text           text,                       -- normalised: Won/Lost/Drew/Tied/Abandoned
  our_game_points       numeric,
  our_bonus_total       numeric,
  our_runs              integer,
  our_wickets           integer,
  our_overs             numeric,
  opp_runs              integer,
  opp_wickets           integer,
  opp_overs             numeric,
  no_of_overs           integer,
  competition_name      text,
  last_updated_pc       text,                       -- DD/MM/YYYY string from PC (for diffing)
  synced_at             timestamptz default now()
);

create index if not exists match_scorecards_season_idx on match_scorecards (season);
create index if not exists match_scorecards_fixture_idx on match_scorecards (fixture_id);

create table if not exists batting_entries (
  id               serial primary key,
  match_id         integer not null references match_scorecards(match_id) on delete cascade,
  season           integer not null,
  team_batting_id  text,
  innings_number   smallint,
  position         smallint,
  batsman_name     text,
  batsman_id       integer,                          -- PC player_id; null if unknown
  how_out          text,
  fielder_name     text,
  fielder_id       integer,
  bowler_name      text,
  bowler_id        integer,
  runs             integer,
  fours            integer,
  sixes            integer,
  balls            integer,
  is_our_batsman   boolean default false,
  is_our_fielder   boolean default false
);

create index if not exists batting_by_batsman on batting_entries (batsman_id);
create index if not exists batting_by_fielder on batting_entries (fielder_id);
create index if not exists batting_by_match on batting_entries (match_id);

create table if not exists bowling_entries (
  id               serial primary key,
  match_id         integer not null references match_scorecards(match_id) on delete cascade,
  season           integer not null,
  team_bowling_id  text,
  innings_number   smallint,
  bowler_name      text,
  bowler_id        integer,
  overs            numeric,
  maidens          integer,
  runs             integer,
  wickets          integer,
  wides            integer,
  no_balls         integer,
  is_our_bowler    boolean default false
);

create index if not exists bowling_by_bowler on bowling_entries (bowler_id);
create index if not exists bowling_by_match on bowling_entries (match_id);

-- Points/table data lifted out of result_summary for league-table computation
create table if not exists league_points (
  match_id         integer not null references match_scorecards(match_id) on delete cascade,
  team_id          text not null,
  team_name        text,                             -- denormalised for display
  game_points      numeric,
  bonus_batting    numeric,
  bonus_bowling    numeric,
  bonus_together   numeric,
  penalty_points   numeric,
  primary key (match_id, team_id)
);

create index if not exists league_points_team on league_points (team_id);

-- Row Level Security: public SELECT only. Writes require service_role (which bypasses RLS).
-- Keeps the tables readable by the anon key for server components, prevents anon writes.

alter table match_scorecards enable row level security;
alter table batting_entries enable row level security;
alter table bowling_entries enable row level security;
alter table league_points enable row level security;

drop policy if exists "public read scorecards" on match_scorecards;
drop policy if exists "public read batting"    on batting_entries;
drop policy if exists "public read bowling"    on bowling_entries;
drop policy if exists "public read points"     on league_points;

create policy "public read scorecards" on match_scorecards for select using (true);
create policy "public read batting"    on batting_entries  for select using (true);
create policy "public read bowling"    on bowling_entries  for select using (true);
create policy "public read points"     on league_points    for select using (true);
