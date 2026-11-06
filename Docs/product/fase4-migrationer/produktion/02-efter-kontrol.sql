-- 02 — kontrol EFTER migration A (og samme blok kan køres FØR for at se forskellen).
-- 100 % rollback-sikker: hele blokken ender med RAISE EXCEPTION, så INTET kan persistere
-- (resultaterne læses i fejlbeskeden "CHECK-RESULTAT: …"). Ingen konti oprettes, ingen data ændres.
-- Erstat {{IKKE_ADMIN_UID}} og {{ADMIN_UID}} med id'er fra:
--   select id from public.profiles where not is_admin limit 1;   -- en almindelig bruger
--   select id from public.profiles where is_admin;               -- den ene admin
do $$
declare
  v_ikke  uuid := '{{IKKE_ADMIN_UID}}';
  v_admin uuid := '{{ADMIN_UID}}';
  r text := '';
  n int;
  b boolean;
  kol text;
begin
  -- A. Katalog: kolonnerettigheder for authenticated (forventet: is_admin/subscription_tier/id/created_at = false; resten = true)
  r := r || E'\n--- katalog';
  foreach kol in array array['is_admin','subscription_tier','id','created_at','display_name','username','avatar_url','user_mode','onboarded','latitude','longitude','location_name','garden_type','growing_areas','grower_profile','notification_profile','season_status','last_badge_backfill_at','updated_at'] loop
    r := r || E'\nUPDATE ' || rpad(kol, 24) || ' authenticated=' || has_column_privilege('authenticated','public.profiles',kol,'UPDATE')::text
              || ' anon=' || has_column_privilege('anon','public.profiles',kol,'UPDATE')::text;
  end loop;
  r := r || E'\ntabel INSERT/DELETE/TRUNCATE authenticated=' || has_table_privilege('authenticated','public.profiles','INSERT')::text || '/' || has_table_privilege('authenticated','public.profiles','DELETE')::text || '/' || has_table_privilege('authenticated','public.profiles','TRUNCATE')::text;
  r := r || E'\nservice_role UPDATE/INSERT/DELETE=' || has_table_privilege('service_role','public.profiles','UPDATE')::text || '/' || has_table_privilege('service_role','public.profiles','INSERT')::text || '/' || has_table_privilege('service_role','public.profiles','DELETE')::text;
  select count(*) into n from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal;
  r := r || E'\nprofiles-triggere (forventet 2 efter A, 1 før): ' || n;
  select prosecdef into b from pg_proc where proname='afvis_klient_aendring_af_roller' and pronamespace='public'::regnamespace;
  r := r || E'\ntrigger-funktion SECURITY DEFINER (forventet false efter A): ' || coalesce(b::text,'(findes ikke)');
  r := r || E'\nauthenticated kan udføre delete_account (forventet false): ' || case when to_regprocedure('public.delete_account(uuid)') is null then '(findes ikke)' else has_function_privilege('authenticated','public.delete_account(uuid)','EXECUTE')::text end;
  r := r || E'\nservice_role kan udføre delete_account (forventet true): ' || case when to_regprocedure('public.delete_account(uuid)') is null then '(findes ikke)' else has_function_privilege('service_role','public.delete_account(uuid)','EXECUTE')::text end;

  -- B. Angreb som en almindelig bruger (hver prøve i sin egen delt-transaktion, der rulles tilbage)
  r := r || E'\n--- angreb (almindelig bruger)';
  perform set_config('request.jwt.claims', json_build_object('sub', v_ikke, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update public.profiles set is_admin = true where id = v_ikke;
    r := r || E'\n[FEJL] is_admin kunne ændres'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] is_admin afvist: ' || sqlerrm; when sqlstate 'P0001' then null; end;
  begin update public.profiles set subscription_tier = 'premium' where id = v_ikke;
    r := r || E'\n[FEJL] subscription_tier kunne ændres'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] subscription_tier afvist: ' || sqlerrm; when sqlstate 'P0001' then null; end;
  begin update public.profiles set is_admin = true, display_name = display_name where id = v_ikke;
    r := r || E'\n[FEJL] blandet opdatering lykkedes'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] blandet opdatering afvist'; when sqlstate 'P0001' then null; end;
  begin insert into public.profiles (id, is_admin) values (gen_random_uuid(), true);
    r := r || E'\n[FEJL] INSERT med is_admin=true lykkedes'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[' || case when sqlerrm like 'permission denied%' then 'OK' else 'FEJL: kun RLS, ikke rettighed' end || '] INSERT afvist: ' || sqlerrm; when sqlstate 'P0001' then null; end;
  begin delete from public.profiles where id = v_ikke;
    r := r || E'\n[FEJL] DELETE blev ikke afvist med rettighedsfejl'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] DELETE afvist: ' || sqlerrm; when sqlstate 'P0001' then null; end;

  -- C. Legitime handlinger som almindelig bruger og som admin (skal virke)
  r := r || E'\n--- legitime handlinger';
  begin update public.profiles set updated_at = updated_at, display_name = display_name, location_name = location_name, onboarded = onboarded where id = v_ikke;
    get diagnostics n = row_count;
    r := r || E'\n[' || case when n = 1 then 'OK' else 'FEJL' end || '] almindelig bruger kan opdatere tilladte felter (rækker=' || n || ')';
    raise exception using errcode='P0001', message='rollback';
  exception when sqlstate 'P0001' then null; when others then r := r || E'\n[FEJL] legitim opdatering afvist: ' || sqlerrm; end;
  select is_admin into b from public.profiles where id = v_ikke;
  r := r || E'\n[' || case when b = false then 'OK' else 'FEJL' end || '] almindelig bruger ser sin egen række, is_admin=' || coalesce(b::text,'(ingen)');
  select count(*) into n from public.profiles;
  r := r || E'\n[' || case when n = 1 then 'OK' else 'FEJL' end || '] RLS: almindelig bruger ser kun egen række (rækker=' || n || ')';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select is_admin into b from public.profiles where id = v_admin;
  r := r || E'\n[' || case when b = true then 'OK' else 'FEJL' end || '] admin læser is_admin=' || coalesce(b::text,'(ingen)') || ' (requireAdmin)';
  begin update public.profiles set display_name = display_name where id = v_admin;
    get diagnostics n = row_count;
    r := r || E'\n[' || case when n = 1 then 'OK' else 'FEJL' end || '] admin kan opdatere tilladte felter (rækker=' || n || ')';
    raise exception using errcode='P0001', message='rollback';
  exception when sqlstate 'P0001' then null; when others then r := r || E'\n[FEJL] admin-opdatering afvist: ' || sqlerrm; end;
  begin update public.profiles set is_admin = false where id = v_admin;
    r := r || E'\n[FEJL] admin kunne fjerne egen is_admin via klienten'; raise exception using errcode='P0001', message='rollback';
  exception when insufficient_privilege then r := r || E'\n[OK] selv admin kan ikke ændre is_admin via klienten'; when sqlstate 'P0001' then null; end;
  reset role;

  -- D. Kontosletnings-funktionen virker som service_role (slet et id, der ikke findes: ingen data berøres)
  if to_regprocedure('public.delete_account(uuid)') is not null then
    r := r || E'\n--- kontosletning';
    set local role service_role;
    begin
      select array_length(public.delete_account('00000000-0000-4000-8000-000000000999'::uuid), 1) into n;
      r := r || E'\n[' || case when n is null then 'OK' else 'FEJL' end || '] delete_account(ukendt id) som service_role: ingen blokerede tabeller';
    exception when others then r := r || E'\n[FEJL] delete_account som service_role: ' || sqlerrm; end;
    reset role;
  end if;

  raise exception 'CHECK-RESULTAT:%', r;   -- altid: ruller ALT tilbage
end $$;
