-- Contact form submissions: persisted to Supabase so we never lose one
-- if Resend / inbox delivery fails (e.g. spam filtering, transient API errors).
--
-- All writes happen via the /api/contact route using the service-role
-- client; no public RLS policy. Reads are admin-only via the dashboard
-- (or a future protected /admin/messages page).

create table if not exists public.contact_messages (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  -- Submission metadata for spam triage / debugging
  user_agent  text,
  source_ip   text,
  -- Email delivery tracking
  resend_id       text,        -- Resend message id once accepted
  email_sent_at   timestamptz, -- null = email step failed or skipped
  email_error     text         -- last error if delivery did not succeed
);

-- Newest first when scanning admin
create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- Lock down: no public access. Service-role bypasses RLS so the API
-- route can still write. Admin reads happen via the Supabase dashboard.
alter table public.contact_messages enable row level security;

-- (No policies on purpose — RLS without policies blocks anon + authenticated.)
