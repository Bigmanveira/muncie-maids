-- 0009: Cleaner vetting — the data we require before an application can be
-- approved. Customer security is the driver: cleaners enter customers' homes,
-- so approval now requires identity details, an ID document + profile photo,
-- references, an emergency contact, and an FCRA background-check consent with
-- an ops-recorded "clear" result.
--
-- Deliberate security choices:
--   * We NEVER collect or store SSNs. The background check runs through a
--     consumer reporting agency (Checkr/GoodHire/etc.) which collects the
--     SSN on its own portal. We store only the consent timestamp, provider
--     name, report reference, and the result status.
--   * ID documents + profile photos live in a private bucket with zero
--     client policies — all reads/writes go through signed URLs minted by
--     edge functions (same pattern as booking-photos, 0007).
--   * bg_check_* result fields and document paths are service-role-only:
--     the column-grant pattern from 0004 keeps them out of the
--     `authenticated` grant list, so a cleaner cannot mark their own check
--     "clear" or point their ID path at someone else's file.

alter table cleaners
  -- Identity (as it appears on their government ID)
  add column legal_name text,
  add column date_of_birth date,
  add column address_line1 text,
  add column address_city text,
  add column address_state text,
  add column address_zip text,
  -- Getting to jobs
  add column has_transportation boolean not null default false,
  add column has_drivers_license boolean not null default false,
  -- Work eligibility (I-9-style attestation; the W-9 is collected before
  -- first payout per the application screen's note)
  add column work_eligible_attested_at timestamptz,
  -- Emergency contact
  add column emergency_contact_name text,
  add column emergency_contact_phone text,
  -- Documents (paths in the private cleaner-documents bucket; written only
  -- by the request-cleaner-doc-upload edge function)
  add column profile_photo_path text,
  add column id_document_path text,
  -- Professional references: [{ "name", "relationship", "phone" }, ...]
  add column reference_contacts jsonb not null default '[]'::jsonb,
  -- FCRA background check: consent from the cleaner, result from ops
  add column bg_check_consented_at timestamptz,
  add column bg_check_status text not null default 'not_started'
    check (bg_check_status in ('not_started', 'pending', 'clear', 'consider', 'failed')),
  add column bg_check_provider text,
  add column bg_check_reference text,
  add column bg_check_completed_at timestamptz,
  -- Set once the cleaner submits the whole verification step
  add column verification_submitted_at timestamptz;

-- Self-serve columns only. Document paths and bg_check results are
-- deliberately NOT granted — they are written by edge functions using the
-- service role. (0004 revoked blanket update; this extends the grant list.)
grant update (
  legal_name, date_of_birth,
  address_line1, address_city, address_state, address_zip,
  has_transportation, has_drivers_license,
  work_eligible_attested_at,
  emergency_contact_name, emergency_contact_phone,
  reference_contacts,
  bg_check_consented_at,
  verification_submitted_at
) on cleaners to authenticated;

-- Private bucket for ID documents + profile photos. No storage.objects
-- policies: uploads happen via createSignedUploadUrl and reads via
-- createSignedUrl, both minted server-side after authorization.
insert into storage.buckets (id, name, public)
values ('cleaner-documents', 'cleaner-documents', false)
on conflict (id) do nothing;
