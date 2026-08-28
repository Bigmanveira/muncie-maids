-- 0011: Live audit log — let the ops portal subscribe to event INSERTs so
-- the Audit screen updates as actions happen, without polling.
--
-- The events table stays service-role-write-only. This adds exactly one
-- read path: authenticated users who exist in ops_users may SELECT. That
-- both allows direct reads and — critically — lets Supabase Realtime
-- deliver postgres_changes INSERT notifications to ops sessions (Realtime
-- enforces RLS per subscriber, so cleaners and customers receive nothing).

create policy "Ops can read events"
  on events for select
  to authenticated
  using (exists (select 1 from public.ops_users where id = auth.uid()));

-- Publish events to the realtime stream. (Tables are not in the
-- supabase_realtime publication by default.)
alter publication supabase_realtime add table events;
