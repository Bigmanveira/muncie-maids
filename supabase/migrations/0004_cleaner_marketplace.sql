-- Cleaner marketplace (M2, per munciemaids-product-plan-v2.md): cleaner
-- applications, gig claiming, and the audit trail. Deliberately simplified
-- from the plan's full lifecycle for this pass:
--   - No `in_progress` status — there's no cron yet to flip a claimed gig to
--     in_progress on the service date, so a cleaner completes a claimed gig
--     directly. Revisit once day-of automation exists.
--   - No `otp_codes` table — cleaner auth is email/password (matching the
--     client app) for now, not the plan's phone+SMS-OTP. Swap later.
--   - No automated SMS — claim/release/complete write an `events` row same
--     as everything else, but nothing is texted yet (matches the client
--     side's already-stubbed notifications).

create table cleaners (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  towns text[] not null default '{}',
  services text[] not null default '{}',
  years_experience int,
  has_own_equipment boolean not null default false,
  status text not null default 'applied'
    check (status in ('applied', 'approved', 'active', 'deactivated')),
  agreement_signed_at timestamptz,
  reliability_completed int not null default 0,
  reliability_released int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cleaners enable row level security;

create policy "Cleaners can view own row"
  on cleaners for select
  to authenticated
  using (auth.uid() = id);

create policy "Cleaners can update own application info"
  on cleaners for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The row policy alone would let a cleaner rewrite their own status or
-- reliability stats. Column-level grants close that: only fields a cleaner
-- should self-serve are writable by `authenticated` — status changes
-- (approval) and reliability stats stay ops/service-role-only, which
-- bypasses RLS and grants entirely.
revoke update on cleaners from authenticated;
grant update (name, phone, email, towns, services, years_experience, has_own_equipment, agreement_signed_at)
  on cleaners to authenticated;

-- Row creation happens via handle_new_user (below), not directly by the
-- client, so no insert policy is needed for `authenticated`.

create trigger cleaners_set_updated_at
  before update on cleaners
  for each row execute function set_updated_at();

-- Audit trail -----------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  actor_type text not null check (actor_type in ('client', 'cleaner', 'ops', 'system')),
  actor_id uuid,
  action text not null,
  created_at timestamptz not null default now()
);

alter table events enable row level security;
-- No policies for anon/authenticated — written only by Edge Functions using
-- the service role, same pattern as bookings.

-- Gig lifecycle on bookings ----------------------------------------------

alter table bookings drop constraint bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('pending_payment', 'open', 'claimed', 'needs_ops', 'completed', 'cancelled'));

alter table bookings add column cleaner_id uuid references cleaners (id);
alter table bookings add column claimed_at timestamptz;
alter table bookings add column completed_at timestamptz;
alter table bookings add column payout_amount numeric;
alter table bookings add column payout_paid_at timestamptz;

-- Cleaners can read the full detail of gigs they've claimed (My Jobs). The
-- open marketplace feed goes through the list-gigs Edge Function instead,
-- since it needs town-matching + address redaction RLS can't express.
create policy "Cleaners can view their claimed bookings"
  on bookings for select
  to authenticated
  using (cleaner_id = auth.uid());

-- Signup fan-out: client vs cleaner ---------------------------------------
-- Which row gets created depends on the `role` chosen at signup time.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'role', 'client') = 'cleaner' then
    insert into public.cleaners (id, name, phone, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      new.email
    );
  else
    insert into public.profiles (id, name, phone)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      coalesce(new.raw_user_meta_data ->> 'phone', '')
    );
  end if;
  return new;
end;
$$;
