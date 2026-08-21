-- Ops actions like reviewing a cleaner application or adding an ops user
-- aren't tied to any booking, but still belong in the audit trail.
alter table events alter column booking_id drop not null;
