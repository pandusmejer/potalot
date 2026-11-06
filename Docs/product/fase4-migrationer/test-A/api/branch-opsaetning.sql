-- Opsætning af de RELEVANTE dele af produktionsskemaet på en tom Supabase-testbranch (6/11 2026).
-- Bygget fra produktionens verificerede metadata (kolonner, constraints, indeks, politikker, triggere, funktioner).
-- Afvigelser fra produktion (bevidste):
--   * set_admin_on_profile_insert bruger 'owner@example.test' i stedet for projektejerens mail.
--   * Repræsentative brugertabeller (inventory_items, plants_v2, plant_logs_v2, calendar_tasks, ai_conversations)
--     er forenklede; produktion har 39 tabeller med user_id.
--   * community_groups er minimal (kun id) til FK'en.
-- Branchens standardrettigheder er strammere end produktionens (nye tabeller får ikke data-rettigheder til API-rollerne);
-- derfor gives rettighederne eksplicit som i produktion (se bunden), før fingeraftrykkene sammenlignes.

create extension if not exists citext with schema public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, avatar_url text, subscription_tier text default 'free',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_mode text default 'afslappet', onboarded boolean default false, username citext,
  is_admin boolean not null default false, last_badge_backfill_at timestamptz,
  latitude double precision, longitude double precision, location_name text,
  garden_type text, growing_areas text[] default '{}'::text[], grower_profile text,
  notification_profile text, season_status text,
  constraint profiles_subscription_tier_check check (subscription_tier = any (array['free'::text,'pro'::text,'premium'::text])),
  constraint profiles_user_mode_check check (user_mode = any (array['maalrettet'::text,'afslappet'::text,'minimal'::text])),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,20}$'::citext)
);
create index idx_profiles_last_backfill on public.profiles using btree (last_badge_backfill_at);
create unique index profiles_username_unique on public.profiles using btree (username) where (username is not null);
alter table public.profiles enable row level security;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- Funktioner: produktionens PRÆCISE kildetekst (pg_get_functiondef), jf. fingeraftryks-sammenligningen.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, onboarded)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $function$;
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = p_username::citext
  );
END; $function$;
CREATE OR REPLACE FUNCTION public.set_admin_on_profile_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
declare
  user_email text;
begin
  select email into user_email from auth.users where id = new.id;
  if lower(user_email) = 'owner@example.test' then
    new.is_admin := true;
  end if;
  return new;
end;
$function$;
create trigger tr_set_admin_on_profile_insert before insert on public.profiles for each row execute function public.set_admin_on_profile_insert();
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.general_garden_tasks (
  id uuid not null default gen_random_uuid(), title text not null, description text, month integer not null, season text,
  category text, priority text not null default 'medium'::text, time_window text, tip text, risk text,
  linked_guide_ids text[] default '{}'::text[], recurrence text not null default 'yearly'::text, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid,
  constraint general_garden_tasks_pkey primary key (id),
  constraint general_garden_tasks_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null,
  constraint general_garden_tasks_month_check check (month >= 1 and month <= 12),
  constraint general_garden_tasks_priority_check check (priority = any (array['low'::text,'medium'::text,'high'::text,'critical'::text]))
);
create index idx_general_garden_tasks_month on public.general_garden_tasks using btree (month) where (is_active = true);
alter table public.general_garden_tasks enable row level security;
create policy "general_garden_tasks admin write" on public.general_garden_tasks for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "general_garden_tasks read active" on public.general_garden_tasks for select using (is_active = true);

create table public.community_groups (id uuid primary key default gen_random_uuid());
create table public.community_memberships (
  id uuid not null default gen_random_uuid(), group_id uuid not null, user_id uuid not null, role text default 'member'::text,
  invited_at timestamptz not null default now(), joined_at timestamptz, declined_at timestamptz, created_at timestamptz not null default now(),
  constraint community_memberships_pkey primary key (id),
  constraint community_memberships_group_id_fkey foreign key (group_id) references public.community_groups(id) on delete cascade,
  constraint community_memberships_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint community_memberships_group_id_user_id_key unique (group_id, user_id),
  constraint community_memberships_role_check check (role = any (array['member'::text,'moderator'::text]))
);
create index idx_memberships_group on public.community_memberships using btree (group_id);
create index idx_memberships_joined on public.community_memberships using btree (joined_at) where (joined_at is not null);
create index idx_memberships_user on public.community_memberships using btree (user_id);
alter table public.community_memberships enable row level security;
create policy "Memberships readable by member" on public.community_memberships for select using (auth.uid() = user_id or auth.role() = 'authenticated'::text);
create policy "Users manage own memberships" on public.community_memberships for all using (auth.uid() = user_id);

create table public.inventory_items (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), name text);
create table public.plants_v2 (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), name text, source_inventory_id uuid references public.inventory_items(id));
create table public.plant_logs_v2 (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), plant_id uuid not null references public.plants_v2(id) on delete cascade);
create table public.calendar_tasks (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), title text);
create table public.ai_conversations (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, messages jsonb not null default '[]'::jsonb);

CREATE OR REPLACE FUNCTION public.delete_account(p_user uuid) RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog' AS $function$
DECLARE
  remaining text[];
  failed text[];
  t text;
  progress boolean;
BEGIN
  IF p_user IS NULL THEN RETURN ARRAY[]::text[]; END IF;

  SELECT array_agg(c.table_name)
    INTO remaining
  FROM information_schema.columns c
  JOIN information_schema.tables tb
    ON tb.table_schema = c.table_schema
   AND tb.table_name = c.table_name
   AND tb.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public' AND c.column_name = 'user_id';

  LOOP
    failed := ARRAY[]::text[];
    progress := false;
    FOREACH t IN ARRAY remaining LOOP
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', t) USING p_user;
        progress := true;
      EXCEPTION WHEN foreign_key_violation THEN
        failed := array_append(failed, t);
      END;
    END LOOP;
    remaining := failed;
    EXIT WHEN array_length(remaining, 1) IS NULL OR NOT progress;
  END LOOP;

  RETURN remaining;
END $function$;

-- Rettigheder som i produktion (produktionens standardrettigheder er bredere end branchens).
GRANT ALL ON TABLE public.profiles, public.general_garden_tasks, public.community_memberships TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.community_groups, public.inventory_items, public.plants_v2, public.plant_logs_v2, public.calendar_tasks, public.ai_conversations TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user(), public.is_username_available(text), public.set_admin_on_profile_insert() TO public, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.delete_account(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account(uuid) TO service_role;
