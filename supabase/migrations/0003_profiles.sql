-- Real user profiles, backing real Supabase Auth accounts.
-- One row per auth.users row, created automatically on signup.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,

  avatar_url text,
  bedrooms text,
  bathrooms text,
  sqft_band text,
  address_line text,
  city text,
  zip text,
  entry_notes text,
  has_pets boolean,
  preferred_frequency text,
  onboarding_completed boolean not null default false,
  onboarding_skipped boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Users can only ever see/edit their own profile row.
create policy "Users can view own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Row creation happens via the trigger below (as the postgres role), not
-- directly by the client, so no insert policy is needed for `authenticated`.

create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();
