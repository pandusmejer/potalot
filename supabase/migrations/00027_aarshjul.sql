-- Årshjul: globale gøremål (admin-styret), brugerens egne, og brugerens skjulte globale.

-- 1) Global tabel — admin opretter/redigerer, alle brugere ser
create table if not exists public.general_garden_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  month integer not null check (month between 1 and 12),
  season text,
  category text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  time_window text,
  tip text,
  risk text,
  linked_guide_ids text[] default '{}',
  recurrence text not null default 'yearly',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_general_garden_tasks_month on public.general_garden_tasks(month) where is_active = true;

alter table public.general_garden_tasks enable row level security;

-- Alle (også anonyme) kan læse aktive globale gøremål
drop policy if exists "general_garden_tasks read active" on public.general_garden_tasks;
create policy "general_garden_tasks read active"
  on public.general_garden_tasks
  for select
  using (is_active = true);

-- Kun admin kan skrive
drop policy if exists "general_garden_tasks admin write" on public.general_garden_tasks;
create policy "general_garden_tasks admin write"
  on public.general_garden_tasks
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 2) Brugerens egne gøremål — kun synlige for brugeren selv
create table if not exists public.user_garden_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  month integer not null check (month between 1 and 12),
  category text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  time_window text,
  notify_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_garden_tasks_user_month on public.user_garden_tasks(user_id, month);

alter table public.user_garden_tasks enable row level security;

drop policy if exists "user_garden_tasks owner all" on public.user_garden_tasks;
create policy "user_garden_tasks owner all"
  on public.user_garden_tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Skjulte globale gøremål — brugeren markerer en global som "ikke relevant"
create table if not exists public.user_hidden_general_tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  general_task_id uuid not null references public.general_garden_tasks(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (user_id, general_task_id)
);

alter table public.user_hidden_general_tasks enable row level security;

drop policy if exists "user_hidden_general_tasks owner all" on public.user_hidden_general_tasks;
create policy "user_hidden_general_tasks owner all"
  on public.user_hidden_general_tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) Seed med kuraterede gøremål fra src/lib/curated-data.ts
insert into public.general_garden_tasks (title, description, month, category, priority, recurrence, is_active)
values
  ('Forspir chili, aubergine og tomat', 'Chili og aubergine har lang udviklingstid — start allerede nu.', 2, 'forspiring', 'medium', 'yearly', true),
  ('Klargør jord og drivhus', 'Varm jorden op og luft ud. Tjek for huller i drivhus-plast.', 3, 'klargoering', 'medium', 'yearly', true),
  ('Prikl ud, så direkte, begynd hærdning', 'April er månedens store rutsjebane — alt sker samtidig.', 4, 'saaning', 'high', 'yearly', true),
  ('Udplant frostfølsomme planter', 'Efter isdamerne (midt-slut maj) kan tomater, agurker og chili ud.', 5, 'udplantning', 'high', 'yearly', true),
  ('Vand, gød og bind planter op', 'Juni er væksttid — regelmæssig pleje er alt.', 6, 'vedligehold', 'medium', 'yearly', true),
  ('Høst og vedligehold', 'Juli-august er høsttid. Pluk ofte for at holde planterne i produktion.', 7, 'hoest', 'medium', 'yearly', true),
  ('Saml frø til næste år', 'August er perfekt tid til at gemme frø fra dine bedste planter.', 8, 'froesamling', 'low', 'yearly', true),
  ('Plant forårsløg og del stauder', 'September er den bedste måned til løg — og staudedeling.', 9, 'plantning', 'medium', 'yearly', true),
  ('Plant træer og buske', 'Oktober er træ-plantnings-måneden. Jorden er varm og fugtig.', 10, 'plantning', 'low', 'yearly', true),
  ('Vinterklargøring', 'Tøm krukker, dæk følsomme planter, rens værktøj.', 11, 'vinterklargoering', 'medium', 'yearly', true),
  ('Planlæg næste sæson', 'December er planlægningsmåned. Gennemgå frøbank, bestil nyt.', 12, 'planlaegning', 'low', 'yearly', true),
  ('Planlæg sæson, gennemgå frø', 'Januar er rolig — perfekt til at drømme og bestille.', 1, 'planlaegning', 'low', 'yearly', true)
on conflict do nothing;
