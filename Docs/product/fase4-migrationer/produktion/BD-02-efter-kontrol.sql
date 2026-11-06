-- BD-02 — kontrol EFTER migration B og D.
-- 100 % rollback-sikker: hele blokken ender med RAISE EXCEPTION, så INTET kan persistere
-- (resultaterne læses i fejlbeskeden "CHECK-RESULTAT: …"). Ingen konti oprettes. De skrivende prøver
-- (samtykke, reservation) kører som en rigtig bruger i blokken og rulles tilbage sammen med alt andet.
-- Erstat {{BRUGER_UID}} og {{ANDEN_UID}} med to FORSKELLIGE eksisterende, ikke-admin brugere:
--   select id from public.profiles where not is_admin order by created_at limit 2;
-- Forventet: INGEN linje med [FEJL]. Alle [OK].
do $$
declare
  v_bruger uuid := '{{BRUGER_UID}}';
  v_anden  uuid := '{{ANDEN_UID}}';
  r text := '';
  n int;
  b boolean;
  u record;
  t1 timestamptz;
begin
  -- A. Katalog -------------------------------------------------------------------------------------------
  r := r || E'\n--- katalog';
  select count(*) into n from information_schema.columns where table_schema='public' and table_name='profiles' and column_name in ('ai_personlig_kontekst','ai_personlig_kontekst_aendret');
  r := r || E'\n[' || case when n = 2 then 'OK' else 'FEJL' end || '] B: 2 nye kolonner på profiles (fik ' || n || ')';
  select count(*) into n from public.profiles where ai_personlig_kontekst is distinct from false or ai_personlig_kontekst_aendret is not null;
  r := r || E'\n[' || case when n = 0 then 'OK' else 'FEJL' end || '] B: alle profiler har samtykke=false og intet tidsstempel (afvigere: ' || n || ')';
  r := r || E'\n[' || case when has_column_privilege('authenticated','public.profiles','ai_personlig_kontekst','UPDATE') then 'OK' else 'FEJL' end || '] B: authenticated kan opdatere selve valget';
  r := r || E'\n[' || case when not has_column_privilege('authenticated','public.profiles','ai_personlig_kontekst_aendret','UPDATE') then 'OK' else 'FEJL' end || '] B: authenticated kan IKKE opdatere tidsstemplet';
  r := r || E'\n[' || case when not has_column_privilege('anon','public.profiles','ai_personlig_kontekst','UPDATE') then 'OK' else 'FEJL' end || '] B: anon kan ikke opdatere valget';
  r := r || E'\n[' || case when not has_column_privilege('authenticated','public.profiles','is_admin','UPDATE') and not has_column_privilege('authenticated','public.profiles','subscription_tier','UPDATE') then 'OK' else 'FEJL' end || '] A intakt: is_admin/subscription_tier stadig låst';
  select count(*) into n from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal;
  r := r || E'\n[' || case when n = 3 then 'OK' else 'FEJL' end || '] profiles har 3 triggere (admin-insert, A, B) — fik ' || n;
  select prosecdef into b from pg_proc where proname='saet_ai_samtykke_tidspunkt' and pronamespace='public'::regnamespace;
  r := r || E'\n[' || case when b = false then 'OK' else 'FEJL' end || '] B: triggerfunktionen er SECURITY INVOKER (prosecdef=' || coalesce(b::text,'findes ikke') || ')';

  r := r || E'\n[' || case when to_regclass('public.ai_dagsforbrug') is not null then 'OK' else 'FEJL' end || '] D: tabellen ai_dagsforbrug findes';
  select relrowsecurity into b from pg_class where oid = 'public.ai_dagsforbrug'::regclass;
  r := r || E'\n[' || case when b then 'OK' else 'FEJL' end || '] D: RLS er slået til';
  r := r || E'\n[' || case when not has_table_privilege('anon','public.ai_dagsforbrug','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') and not has_table_privilege('authenticated','public.ai_dagsforbrug','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') then 'OK' else 'FEJL' end || '] D: anon og authenticated har INGEN tabelrettigheder';
  r := r || E'\n[' || case when has_table_privilege('service_role','public.ai_dagsforbrug','SELECT,DELETE') then 'OK' else 'FEJL' end || '] D: service_role kan stadig bruge tabellen (kontosletning)';
  select prosecdef into b from pg_proc where proname='reserver_gartner_spoergsmaal' and pronamespace='public'::regnamespace;
  r := r || E'\n[' || case when b then 'OK' else 'FEJL' end || '] D: funktionen er SECURITY DEFINER';
  r := r || E'\n[' || case when has_function_privilege('authenticated','public.reserver_gartner_spoergsmaal(integer)','EXECUTE') and not has_function_privilege('anon','public.reserver_gartner_spoergsmaal(integer)','EXECUTE') then 'OK' else 'FEJL' end || '] D: EXECUTE for authenticated, IKKE for anon';
  select count(*) into n from pg_policies where tablename='ai_dagsforbrug';
  r := r || E'\n[' || case when n = 0 then 'OK' else 'FEJL' end || '] D: ingen RLS-politikker (ingen vej ind for API-rollerne)';
  select count(*) into n from information_schema.columns where table_schema='public' and table_name='ai_dagsforbrug' and column_name='user_id';
  r := r || E'\n[' || case when n = 1 then 'OK' else 'FEJL' end || '] D: kolonnen hedder user_id (delete_account rydder automatisk)';

  -- B. Funktionelt som en rigtig bruger (alt rulles tilbage) -----------------------------------------------
  r := r || E'\n--- funktionelt (almindelig bruger, rulles tilbage)';
  perform set_config('request.jwt.claims', json_build_object('sub', v_bruger, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- D: grænse 2 → tilladt, tilladt, afvist
  select * into u from public.reserver_gartner_spoergsmaal(2);
  r := r || E'\n[' || case when u.tilladt and u.brugt = 1 then 'OK' else 'FEJL' end || '] D: 1. kald tilladt (brugt ' || u.brugt || ')';
  select * into u from public.reserver_gartner_spoergsmaal(2);
  r := r || E'\n[' || case when u.tilladt and u.brugt = 2 then 'OK' else 'FEJL' end || '] D: 2. kald tilladt (brugt ' || u.brugt || ')';
  select * into u from public.reserver_gartner_spoergsmaal(2);
  r := r || E'\n[' || case when not u.tilladt and u.brugt = 2 then 'OK' else 'FEJL' end || '] D: 3. kald AFVIST ved grænsen (brugt ' || u.brugt || ')';
  select * into u from public.reserver_gartner_spoergsmaal(null);
  r := r || E'\n[' || case when not u.tilladt then 'OK' else 'FEJL' end || '] D: ugyldig grænse (null) afvises';

  begin perform 1 from public.ai_dagsforbrug limit 1;
    r := r || E'\n[FEJL] D: authenticated kunne læse tælleren'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] D: direkte læsning af tælleren afvist: ' || sqlerrm; when sqlstate 'P0001' then null; end;
  begin update public.ai_dagsforbrug set antal = 0;
    r := r || E'\n[FEJL] D: tælleren kunne nulstilles'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] D: nulstilling af tælleren afvist: ' || sqlerrm; when sqlstate 'P0001' then null; end;

  -- B: samtykke
  update public.profiles set ai_personlig_kontekst = true where id = v_bruger;
  select ai_personlig_kontekst_aendret into t1 from public.profiles where id = v_bruger;
  r := r || E'\n[' || case when t1 is not null and t1 > now() - interval '1 minute' then 'OK' else 'FEJL' end || '] B: samtykke slået til → databasen satte tidsstemplet';
  begin update public.profiles set ai_personlig_kontekst_aendret = '2000-01-01' where id = v_bruger;
    r := r || E'\n[FEJL] B: tidsstemplet kunne forfalskes'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] B: forfalskning af tidsstemplet afvist: ' || sqlerrm; when sqlstate 'P0001' then null; end;
  update public.profiles set ai_personlig_kontekst = true where id = v_anden;
  get diagnostics n = row_count;
  r := r || E'\n[' || case when n = 0 then 'OK' else 'FEJL' end || '] B: en anden brugers samtykke kan ikke ændres (0 rækker berørt, fik ' || n || ')';
  begin update public.profiles set ai_personlig_kontekst = true, is_admin = true where id = v_bruger;
    r := r || E'\n[FEJL] B: blandet opdatering med is_admin lykkedes'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] B: blandet opdatering (samtykke + is_admin) afvist'; when sqlstate 'P0001' then null; end;
  update public.profiles set ai_personlig_kontekst = false where id = v_bruger;
  select ai_personlig_kontekst into b from public.profiles where id = v_bruger;
  r := r || E'\n[' || case when b = false then 'OK' else 'FEJL' end || '] B: tilbagetrækning virker med det samme';
  reset role;

  -- C. Anon -------------------------------------------------------------------------------------------------
  set local role anon;
  begin perform * from public.reserver_gartner_spoergsmaal(30);
    r := r || E'\n[FEJL] D: anon kunne kalde funktionen'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] D: anon kan ikke kalde funktionen: ' || sqlerrm; when sqlstate 'P0001' then null; end;
  reset role;

  raise exception 'CHECK-RESULTAT: %', r;   -- tvinger rollback; resultatet læses i fejlbeskeden
end $$;
