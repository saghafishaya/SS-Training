-- SS Training database starter schema
-- Run in Supabase SQL Editor after creating a new project.
-- IMPORTANT: Do not put a service-role key in frontend code.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  role text not null default 'player' check (role in ('player','admin')),
  xp bigint not null default 0 check (xp >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.training_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  xp_awarded integer not null check (xp_awarded > 0 and xp_awarded <= 100),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.training_events enable row level security;

create policy "Profiles are publicly readable for leaderboard"
on public.profiles for select using (true);

create policy "Players can update their own non-sensitive profile fields"
on public.profiles for update using (auth.uid() = id)
with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

create policy "Players can read their own training events"
on public.training_events for select using (auth.uid() = user_id);

-- Create profile row after signup. User metadata supplies username/display_name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_username text;
  chosen_name text;
begin
  chosen_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  chosen_name := coalesce(new.raw_user_meta_data->>'display_name', chosen_username);
  insert into public.profiles(id, username, display_name)
  values (new.id, chosen_username, chosen_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Username login helper. Returns synthetic email only for internal sign-in lookup.
create or replace function public.email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;
revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- XP is awarded server-side through this RPC, with a modest per-call ceiling.
-- For production, replace client-supplied reason/amount with validated event types
-- and rate-limit per user/session. This starter function caps each award at 30 XP.
create or replace function public.award_training_xp(p_amount integer, p_reason text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total bigint;
  safe_amount integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  safe_amount := least(greatest(coalesce(p_amount, 0), 0), 30);
  if safe_amount <= 0 then raise exception 'Invalid XP amount'; end if;
  if length(coalesce(p_reason,'')) > 80 then raise exception 'Invalid reason'; end if;
  update public.profiles set xp = xp + safe_amount where id = auth.uid() returning xp into new_total;
  if new_total is null then raise exception 'Profile not found'; end if;
  insert into public.training_events(user_id, reason, xp_awarded)
  values (auth.uid(), coalesce(p_reason,'Training'), safe_amount);
  return new_total;
end;
$$;
revoke all on function public.award_training_xp(integer,text) from public;
grant execute on function public.award_training_xp(integer,text) to authenticated;

-- ADMIN SETUP:
-- After you have registered your own account, run a query like this in SQL Editor:
-- update public.profiles set role = 'admin'
-- where lower(username) = lower('SSZN');
-- Do not expose your password or service-role key in SQL, source files, or chat.

-- Production hardening notes:
-- 1. Username uniqueness is case-sensitive at the index level; consider a unique index on lower(username).
-- 2. Add per-session/event validation and rate limiting before a public XP launch.
-- 3. If email confirmation is enabled, synthetic .invalid emails will not receive confirmation.
--    For username-only accounts, disable email confirmation for this Supabase project and use
--    a carefully reviewed username/password auth flow. Consider adding account recovery options.
