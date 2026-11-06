-- BD-01 — LÆSENDE kontrol FØR migration B og D (ændrer intet).
-- Forventede værdier står i BD-migrationsplan.md. Afvig ét tal → STOP og vurdér igen.

-- 1) Tilstand FØR: A er anvendt; B og D findes ikke. (Tilføj "forventet"-kolonnen mentalt.)
select
  (select count(*) from public.profiles)                                                         as profiler,
  (select count(*) from public.profiles where is_admin)                                          as admins,                -- forventet 1
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='profiles' and column_name like 'ai_personlig_kontekst%')   as samtykke_kolonner,   -- forventet 0 (B findes ikke)
  (select to_regclass('public.ai_dagsforbrug') is null)                                          as d_tabel_findes_ikke,   -- forventet true
  (select to_regprocedure('public.reserver_gartner_spoergsmaal(integer)') is null)             as d_funktion_findes_ikke,-- forventet true
  (select to_regprocedure('public.saet_ai_samtykke_tidspunkt()') is null)                       as b_funktion_findes_ikke,-- forventet true
  (select count(*) from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal) as profil_triggere,    -- forventet 2 (admin-insert + A)
  (select has_column_privilege('authenticated','public.profiles','is_admin','UPDATE'))          as auth_kan_saette_is_admin,-- forventet false (A er anvendt)
  (select to_regprocedure('public.delete_account(uuid)') is not null)                            as delete_account_findes,  -- forventet true
  (select count(*) from pg_stat_activity where datname=current_database() and state='idle in transaction' and now()-xact_start > interval '1 minute') as aabne_lange_transaktioner, -- forventet 0
  (select count(*) from pg_locks l join pg_class c on c.oid=l.relation where c.relname='profiles' and not l.granted)  as ventende_laase;  -- forventet 0

-- 2) Baseline for "eksisterende data er uændrede" — GEM værdierne og sammenlign i BD-02.
select count(*) as antal,
       md5(coalesce(string_agg(t::text, '|' order by id), '')) as profiler_hash
  from (select id, display_name, avatar_url, subscription_tier, user_mode, onboarded, username, is_admin,
               latitude, longitude, location_name from public.profiles) t;

select count(*) as ai_samtaler,
       md5(coalesce(string_agg(id::text, '|' order by id), '')) as ai_samtaler_id_hash
  from public.ai_conversations;
-- (BD ændrer hverken ai_conversations eller profildata. Tallene skal være IDENTISKE efter.)

-- 3) Migrationsregisteret (kendt drift — se migration_tracker_drift): noter blot værdierne.
select max(version) as seneste_version, count(*) as antal from supabase_migrations.schema_migrations;

-- 4) Standardrettigheder, som D's REVOKE skal lukke (produktionens ældre, brede defaults).
select pg_get_userbyid(defaclrole) as ejer, defaclobjtype as objekttype, defaclacl::text as standard_acl
  from pg_default_acl
 where defaclnamespace = 'public'::regnamespace or defaclnamespace = 0;
