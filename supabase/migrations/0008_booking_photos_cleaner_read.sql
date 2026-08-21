-- Cleaners can read (metadata only — no direct file access, that's still
-- signed-URL-only) the photo records for jobs they're claimed on, same
-- scoped-read pattern as "Cleaners can view their claimed bookings".
create policy "Cleaners can view photos on their claimed bookings"
  on booking_photos for select
  to authenticated
  using (
    exists (
      select 1 from bookings
      where bookings.id = booking_photos.booking_id
        and bookings.cleaner_id = auth.uid()
    )
  );
