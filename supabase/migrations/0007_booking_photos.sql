-- Proof-of-service photos: a walkthrough shot from the client (before) and
-- one from the cleaner (after), both attached to the booking. Ops can review
-- both. "360" here means a wide panorama shot with the phone's native
-- camera (Panorama mode) — the app doesn't do its own stitching, it stores
-- whatever image comes back and pans across it if it's wide.

create table booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  uploaded_by text not null check (uploaded_by in ('client', 'cleaner')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- No policies for anon/authenticated — same zero-policy pattern as
-- `bookings`. All access goes through Edge Functions using the service
-- role (upload authorization + signed URLs), never a direct client query.
alter table booking_photos enable row level security;

-- Private bucket. Every read/write happens through short-lived signed URLs
-- minted server-side, so no storage.objects policy is needed either — a
-- signed URL is itself the authorization, scoped to one path.
insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', false);
