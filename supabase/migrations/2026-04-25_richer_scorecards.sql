-- Capture more of the Match Detail API plus add wcn/lcn for the league table.
--
-- match_scorecards additions:
-- - fow              : array of fall-of-wicket events per batting team (jsonb)
-- - extras           : per-innings extras breakdown (byes, leg-byes, wides, no-balls, penalty, total)
-- - home_captain_id / away_captain_id          : captain markers
-- - home_wicket_keeper_id / away_wicket_keeper_id : keeper markers
-- - match_notes      : scorer notes
--
-- league_standings additions:
-- - wcn              : opposition conceded (a "won by concession" — counted as 20 pts)
-- - lcn              : team conceded (forfeited — 0 pts)

alter table match_scorecards
  add column if not exists fow                       jsonb,
  add column if not exists extras                    jsonb,
  add column if not exists home_captain_id           text,
  add column if not exists home_wicket_keeper_id     text,
  add column if not exists away_captain_id           text,
  add column if not exists away_wicket_keeper_id     text,
  add column if not exists match_notes               text;

alter table league_standings
  add column if not exists wcn integer default 0,
  add column if not exists lcn integer default 0;
