-- Capture Play-Cricket's authoritative table position so we don't have to recompute
-- (their tie-breakers — NRR etc — aren't in our row data).
alter table league_standings
  add column if not exists position integer;
