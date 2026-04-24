-- Enable Row Level Security on existing tables with public-read-only policies.
-- Writes are performed server-side via service_role (which bypasses RLS)
-- in app/api/{availability,players,fixtures}/route.ts.

alter table players      enable row level security;
alter table fixtures     enable row level security;
alter table availability enable row level security;

drop policy if exists "public read players"      on players;
drop policy if exists "public read fixtures"     on fixtures;
drop policy if exists "public read availability" on availability;

create policy "public read players"      on players      for select using (true);
create policy "public read fixtures"     on fixtures     for select using (true);
create policy "public read availability" on availability for select using (true);
