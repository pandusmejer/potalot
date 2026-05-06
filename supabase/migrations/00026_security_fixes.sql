-- Adresserer Supabase Security Advisor-fejl:
--   1. Drop ubrugte tabeller change_requests og admin_conversations
--      (oprettet i 00002, aldrig brugt i koden — manglede RLS)
--   2. Genskab inventory_seed_counts-view med security_invoker så den
--      respekterer kalderens RLS i stedet for view-ejerens

drop table if exists public.change_requests cascade;
drop table if exists public.admin_conversations cascade;

-- security_invoker=true → view kører med kalderens privilegier, så RLS
-- på inventory_items og sowing_events håndhæves korrekt
drop view if exists public.inventory_seed_counts;
create view public.inventory_seed_counts
  with (security_invoker = true)
  as
select
  i.id as inventory_item_id,
  i.user_id,
  coalesce(i.seed_count, 0) as seed_count,
  coalesce(sum(s.sown_count), 0)::integer as seeds_sown,
  greatest(coalesce(i.seed_count, 0) - coalesce(sum(s.sown_count), 0), 0)::integer as seeds_remaining
from public.inventory_items i
left join public.sowing_events s on s.inventory_item_id = i.id
group by i.id, i.user_id, i.seed_count;

grant select on public.inventory_seed_counts to authenticated;
