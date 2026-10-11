-- 0012: Scheduled emails — day-before client reminders, ops alerts for
-- gigs that escalated to needs_ops, and ops alerts for cleaner applications
-- ready for review. The send-scheduled-emails edge function does the work;
-- these columns record what already went out so nothing sends twice.
-- All three are service-role-only (no grants to `authenticated`).

alter table bookings add column reminder_sent_at timestamptz;
alter table bookings add column needs_ops_alerted_at timestamptz;
alter table cleaners add column application_alerted_at timestamptz;

-- pg_net lets pg_cron make the HTTP call to the edge function.
create extension if not exists pg_net;

-- Every 15 minutes, same cadence as escalate_stale_gigs (0005) and
-- expire_stale_offers (0010). The function is idempotent and needs no
-- credentials, so the call carries none.
select cron.schedule(
  'send-scheduled-emails',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := 'https://oeazazszuwppfpddgggr.supabase.co/functions/v1/send-scheduled-emails',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
