-- Ops portal (M3, per munciemaids-product-plan-v2.md §5.3): the allowlist
-- of who can access it, the offer mechanic for assigning needs_ops gigs,
-- and real T-36h auto-escalation via pg_cron.

create table ops_users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

-- No policies for anon/authenticated — same zero-policy pattern as
-- `bookings`. All access goes through Edge Functions using the service role.
alter table ops_users enable row level security;

-- Offer mechanic ----------------------------------------------------------
-- Ops proposes a cleaner for a needs_ops (or still-open) gig; the cleaner
-- must accept from their own portal. This is never a unilateral assignment
-- — see product-plan-v2 §8, the IC-classification design constraint.

alter table bookings add column offered_cleaner_id uuid references cleaners (id);
alter table bookings add column offered_at timestamptz;

-- Simplify the cleaner status lifecycle ------------------------------------
-- Collapses the unused 'approved' intermediate state: ops approval now
-- grants full working status directly. Adds 'declined' so a rejected
-- application reads differently from a roster member later deactivated.

alter table cleaners drop constraint cleaners_status_check;
alter table cleaners add constraint cleaners_status_check
  check (status in ('applied', 'active', 'declined', 'deactivated'));

-- Auto-escalation: unclaimed gigs flip to needs_ops at T-36h --------------

create extension if not exists pg_cron;

create or replace function escalate_stale_gigs()
returns void
language sql
security definer set search_path = public
as $$
  update bookings
  set status = 'needs_ops'
  where status = 'open'
    and (
      service_date + (
        case time_window
          when 'Morning' then interval '8 hours'
          when 'Mid-day' then interval '11 hours'
          when 'Afternoon' then interval '14 hours'
          else interval '8 hours'
        end
      )
    ) - now() <= interval '36 hours';
$$;

select cron.schedule('escalate-stale-gigs', '*/15 * * * *', 'select escalate_stale_gigs();');

-- Signup fan-out: add the ops branch ---------------------------------------
-- First ops signup becomes the owner automatically (bootstrap). Anyone
-- after that gets an auth.users row but no ops_users row — they can sign
-- in, but the ops app shows "not authorized" until an existing owner adds
-- them (see the ops-add-ops-user Edge Function).

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ops_count int;
begin
  if coalesce(new.raw_user_meta_data ->> 'role', 'client') = 'cleaner' then
    insert into public.cleaners (id, name, phone, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      new.email
    );
  elsif coalesce(new.raw_user_meta_data ->> 'role', 'client') = 'ops' then
    select count(*) into ops_count from public.ops_users;
    if ops_count = 0 then
      insert into public.ops_users (id, name, email, role)
      values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), new.email, 'owner');
    end if;
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
