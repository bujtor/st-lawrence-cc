-- St Lawrence CC Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Players table
create table if not exists players (
  id serial primary key,
  name text not null,
  role text check (role in ('BAT','BOWL','AR','WK')) not null,
  is_ringin boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Fixtures (synced from Play-Cricket)
create table if not exists fixtures (
  id serial primary key,
  play_cricket_match_id integer unique,
  match_date date not null,
  start_time time,
  meet_time time,
  opponent text not null,
  venue text not null,
  home_away text check (home_away in ('H','A')) not null,
  competition text,
  season integer not null,
  result_text text,
  lat numeric,
  lng numeric,
  last_synced timestamptz
);

-- Availability (the core table)
create table if not exists availability (
  player_id integer references players(id) on delete cascade,
  fixture_id integer references fixtures(id) on delete cascade,
  status text check (status in ('available','unavailable','tentative')) not null,
  notes text,
  updated_at timestamptz default now(),
  primary key (player_id, fixture_id)
);

-- Index for faster queries
create index if not exists idx_fixtures_season on fixtures(season);
create index if not exists idx_availability_fixture on availability(fixture_id);

-- Seed: 2026 fixtures (from Play-Cricket)
insert into fixtures (match_date, start_time, meet_time, opponent, venue, home_away, season, lat, lng) values
  ('2026-05-09', '13:00', '12:15', 'Farningham CC', 'Farningham Cricket Club', 'A', 2026, 51.3712, 0.2183),
  ('2026-05-16', '13:00', '12:15', 'Shoreham & Otford CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-05-23', '13:00', '12:00', 'Bearsted CC', 'Bearsted Green', 'A', 2026, 51.2706, 0.5636),
  ('2026-05-30', '13:00', '12:15', 'Locksbottom CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-06-06', '13:00', '12:15', 'Groombridge CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-06-13', '13:00', '12:00', 'Hadlow CC', 'Hadlow Common', 'A', 2026, 51.2280, 0.3350),
  ('2026-06-20', '13:00', '12:00', 'Chiddingstone CC', 'Chiddingstone Cricket Ground', 'A', 2026, 51.1855, 0.1535),
  ('2026-06-27', '13:00', '12:15', 'West Farleigh CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-07-04', '13:00', '12:00', 'Outwood CC', 'Outwood Cricket Club', 'A', 2026, 51.2049, -0.0698),
  ('2026-07-11', '13:00', '12:15', 'Farningham CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-07-18', '13:00', '12:00', 'Shoreham & Otford CC', 'Shoreham Cricket Ground', 'A', 2026, 51.3272, 0.1874),
  ('2026-07-25', '13:00', '12:15', 'Bearsted CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-08-01', '13:00', '12:00', 'Locksbottom CC', 'Tugmutton Common', 'A', 2026, 51.3742, 0.0503),
  ('2026-08-08', '13:00', '12:00', 'Groombridge CC', 'Groombridge CC', 'A', 2026, 51.1115, 0.1838),
  ('2026-08-15', '13:00', '12:15', 'Hadlow CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-08-22', '13:00', '12:15', 'Chiddingstone CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305),
  ('2026-08-29', '13:00', '12:00', 'West Farleigh CC', 'Church Lane, West Farleigh', 'A', 2026, 51.2502, 0.4751),
  ('2026-09-05', '13:00', '12:15', 'Outwood CC', 'St Lawrence CC', 'H', 2026, 51.2748, 0.2305)
on conflict do nothing;

-- Seed: Players (from Play-Cricket squad list, all defaulted to AR — update roles as needed)
insert into players (name, role, is_ringin) values
  ('Freddie Ball', 'AR', false),
  ('S Banham', 'AR', false),
  ('Jonathan Barnard', 'AR', false),
  ('Andrew Bujtor', 'AR', false),
  ('Oliver Burles', 'AR', false),
  ('Thomas Burles', 'AR', false),
  ('Tim Burles', 'AR', false),
  ('Steve Burton', 'AR', false),
  ('Deon Chetti', 'AR', false),
  ('Paul Cook', 'AR', false),
  ('Alex Cowan', 'AR', false),
  ('Edward Darry', 'AR', false),
  ('Ewan Davie', 'AR', false),
  ('Jason Davie', 'AR', false),
  ('Roger De Sousa', 'AR', false),
  ('Sam Druce-Smith', 'AR', false),
  ('Joe Edwards', 'AR', false),
  ('Nick Edwards', 'AR', false),
  ('Gary Evans', 'AR', false),
  ('Jack Greener', 'AR', false),
  ('Guy Heasman', 'AR', false),
  ('Ross Henderson', 'AR', false),
  ('Gerhard Human', 'AR', false),
  ('James Jackson', 'AR', false),
  ('Jack Kaye', 'AR', false),
  ('Phil Kaye', 'AR', false),
  ('Mark Lennon', 'AR', false),
  ('Paul Martin', 'AR', false),
  ('Tony Martin', 'AR', false),
  ('Mark Molloy', 'AR', false),
  ('Bob Myers', 'AR', false),
  ('Clint Olivier', 'AR', false),
  ('Whistiaan Opperman', 'AR', false),
  ('Dak Patel', 'AR', false),
  ('Chad Pazensky', 'AR', false),
  ('Chris Pedder', 'AR', false),
  ('Ewan Pedder', 'AR', false),
  ('Neil Petch-Smith', 'AR', false),
  ('Jack Ponsford', 'AR', false),
  ('James Porter', 'AR', false),
  ('Karan Puri', 'AR', false),
  ('Toby Raj', 'AR', false),
  ('Matthew Rothery', 'AR', false),
  ('James Rothwell', 'AR', false),
  ('Chris Rowley', 'AR', false),
  ('Sam Rowley', 'AR', false),
  ('Tom Rowley', 'AR', false),
  ('Greg Shea', 'AR', false),
  ('Matthew Sparkes', 'AR', false),
  ('Corrie Thompson', 'AR', false),
  ('Nik Williams', 'AR', false),
  ('Dave Wood', 'AR', false),
  ('Sam Wood', 'AR', false)
on conflict do nothing;
