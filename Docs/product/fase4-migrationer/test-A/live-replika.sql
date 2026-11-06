-- Isoleret replika af de RELEVANTE dele af live-databasen (verificeret read-only 6/11 2026).
-- Bruges kun til test af migration A/A2 i PGlite (in-memory Postgres). Ingen forbindelse til live.
-- Afvigelser: username er text (ikke citext); projektejerens mail er erstattet af en test-mail.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
         (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid $$;
create function auth.role() returns text language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.role', true),
         (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')), '') $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- ── profiles (kolonner, constraints, rettigheder, politikker, triggere som live) ──
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  subscription_tier text default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_mode text default 'afslappet',
  onboarded boolean default false,
  username text,
  is_admin boolean not null default false,
  last_badge_backfill_at timestamptz,
  latitude double precision,
  longitude double precision,
  location_name text,
  garden_type text,
  growing_areas text[] default '{}',
  grower_profile text,
  notification_profile text,
  season_status text,
  constraint profiles_subscription_tier_check check (subscription_tier = any (array['free','pro','premium'])),
  constraint profiles_user_mode_check check (user_mode = any (array['maalrettet','afslappet','minimal'])),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,20}$')
);
alter table public.profiles enable row level security;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- Supabase-standard tabelrettigheder (som målt live): anon, authenticated og service_role.
grant delete, insert, references, select, trigger, truncate, update on public.profiles to anon, authenticated, service_role;

create function public.set_admin_on_profile_insert() returns trigger language plpgsql security definer as $$
declare user_email text;
begin
  select email into user_email from auth.users where id = new.id;
  if lower(user_email) = 'owner@example.test' then new.is_admin := true; end if;
  return new;
end; $$;
create trigger tr_set_admin_on_profile_insert before insert on public.profiles
  for each row execute function public.set_admin_on_profile_insert();

create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, onboarded)
  values (new.id, split_part(new.email, '@', 1), false)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Admin-styret tabel (politikker som live: general_garden_tasks) ──
create table public.general_garden_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month int not null,
  is_active boolean not null default true
);
alter table public.general_garden_tasks enable row level security;
create policy "general_garden_tasks admin write" on public.general_garden_tasks for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "general_garden_tasks read active" on public.general_garden_tasks for select using (is_active = true);
grant delete, insert, references, select, trigger, truncate, update on public.general_garden_tasks to anon, authenticated, service_role;

-- ── community_memberships (kolonner, check, politikker, rettigheder som live) ──
create table public.community_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'member',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, user_id),
  constraint community_memberships_role_check check (role = any (array['member','moderator']))
);
alter table public.community_memberships enable row level security;
create policy "Memberships readable by member" on public.community_memberships for select
  using (auth.uid() = user_id or auth.role() = 'authenticated');
create policy "Users manage own memberships" on public.community_memberships for all using (auth.uid() = user_id);
grant delete, insert, references, select, trigger, truncate, update on public.community_memberships to anon, authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.community_memberships to service_role;

-- ── Testdata ──
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'alice@example.test'),
  ('00000000-0000-0000-0000-0000000000c1', 'bob@example.test');
