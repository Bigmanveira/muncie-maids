-- 0013: One login across all three apps.
--
-- handle_new_user (0003/0005) only creates the row for the app someone
-- signed up through, so a client who later signs in to the cleaner app (or
-- a cleaner who books a cleaning visit) had no row there and hit a dead
-- end. ensure_app_profile lets a signed-in user create THEIR OWN row for
-- the app they are using, seeded from what they already gave us.
--
-- Security: SECURITY DEFINER, but it only ever inserts for auth.uid(), only
-- the client or cleaner row, and never touches status/approval fields — a
-- new cleaner row starts at the default 'applied' status and must go
-- through the full application + vetting + ops approval. Ops access is not
-- self-serve: it stays grant-only via ops-add-ops-user.

create or replace function public.ensure_app_profile(app text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  meta jsonb;
  user_email text;
  known_name text;
  known_phone text;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  select raw_user_meta_data, email into meta, user_email from auth.users where id = uid;

  -- Best name/phone we already have, from any app: sign-up metadata
  -- (including Google's full_name), the client profile, or the cleaner row.
  select coalesce(
           nullif(meta ->> 'name', ''),
           nullif(meta ->> 'full_name', ''),
           (select nullif(name, '') from profiles where id = uid),
           (select nullif(name, '') from cleaners where id = uid),
           ''),
         coalesce(
           nullif(meta ->> 'phone', ''),
           (select nullif(phone, '') from profiles where id = uid),
           (select nullif(phone, '') from cleaners where id = uid),
           '')
    into known_name, known_phone;

  if app = 'client' then
    insert into profiles (id, name, phone)
    values (uid, known_name, known_phone)
    on conflict (id) do nothing;
  elsif app = 'cleaner' then
    insert into cleaners (id, name, phone, email)
    values (uid, known_name, known_phone, coalesce(user_email, ''))
    on conflict (id) do nothing;
  else
    raise exception 'unknown app: %', app;
  end if;
end;
$$;

revoke all on function public.ensure_app_profile(text) from public, anon;
grant execute on function public.ensure_app_profile(text) to authenticated;
