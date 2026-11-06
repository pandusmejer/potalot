-- 01 — LÆSENDE kontrol FØR migration A (ændrer intet). Forventede værdier står i produktionsplanen.

-- 1) Fingeraftryk af de relevante objekter (skal være IDENTISKE med baseline fra testen)
with t(tabel) as (values ('profiles'),('general_garden_tasks'),('community_memberships')),
k as (
 select 'kolonner' as art, tabel||'.'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull||':'||coalesce(pg_get_expr(d.adbin,d.adrelid),'') as x
   from t join pg_attribute a on a.attrelid=('public.'||t.tabel)::regclass and a.attnum>0 and not a.attisdropped left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
 union all select 'constraints', tabel||'.'||conname||':'||pg_get_constraintdef(c.oid) from t join pg_constraint c on c.conrelid=('public.'||t.tabel)::regclass
 union all select 'indeks', indexdef from pg_indexes where schemaname='public' and tablename in (select tabel from t)
 union all select 'politikker', tablename||'|'||policyname||'|'||cmd||'|'||permissive||'|'||roles::text||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') from pg_policies where schemaname='public' and tablename in (select tabel from t)
 union all select 'tabel-grants', table_name||'|'||grantee||'|'||privilege_type from information_schema.role_table_grants where table_schema='public' and table_name in (select tabel from t) and grantee in ('anon','authenticated','service_role')
 union all select 'kolonne-grants', table_name||'.'||column_name||'|'||grantee||'|'||privilege_type from information_schema.role_column_grants where table_schema='public' and table_name in (select tabel from t) and grantee in ('anon','authenticated','service_role')
 union all select 'triggere', pg_get_triggerdef(tg.oid) from pg_trigger tg where tg.tgrelid in ('public.profiles'::regclass,'auth.users'::regclass) and not tg.tgisinternal and tg.tgname in ('tr_set_admin_on_profile_insert','on_auth_user_created')
 union all select 'rls-flag', c.relname||':'||c.relrowsecurity||':'||c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in (select tabel from t)
 union all select 'funktioner-acl', p.proname||':'||p.prosecdef||':'||coalesce(p.proacl::text,'') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('delete_account','is_username_available','handle_new_user','set_admin_on_profile_insert')
 union all select 'funktioner-krop', p.proname||':'||regexp_replace(pg_get_functiondef(p.oid),'annamejer@hotmail\.com|owner@example\.test','<ejer-mail>','g') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('delete_account','is_username_available','handle_new_user','set_admin_on_profile_insert')
)
select art, count(*) as antal, md5(string_agg(x, E'\n' order by x)) as fingeraftryk from k group by art order by art;

-- 2) Tilstand: forventet admins=1, ikke_free=0, profil_triggere=1, ingen lange transaktioner/ventende låse,
--    seneste_migration_version=20260830184352 og antal_migrationer=22 (ellers: STOP og vurdér igen)
select (select count(*) from public.profiles) as profiler,
       (select count(*) from public.profiles where is_admin) as admins,
       (select count(*) from public.profiles where subscription_tier is distinct from 'free') as ikke_free,
       (select count(*) from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal) as profil_triggere,
       (select count(*) from pg_stat_activity where datname=current_database() and state='idle in transaction' and now()-xact_start > interval '1 minute') as aabne_lange_transaktioner,
       (select count(*) from pg_locks l join pg_class c on c.oid=l.relation where c.relname='profiles' and not l.granted) as ventende_laase,
       (select max(version) from supabase_migrations.schema_migrations) as seneste_migration_version,
       (select count(*) from supabase_migrations.schema_migrations) as antal_migrationer;

-- 3) Integritetshash (kun rettigheds-relevante felter; må IKKE ændre sig pga. migrationen) — noter værdien
select count(*) as n, md5(coalesce(string_agg(id::text||':'||is_admin::text||':'||coalesce(subscription_tier,'')||':'||created_at::text, '|' order by id),'')) as rettighedshash from public.profiles;

-- 4) Id'er til efter-kontrollen
select 'almindelig bruger' as rolle, id from (select id from public.profiles where not is_admin order by created_at limit 1) x
union all select 'admin', id from public.profiles where is_admin;
