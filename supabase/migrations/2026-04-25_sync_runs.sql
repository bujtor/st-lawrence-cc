create table if not exists sync_runs (
  id           bigserial primary key,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  trigger      text not null,             -- 'cron', 'manual', 'cron-noop'
  target       text,                      -- 'all', 'players', 'fixtures', etc.
  season       integer,
  status       text not null,             -- 'success', 'partial', 'error'
  error        text,
  result_summary jsonb                    -- the JSON body returned
);

create index if not exists sync_runs_started_at on sync_runs (started_at desc);
create index if not exists sync_runs_status on sync_runs (status) where status != 'success';

alter table sync_runs enable row level security;
-- No public-read for this one — sync_runs is internal observability only.
-- Service-role bypasses RLS, so writes work without policies.
