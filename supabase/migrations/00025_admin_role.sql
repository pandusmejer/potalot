-- Admin-rolle på profiles. Annas mail bliver default-admin når kontoen
-- oprettes — øvrige admins kan toggles via direkte DB-update senere.

alter table profiles
  add column if not exists is_admin boolean not null default false;

-- Sæt admin på kendt mail hvis kontoen allerede findes
update profiles p
set is_admin = true
where p.id in (
  select id from auth.users where lower(email) = 'annamejer@hotmail.com'
)
and p.is_admin = false;

-- Trigger der sikrer at fremtidige inserts for samme mail får is_admin=true
create or replace function set_admin_on_profile_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  user_email text;
begin
  select email into user_email from auth.users where id = new.id;
  if lower(user_email) = 'annamejer@hotmail.com' then
    new.is_admin := true;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_set_admin_on_profile_insert on profiles;
create trigger tr_set_admin_on_profile_insert
  before insert on profiles
  for each row
  execute function set_admin_on_profile_insert();
