-- 0010: Offer expiry — auto-offers (and manual offers) that sit unanswered
-- must not park a gig indefinitely: while a booking carries an offer it is
-- hidden from every other cleaner's open feed. After 4 hours an unanswered
-- offer is cleared and the gig returns to the open feed for anyone eligible
-- to claim. The expiry is logged as an event with the offered cleaner as
-- actor so the allocation engine skips them on any future auto-offer for
-- this booking (same treatment as an explicit decline — but, per the IC
-- rules, it is never held against the cleaner anywhere else).
--
-- Runs on the same 15-minute pg_cron cadence as escalate_stale_gigs (0005).

create or replace function expire_stale_offers()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  expired record;
begin
  for expired in
    select id, offered_cleaner_id
    from bookings
    where offered_cleaner_id is not null
      and status in ('open', 'needs_ops')
      and offered_at < now() - interval '4 hours'
  loop
    update bookings
    set offered_cleaner_id = null, offered_at = null
    where id = expired.id;

    insert into events (booking_id, actor_type, actor_id, action)
    values (expired.id, 'system', expired.offered_cleaner_id, 'offer_expired');
  end loop;
end;
$$;

select cron.schedule('expire-stale-offers', '*/15 * * * *', 'select expire_stale_offers();');
