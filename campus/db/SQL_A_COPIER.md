# SQL à copier-coller dans Supabase

Supabase → **SQL Editor** → **New query** → coller le bloc → **Run**.
Résultat attendu : « Success. No rows returned ».
Chaque bloc ne s'exécute **qu'une seule fois**, dans l'ordre : 001, 002, 003, 004, 005, puis 006, chacun dans une nouvelle requête.

## 001 · Base du campus

```sql
-- Campus Pathway · 001 · schéma, règles d'accès (RLS), fonctions et contenu de départ
-- À exécuter une seule fois dans Supabase → SQL Editor → New query → Run.
-- Le projet a « Automatically expose new tables » désactivé : chaque droit est accordé ici, table par table.

begin;

-- ─────────────────────────────────────────────────────────────
-- Profils
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  full_name text not null default '',
  teacher_id uuid references public.profiles (id) on delete set null,
  level text not null default 'A2' check (level in ('A1', 'A2', 'B1', 'B2')),
  motive text check (motive in ('rp', 'estudios', 'trabajo', 'otro')),
  exam text check (exam in ('tef', 'tcf', 'ambos', 'nose')),
  target_month text check (target_month = 'nose' or target_month ~ '^\d{4}-\d{2}$'),
  daily_goal int not null default 50 check (daily_goal in (30, 50, 80)),
  reminder text not null default 'noche' check (reminder in ('manana', 'mediodia', 'noche', 'no')),
  reminder_channel text not null default 'whatsapp' check (reminder_channel in ('whatsapp', 'correo')),
  timezone text not null default 'America/Lima',
  onboarded_at timestamptz,
  next_class_at timestamptz,
  class_link text,
  xp_total int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  last_goal_day date,
  freezes int not null default 1,
  created_at timestamptz not null default now()
);

-- Fonctions d'aide (security definer : elles lisent les profils sans repasser par les règles, ce qui évite les boucles).
create function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('teacher', 'admin') from profiles where id = auth.uid()), false)
$$;

create function public.teaches(student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles me
    where me.id = auth.uid()
      and (me.role = 'admin' or (me.role = 'teacher' and exists (select 1 from profiles s where s.id = student and s.teacher_id = me.id)))
  )
$$;

alter table public.profiles enable row level security;
create policy "profiles: lire le sien ou ceux de ses élèves" on public.profiles
  for select to authenticated using (id = auth.uid() or public.teaches(id));
create policy "profiles: modifier le sien" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select on public.profiles to authenticated;
-- L'élève ne peut modifier que ses préférences ; XP, série, rôle et professeur passent par les fonctions ci-dessous ou par l'admin.
grant update (full_name, level, motive, exam, target_month, daily_goal, reminder, reminder_channel, timezone, onboarded_at)
  on public.profiles to authenticated;

-- Création automatique du profil quand Pathway invite un élève.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
insert into public.profiles (id, full_name)
  select id, split_part(email, '@', 1) from auth.users on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Contenu : unités et exercices
-- ─────────────────────────────────────────────────────────────
create table public.units (
  id text primary key,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  segment text not null check (segment in ('A', 'B', 'C', 'D')),
  number int not null,
  title text not null,
  manual_time text,
  cards jsonb not null default '[]',
  unique (level, number)
);
alter table public.units enable row level security;
create policy "units: lecture" on public.units for select to authenticated using (true);
grant select on public.units to authenticated;

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null references public.units (id) on delete cascade,
  position int not null,
  type text not null check (type in ('choice', 'type', 'listen', 'order', 'match', 'dictation', 'spot')),
  kind text not null,
  payload jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'validated')),
  updated_at timestamptz not null default now(),
  unique (unit_id, position)
);
alter table public.exercises enable row level security;
create policy "exercises: validés pour tous, brouillons pour l'équipe" on public.exercises
  for select to authenticated using (status = 'validated' or public.is_staff());
grant select on public.exercises to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Progression
-- ─────────────────────────────────────────────────────────────
create table public.lesson_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  unit_id text not null references public.units (id) on delete cascade,
  total int not null,
  first_try_correct int not null,
  xp int not null,
  duration_s int,
  finished_at timestamptz not null default now()
);
create index on public.lesson_runs (user_id, unit_id);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  run_id uuid references public.lesson_runs (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  first_try boolean not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index on public.attempts (user_id, created_at);

create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null check (amount between 0 and 500),
  reason text not null,
  created_at timestamptz not null default now()
);
create index on public.xp_events (user_id, created_at);

create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  color text not null,
  position int not null
);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.review_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_key text,
  front text not null,
  back text not null,
  note text,
  source text not null check (source in ('unit', 'lesson', 'class')),
  source_label text,
  due_at timestamptz not null default now(),
  interval_days numeric not null default 0,
  ease numeric not null default 2.5,
  reps int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, card_key)
);
create index on public.review_cards (user_id, due_at);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  unit_id text not null references public.units (id) on delete cascade,
  due_on date,
  note text,
  created_at timestamptz not null default now()
);

create table public.assignment_students (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz,
  primary key (assignment_id, student_id)
);

create function public.is_assigned(a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignment_students where assignment_id = a and student_id = auth.uid())
$$;

-- Lecture seule pour tous ces tableaux : les écritures passent par les fonctions plus bas.
do $$
declare t text;
begin
  foreach t in array array['lesson_runs', 'attempts', 'xp_events', 'user_badges', 'review_cards'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: le sien ou ses élèves" on public.%I for select to authenticated using (user_id = auth.uid() or public.teaches(user_id))', t, t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

alter table public.badges enable row level security;
create policy "badges: lecture" on public.badges for select to authenticated using (true);
grant select on public.badges to authenticated;

alter table public.assignments enable row level security;
create policy "assignments: les siens ou ceux qu'on reçoit" on public.assignments
  for select to authenticated using (teacher_id = auth.uid() or public.my_role() = 'admin' or public.is_assigned(id));
grant select on public.assignments to authenticated;

alter table public.assignment_students enable row level security;
create policy "assignment_students: les siens ou ses élèves" on public.assignment_students
  for select to authenticated using (student_id = auth.uid() or public.teaches(student_id));
grant select on public.assignment_students to authenticated;

-- ─────────────────────────────────────────────────────────────
-- XP et série
-- ─────────────────────────────────────────────────────────────
-- Une série reste vivante si l'objectif a été atteint hier, ou avant-hier avec un protecteur disponible.
create function public._award_xp(p_user uuid, p_amount int, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p profiles;
  today date;
  today_xp int;
  shown_before int;
  reached boolean := false;
begin
  select * into p from profiles where id = p_user for update;
  today := (now() at time zone p.timezone)::date;
  shown_before := case
    when p.last_goal_day >= today - 1 then p.streak
    when p.last_goal_day = today - 2 and p.freezes > 0 then p.streak
    else 0 end;
  insert into xp_events (user_id, amount, reason) values (p_user, p_amount, p_reason);
  select coalesce(sum(amount), 0) into today_xp from xp_events
    where user_id = p_user and (created_at at time zone p.timezone)::date = today;
  if today_xp >= p.daily_goal and (p.last_goal_day is null or p.last_goal_day < today) then
    reached := true;
    if p.last_goal_day = today - 1 then
      p.streak := p.streak + 1;
    elsif p.last_goal_day = today - 2 and p.freezes > 0 then
      p.streak := p.streak + 1;
      p.freezes := p.freezes - 1;
    else
      p.streak := 1;
    end if;
    if p.streak % 7 = 0 then p.freezes := least(p.freezes + 1, 2); end if;
    p.best_streak := greatest(p.best_streak, p.streak);
    p.last_goal_day := today;
  end if;
  update profiles set xp_total = xp_total + p_amount, streak = p.streak, best_streak = p.best_streak,
    last_goal_day = p.last_goal_day, freezes = p.freezes
  where id = p_user;
  return jsonb_build_object('today_xp', today_xp, 'streak_before', shown_before,
    'streak', case when reached then p.streak else shown_before end, 'goal_reached', reached,
    'xp_total', p.xp_total + p_amount);
end $$;

create function public._grant_badge(p_user uuid, p_badge text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into user_badges (user_id, badge_id) values (p_user, p_badge);
  return true;
exception when unique_violation then
  return false;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Fonctions appelées par l'application
-- ─────────────────────────────────────────────────────────────

-- Fin de leçon. p_results : [{exercise_id, first_try, correct}], p_errors : [{exercise_id, front, back, note}].
create function public.finish_lesson(p_unit text, p_results jsonb, p_errors jsonb, p_duration int)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  n_total int;
  n_first int;
  gained int;
  run uuid;
  xp jsonb;
  new_badges text[] := '{}';
  new_cards int := 0;
  hw int := 0;
  p profiles;
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from units where id = p_unit) then raise exception 'unknown unit'; end if;

  select count(*), count(*) filter (where (r ->> 'first_try')::boolean),
         sum(case when (r ->> 'first_try')::boolean then 10 when (r ->> 'correct')::boolean then 5 else 0 end)
    into n_total, n_first, gained
  from jsonb_array_elements(p_results) r
  join exercises e on e.id = (r ->> 'exercise_id')::uuid and e.unit_id = p_unit;
  if n_total = 0 then raise exception 'no results'; end if;

  insert into lesson_runs (user_id, unit_id, total, first_try_correct, xp, duration_s)
    values (me, p_unit, n_total, n_first, gained, p_duration) returning id into run;
  insert into attempts (user_id, run_id, exercise_id, first_try, correct)
    select me, run, (r ->> 'exercise_id')::uuid, (r ->> 'first_try')::boolean, (r ->> 'correct')::boolean
    from jsonb_array_elements(p_results) r
    join exercises e on e.id = (r ->> 'exercise_id')::uuid and e.unit_id = p_unit;

  xp := public._award_xp(me, gained, 'lesson:' || p_unit);

  -- Cartes : vocabulaire de l'unité, puis erreurs de la leçon.
  with ins as (
    insert into review_cards (user_id, card_key, front, back, note, source, source_label)
    select me, 'unit:' || p_unit || ':' || (c.ord - 1), c.v ->> 'front', c.v ->> 'back', c.v ->> 'note', 'unit', 'Unidad ' || u.number
    from units u, jsonb_array_elements(u.cards) with ordinality as c (v, ord)
    where u.id = p_unit
    on conflict (user_id, card_key) do nothing
    returning 1
  ) select count(*) into new_cards from ins;
  with ins as (
    insert into review_cards (user_id, card_key, front, back, note, source, source_label)
    select me, 'ex:' || (x ->> 'exercise_id'), left(x ->> 'front', 300), left(x ->> 'back', 300), left(x ->> 'note', 500), 'lesson', 'Error de la unidad ' || u.number
    from jsonb_array_elements(p_errors) x
    join exercises e on e.id = (x ->> 'exercise_id')::uuid and e.unit_id = p_unit
    join units u on u.id = p_unit
    on conflict (user_id, card_key) do update set due_at = now(), interval_days = 0, reps = 0
    returning 1
  ) select new_cards + count(*) into new_cards from ins;

  -- Devoirs liés à cette unité.
  with upd as (
    update assignment_students s set completed_at = now()
    from assignments a
    where a.id = s.assignment_id and a.unit_id = p_unit and s.student_id = me and s.completed_at is null
    returning 1
  ) select count(*) into hw from upd;

  -- Badges.
  select * into p from profiles where id = me;
  if public._grant_badge(me, 'primeros') then new_badges := array_append(new_badges, 'primeros'); end if;
  if n_first = n_total and public._grant_badge(me, 'perfecta') then new_badges := array_append(new_badges, 'perfecta'); end if;
  if p.streak >= 7 and public._grant_badge(me, 'racha7') then new_badges := array_append(new_badges, 'racha7'); end if;
  if p.streak >= 30 and public._grant_badge(me, 'racha30') then new_badges := array_append(new_badges, 'racha30'); end if;

  return xp || jsonb_build_object('xp', gained, 'first_try', n_first, 'total', n_total,
    'badges', to_jsonb(new_badges), 'cards', new_cards, 'homework_done', hw);
end $$;

-- Révision espacée : 0 = otra vez, 1 = difícil, 2 = bien, 3 = fácil.
create function public.review_card(p_card uuid, p_grade int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c review_cards;
  next_interval numeric;
  next_ease numeric;
  xp jsonb := '{}';
begin
  select * into c from review_cards where id = p_card and user_id = auth.uid() for update;
  if not found then raise exception 'card not found'; end if;
  next_ease := c.ease;
  if p_grade = 0 then
    next_interval := 0.0007;           -- ~1 min
    next_ease := greatest(1.3, c.ease - 0.2);
  elsif p_grade = 1 then
    next_interval := case when c.reps = 0 then 0.0042 else greatest(1, c.interval_days * 1.2) end;
    next_ease := greatest(1.3, c.ease - 0.15);
  elsif p_grade = 2 then
    next_interval := case when c.reps = 0 then 1 when c.reps = 1 then 3 else c.interval_days * c.ease end;
  elsif p_grade = 3 then
    next_interval := case when c.reps = 0 then 4 else c.interval_days * c.ease * 1.3 end;
    next_ease := c.ease + 0.15;
  else
    raise exception 'bad grade';
  end if;
  update review_cards set
    interval_days = next_interval, ease = next_ease,
    reps = case when p_grade = 0 then 0 else c.reps + 1 end,
    due_at = now() + make_interval(secs => (next_interval * 86400)::int)
  where id = c.id;
  if p_grade > 0 then xp := public._award_xp(auth.uid(), 2, 'review'); end if;
  return xp || jsonb_build_object('interval_days', next_interval);
end $$;

-- Professeur : ajouter une erreur entendue en cours au paquet de révision d'un élève.
create function public.add_class_error(p_student uuid, p_wrong text, p_right text, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid; who text;
begin
  if not public.teaches(p_student) then raise exception 'not your student'; end if;
  select full_name into who from profiles where profiles.id = auth.uid();
  insert into review_cards (user_id, front, back, note, source, source_label, created_by)
    values (p_student, left(p_wrong, 300), left(p_right, 300), nullif(left(p_note, 500), ''), 'class', 'Error de clase · ' || who, auth.uid())
    returning review_cards.id into new_id;
  return new_id;
end $$;

-- Professeur : donner une unité à travailler.
create function public.create_assignment(p_unit text, p_due date, p_note text, p_students uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare a uuid; s uuid;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  foreach s in array p_students loop
    if not public.teaches(s) then raise exception 'not your student'; end if;
  end loop;
  insert into assignments (teacher_id, unit_id, due_on, note) values (auth.uid(), p_unit, p_due, nullif(p_note, '')) returning id into a;
  insert into assignment_students (assignment_id, student_id) select a, unnest(p_students);
  return a;
end $$;

-- Professeur : prochain cours d'un élève.
create function public.set_next_class(p_student uuid, p_at timestamptz, p_link text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teaches(p_student) then raise exception 'not your student'; end if;
  update profiles set next_class_at = p_at, class_link = nullif(p_link, '') where id = p_student;
end $$;

-- Équipe : publier ou repasser en brouillon tous les exercices d'une unité.
create function public.set_unit_status(p_unit text, p_status text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  update exercises set status = p_status, updated_at = now() where unit_id = p_unit;
  get diagnostics n = row_count;
  return n;
end $$;

-- Élève : nom de son professeur.
create function public.my_teacher() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', t.id, 'full_name', t.full_name)
  from profiles me join profiles t on t.id = me.teacher_id where me.id = auth.uid()
$$;

-- Professeur : vue d'ensemble de ses élèves.
create function public.teacher_overview() returns table (
  id uuid, full_name text, level text, exam text, target_month text, onboarded boolean,
  streak int, last_activity timestamptz, week_xp int, homework_open int, homework_done int,
  week_accuracy int, next_class_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select s.id, s.full_name, s.level, s.exam, s.target_month, s.onboarded_at is not null,
    case
      when s.last_goal_day >= (now() at time zone s.timezone)::date - 1 then s.streak
      when s.last_goal_day = (now() at time zone s.timezone)::date - 2 and s.freezes > 0 then s.streak
      else 0 end,
    (select max(created_at) from xp_events x where x.user_id = s.id),
    (select coalesce(sum(amount), 0)::int from xp_events x where x.user_id = s.id and x.created_at > now() - interval '7 days'),
    (select count(*)::int from assignment_students a where a.student_id = s.id and a.completed_at is null),
    (select count(*)::int from assignment_students a where a.student_id = s.id and a.completed_at is not null),
    (select (100 * avg(case when t.first_try then 1 else 0 end))::int from attempts t where t.user_id = s.id and t.created_at > now() - interval '7 days'),
    s.next_class_at
  from profiles s
  where s.role = 'student' and public.teaches(s.id)
  order by s.full_name
$$;

-- Professeur : erreurs les plus fréquentes de ses élèves sur 30 jours.
create function public.teacher_common_errors() returns table (exercise_id uuid, unit_id text, type text, payload jsonb, students int, misses int)
language sql stable security definer set search_path = public as $$
  select e.id, e.unit_id, e.type, e.payload, count(distinct t.user_id)::int, count(*)::int
  from attempts t join exercises e on e.id = t.exercise_id
  where not t.first_try and t.created_at > now() - interval '30 days' and public.teaches(t.user_id)
  group by e.id
  order by 5 desc, 6 desc
  limit 6
$$;

-- Droits : rien pour les visiteurs non connectés ; les fonctions internes (préfixe _) ne sont jamais appelables depuis l'application.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.my_role(), public.is_staff(), public.teaches(uuid), public.is_assigned(uuid),
  public.finish_lesson(text, jsonb, jsonb, int), public.review_card(uuid, int), public.add_class_error(uuid, text, text, text),
  public.create_assignment(text, date, text, uuid[]), public.set_next_class(uuid, timestamptz, text),
  public.set_unit_status(text, text), public.my_teacher(), public.teacher_overview(), public.teacher_common_errors()
  to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Contenu de départ
-- ─────────────────────────────────────────────────────────────
insert into public.badges (id, name, description, icon, color, position) values
  ('primeros', 'Primeros pasos', 'Tu primera lección en el campus', 'star', 'butter', 1),
  ('racha7', 'Semana completa', '7 días seguidos', 'flame', 'peach', 2),
  ('perfecta', 'Sin faltas', 'Una lección sin ningún error', 'check', 'mint', 3),
  ('oido', 'Oído fino', 'Reto de comprensión oral', 'speaker', 'sky', 4),
  ('simulacro', 'Primer simulacro', 'Un simulacro completo', 'timer', 'lilac', 5),
  ('segA', 'Segmento A', 'Examen A aprobado', 'route', 'mint', 6),
  ('racha30', 'Un mes seguido', '30 días seguidos', 'flame', 'peach', 7),
  ('nclc7', 'NCLC 7', 'Estimado en las cuatro competencias', 'target', 'butter', 8);

insert into public.units (id, level, segment, number, title, manual_time, cards) values
  ('a2-01', 'A2', 'A', 1, 'Le présent des verbes en -er', '1 h – 1 h 30', $j$[
    {"front": "travailler", "back": "trabajar", "note": "Je travaille dans un bureau."},
    {"front": "le matin", "back": "por la mañana", "note": "Le matin, je travaille."},
    {"front": "à midi", "back": "a mediodía", "note": "À midi, je mange avec mes collègues."},
    {"front": "le soir", "back": "por la noche", "note": "Le soir, je regarde un film."},
    {"front": "les collègues", "back": "los colegas", "note": "Je mange avec mes collègues."},
    {"front": "nous + manger", "back": "nous mangeons", "note": "Con -ger se conserva la e delante de -ons."}
  ]$j$);

insert into public.exercises (unit_id, position, type, kind, payload) values
  ('a2-01', 1, 'choice', 'Conjugación', $j${"title": "Completa la frase", "fr": "Nous ___ français au travail.", "es": "Hablamos francés en el trabajo.", "options": ["parlons", "parlez", "parlent", "parle"], "answer": 0, "two": true, "explain": "Con <b>nous</b>, los verbos en -er terminan en <b>-ons</b>: nous parl<b>ons</b>."}$j$),
  ('a2-01', 2, 'type', 'Conjugación', $j${"title": "Escribe el verbo conjugado", "before": "Tu", "after": "dans un bureau.", "hint": "travailler", "answers": ["travailles"], "explain": "Con <b>tu</b>, la terminación es <b>-es</b>. La s no se pronuncia: «tu travailles» suena igual que «je travaille»."}$j$),
  ('a2-01', 3, 'listen', 'Comprensión oral', $j${"title": "Escucha a Camille", "audio": "Bonjour ! Je m'appelle Camille. Le matin, je travaille dans un bureau. À midi, je mange avec mes collègues. Le soir, je regarde un film et j'écoute de la musique.", "question": "¿Qué hace Camille a mediodía?", "options": ["Come con sus colegas", "Trabaja en una oficina", "Mira una película", "Escucha la radio"], "answer": 0, "two": true, "explain": "« À midi, je <b>mange</b> avec mes collègues. »"}$j$),
  ('a2-01', 4, 'order', 'Construcción', $j${"title": "Ordena la frase", "es": "Por la noche, veo una película.", "tiles": ["film.", "je", "regardes", "Le soir,", "un", "regarde"], "answer": ["Le soir,", "je", "regarde", "un", "film."], "explain": "Con <b>je</b> se escribe regard<b>e</b>. «regardes» es la forma de <b>tu</b>."}$j$),
  ('a2-01', 5, 'match', 'Conjugación', $j${"title": "Une cada pronombre con su forma de «aimer»", "pairs": [["j’", "aime"], ["tu", "aimes"], ["nous", "aimons"], ["vous", "aimez"], ["ils", "aiment"]], "explain": "Terminaciones del presente en -er: -e, -es, -e, -ons, -ez, -ent."}$j$),
  ('a2-01', 6, 'dictation', 'Dictado', $j${"title": "Escribe lo que oyes", "audio": "J'écoute de la musique.", "answers": ["j'écoute de la musique"], "es": "Escucho música.", "explain": "<b>je</b> + vocal → <b>j’</b>: j’écoute. La é lleva acento agudo."}$j$),
  ('a2-01', 7, 'spot', 'Detecta el error', $j${"title": "Toca la palabra incorrecta", "words": ["Ils", "mangez", "avec", "leurs", "collègues."], "wrong": 1, "fix": "mangent", "explain": "Con <b>ils / elles</b>, la terminación es <b>-ent</b>, que no se pronuncia: ils mang<b>ent</b>."}$j$),
  ('a2-01', 8, 'choice', 'Ortografía', $j${"title": "¿Qué frase es correcta?", "options": ["J'habite à Montréal.", "Je habite à Montréal.", "J'habites à Montréal.", "Je habiter à Montréal."], "answer": 0, "explain": "Delante de vocal o h muda, <b>je</b> se convierte en <b>j’</b>: j’habite, j’écoute, j’aime."}$j$);

commit;
```

## 002 · Défi de la semaine

À lancer seulement après le 001, dans une nouvelle requête.

```sql
-- Campus Pathway · 002 · défi de la semaine et objectif de groupe
-- À exécuter après 001_init.sql (SQL Editor → New query → Run).
-- Défi : pratiquer 5 jours différents dans la semaine (lundi → dimanche, fuseau de l'élève), +50 XP une fois par semaine.
-- Objectif de groupe : XP cumulés cette semaine par les élèves du même professeur.

begin;

create table public.weekly_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.weekly_claims enable row level security;
create policy "weekly_claims: le sien ou ses élèves" on public.weekly_claims
  for select to authenticated using (user_id = auth.uid() or public.teaches(user_id));
grant select on public.weekly_claims to authenticated;

create function public.weekly_challenge() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  p profiles;
  today date;
  wk date;
  days int;
  group_xp int;
  group_size int;
begin
  select * into p from profiles where id = auth.uid();
  if not found then raise exception 'not signed in'; end if;
  today := (now() at time zone p.timezone)::date;
  wk := date_trunc('week', today)::date;
  select count(distinct (created_at at time zone p.timezone)::date) into days
    from xp_events where user_id = p.id and (created_at at time zone p.timezone)::date >= wk;
  if p.teacher_id is null then
    group_xp := (select coalesce(sum(amount), 0) from xp_events where user_id = p.id and (created_at at time zone p.timezone)::date >= wk);
    group_size := 1;
  else
    select coalesce(sum(x.amount), 0), count(distinct s.id) into group_xp, group_size
      from profiles s left join xp_events x on x.user_id = s.id and (x.created_at at time zone p.timezone)::date >= wk
      where s.teacher_id = p.teacher_id and s.role = 'student';
  end if;
  return jsonb_build_object(
    'week_start', wk, 'days', days, 'goal_days', 5, 'bonus', 50,
    'claimed', exists (select 1 from weekly_claims where user_id = p.id and week_start = wk),
    'group_xp', group_xp, 'group_goal', greatest(500, round(group_size * 250 / 100.0) * 100)::int, 'group_size', group_size);
end $$;

create function public.claim_weekly_challenge() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c jsonb := public.weekly_challenge();
  xp jsonb;
begin
  if (c ->> 'claimed')::boolean then return c || jsonb_build_object('awarded', false); end if;
  if (c ->> 'days')::int < (c ->> 'goal_days')::int then return c || jsonb_build_object('awarded', false); end if;
  insert into weekly_claims (user_id, week_start) values (auth.uid(), (c ->> 'week_start')::date);
  xp := public._award_xp(auth.uid(), (c ->> 'bonus')::int, 'weekly_challenge');
  return c || xp || jsonb_build_object('claimed', true, 'awarded', true);
end $$;

revoke execute on function public.weekly_challenge(), public.claim_weekly_challenge() from public, anon;
grant execute on function public.weekly_challenge(), public.claim_weekly_challenge() to authenticated;

commit;
```

## 003 · Invitations depuis le Campus

À lancer après le 002, dans une nouvelle requête. Ajoute le formulaire « Invitar a un alumno » : le nom, le niveau et le professeur sont appliqués automatiquement quand l'élève crée son compte.

```sql
-- Campus Pathway · 003 · invitations préparées depuis le Campus
-- À exécuter après 001 et 002 (SQL Editor → New query → Run).
-- Un professeur ou l'admin prépare l'invitation (e-mail, nom, niveau, professeur). Quand la personne
-- crée son compte via l'e-mail d'invitation, son profil est configuré automatiquement.

begin;

create table public.invitations (
  email text primary key check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name text not null check (length(full_name) between 1 and 120),
  level text not null default 'A2' check (level in ('A1', 'A2', 'B1', 'B2')),
  role text not null default 'student' check (role in ('student', 'teacher')),
  teacher_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
alter table public.invitations enable row level security;
create policy "invitations: les siennes, ou toutes pour l'admin" on public.invitations
  for select to authenticated using (public.my_role() = 'admin' or teacher_id = auth.uid() or created_by = auth.uid());
grant select on public.invitations to authenticated;

-- Applique une invitation à un profil existant.
create function public._apply_invitation(p_user uuid, p_email text) returns boolean
language plpgsql security definer set search_path = public as $$
declare inv invitations;
begin
  select * into inv from invitations where email = lower(p_email);
  if not found then return false; end if;
  update profiles set
    full_name = inv.full_name,
    level = inv.level,
    role = case when inv.role = 'teacher' then 'teacher' else role end,
    teacher_id = case when inv.role = 'student' then inv.teacher_id else teacher_id end
  where id = p_user and role <> 'admin';
  update invitations set accepted_at = coalesce(accepted_at, now()) where email = inv.email;
  return true;
end $$;

-- La création du profil applique l'invitation préparée, s'il y en a une.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  perform public._apply_invitation(new.id, new.email);
  return new;
end $$;

-- Préparer (ou mettre à jour) une invitation. Un professeur invite pour lui-même ; l'admin choisit le professeur
-- et peut aussi inviter un professeur (p_role = 'teacher'). Si le compte existe déjà, il est configuré tout de suite.
create function public.create_invitation(p_email text, p_full_name text, p_level text, p_teacher uuid, p_role text default 'student')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me profiles;
  v_email text := lower(trim(p_email));
  v_teacher uuid;
  existing uuid;
begin
  select * into me from profiles where id = auth.uid();
  if me.role is null or me.role not in ('teacher', 'admin') then raise exception 'staff only'; end if;
  if p_role not in ('student', 'teacher') then raise exception 'bad role'; end if;
  if p_role = 'teacher' and me.role <> 'admin' then raise exception 'admin only'; end if;
  if p_role = 'student' then
    v_teacher := case when me.role = 'admin' then coalesce(p_teacher, me.id) else me.id end;
    if not exists (select 1 from profiles where id = v_teacher and role in ('teacher', 'admin')) then raise exception 'unknown teacher'; end if;
  end if;
  insert into invitations (email, full_name, level, role, teacher_id, created_by)
    values (v_email, trim(p_full_name), coalesce(p_level, 'A2'), p_role, v_teacher, me.id)
  on conflict (email) do update set full_name = excluded.full_name, level = excluded.level, role = excluded.role,
    teacher_id = excluded.teacher_id, created_by = excluded.created_by, created_at = now();
  select id into existing from auth.users where lower(email) = v_email;
  if existing is not null then perform public._apply_invitation(existing, v_email); end if;
  return jsonb_build_object('email', v_email, 'existing_account', existing is not null);
end $$;

-- Annuler une invitation pas encore acceptée.
create function public.cancel_invitation(p_email text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from invitations
  where email = lower(trim(p_email)) and accepted_at is null
    and (public.my_role() = 'admin' or teacher_id = auth.uid() or created_by = auth.uid());
end $$;

-- Liste des professeurs, pour le formulaire d'invitation.
create function public.list_teachers() returns table (id uuid, full_name text, role text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.role from profiles p
  where p.role in ('teacher', 'admin') and public.is_staff()
  order by p.role desc, p.full_name
$$;

revoke execute on function public._apply_invitation(uuid, text), public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_invitation(text, text, text, uuid, text), public.cancel_invitation(text), public.list_teachers() from public, anon;
grant execute on function public.create_invitation(text, text, text, uuid, text), public.cancel_invitation(text), public.list_teachers() to authenticated;

commit;
```

## Fonction d'envoi des invitations (Edge Function)

Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**. Nom : `invite-student`. Remplacer le code par celui-ci, puis **Deploy**. Aucun secret à ajouter.

```ts
// Supabase Edge Function « invite-student » : envoie l'e-mail d'invitation au Campus.
// Appelée par le Campus après create_invitation (campus/db/003_invitations.sql), qui enregistre
// déjà le nom, le niveau et le professeur. Seuls les professeurs et l'admin peuvent l'utiliser.
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor,
// nom « invite-student », coller ce fichier, Deploy. Aucun secret à ajouter :
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SITE = 'https://pathway-languages.com';
const CAMPUS = `${SITE}/campus/`;
const cors = {
  'Access-Control-Allow-Origin': SITE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method_not_allowed' });

  const authorization = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: staff, error: staffError } = await asCaller.rpc('is_staff');
  if (staffError || staff !== true) return reply(403, { error: 'staff_only' });

  let email = '';
  try { email = String((await req.json()).email ?? '').trim().toLowerCase(); } catch { /* invalid body */ }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply(400, { error: 'invalid_email' });

  // The invitation must have been prepared by this caller (or visible to them) with create_invitation.
  const { data: invitation } = await asCaller.from('invitations').select('email, full_name').eq('email', email).maybeSingle();
  if (!invitation) return reply(404, { error: 'invitation_not_found' });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: CAMPUS, data: { full_name: invitation.full_name } });
  if (error) {
    if (/already (been )?registered|already exists/i.test(error.message)) return reply(200, { status: 'already_registered' });
    return reply(502, { error: 'invite_failed', message: error.message });
  }
  return reply(200, { status: 'invited' });
});
```

## 004 · Gestion des membres (admin)

À lancer après le 003, dans une nouvelle requête. Ajoute la carte « Miembros » dans Mi grupo : l'admin modifie le nom, le niveau, le professeur ou le type de compte, et supprime un compte avec toutes ses données. Aucune fonction à redéployer.

```sql
-- Campus Pathway · 004 · gestion des membres par l'admin, depuis le Campus
-- À exécuter après 003 (SQL Editor → New query → Run).
-- L'admin voit tous les comptes (élèves et professeurs), peut modifier le nom, le niveau, le rôle
-- et le professeur, et supprimer un compte avec toutes ses données. Un admin ne peut ni se modifier
-- lui-même ici ni toucher à un autre admin.

begin;

create function public.admin_members() returns table (
  id uuid, email text, full_name text, role text, level text, teacher_id uuid, teacher_name text,
  onboarded boolean, last_activity timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.full_name, p.role, p.level, p.teacher_id, t.full_name,
    p.onboarded_at is not null,
    (select max(x.created_at) from xp_events x where x.user_id = p.id),
    p.created_at
  from profiles p
  join auth.users u on u.id = p.id
  left join profiles t on t.id = p.teacher_id
  where public.my_role() = 'admin' and p.role <> 'admin'
  order by p.role desc, p.full_name
$$;

create function public.admin_update_member(p_user uuid, p_full_name text, p_level text, p_teacher uuid, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
declare target profiles;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'admin only'; end if;
  select * into target from profiles where id = p_user;
  if not found then raise exception 'unknown member'; end if;
  if target.role = 'admin' or p_user = auth.uid() then raise exception 'cannot edit an admin'; end if;
  if p_role not in ('student', 'teacher') then raise exception 'bad role'; end if;
  if p_level not in ('A1', 'A2', 'B1', 'B2') then raise exception 'bad level'; end if;
  if length(trim(coalesce(p_full_name, ''))) = 0 then raise exception 'name required'; end if;
  if p_role = 'student' and p_teacher is not null
     and not exists (select 1 from profiles where id = p_teacher and role in ('teacher', 'admin')) then
    raise exception 'unknown teacher';
  end if;
  update profiles set
    full_name = left(trim(p_full_name), 120),
    level = p_level,
    role = p_role,
    teacher_id = case when p_role = 'student' then p_teacher else null end
  where id = p_user;
  -- A former teacher's students keep their data but lose the link; the admin reassigns them.
  if target.role = 'teacher' and p_role = 'student' then
    update profiles set teacher_id = null where teacher_id = p_user;
  end if;
end $$;

create function public.admin_delete_member(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
declare target profiles; target_email text;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'admin only'; end if;
  select * into target from public.profiles where id = p_user;
  if not found then raise exception 'unknown member'; end if;
  if target.role = 'admin' or p_user = auth.uid() then raise exception 'cannot delete an admin'; end if;
  select email into target_email from auth.users where id = p_user;
  delete from public.invitations where email = lower(target_email);
  -- Deleting the auth account removes the profile and all its data (foreign keys cascade).
  delete from auth.users where id = p_user;
end $$;

revoke execute on function public.admin_members(), public.admin_update_member(uuid, text, text, uuid, text),
  public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_members(), public.admin_update_member(uuid, text, text, uuid, text),
  public.admin_delete_member(uuid) to authenticated;

commit;
```

## 005 · Éditeur de contenu

À lancer après le 004, dans une nouvelle requête. Active l'éditeur dans « Contenido » : créer une unité, modifier son titre, ajouter, modifier, réordonner et supprimer des exercices. Un nouvel exercice arrive en brouillon jusqu'à « Publicar ».

```sql
-- Campus Pathway · 005 · éditeur de contenu (unités et exercices) depuis le Campus
-- À exécuter après 004 (SQL Editor → New query → Run).
-- Les professeurs et les admins créent et modifient les unités et les exercices. Un nouvel exercice
-- arrive en brouillon : les élèves ne le voient qu'après « Publicar ».

begin;

-- Champs obligatoires par type d'exercice (le reste est contrôlé par le Campus).
create function public._valid_exercise(p_type text, p_payload jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(p_payload) = 'object'
    and coalesce(length(trim(p_payload ->> 'title')), 0) > 0
    and case p_type
      when 'choice' then jsonb_typeof(p_payload -> 'options') = 'array' and jsonb_array_length(p_payload -> 'options') between 2 and 6
        and (p_payload ->> 'answer')::int between 0 and jsonb_array_length(p_payload -> 'options') - 1
      when 'listen' then jsonb_typeof(p_payload -> 'options') = 'array' and jsonb_array_length(p_payload -> 'options') between 2 and 6
        and (p_payload ->> 'answer')::int between 0 and jsonb_array_length(p_payload -> 'options') - 1
        and length(coalesce(p_payload ->> 'audio', '')) > 0 and length(coalesce(p_payload ->> 'question', '')) > 0
      when 'type' then jsonb_typeof(p_payload -> 'answers') = 'array' and jsonb_array_length(p_payload -> 'answers') >= 1
      when 'dictation' then jsonb_typeof(p_payload -> 'answers') = 'array' and jsonb_array_length(p_payload -> 'answers') >= 1
        and length(coalesce(p_payload ->> 'audio', '')) > 0
      when 'order' then jsonb_typeof(p_payload -> 'answer') = 'array' and jsonb_array_length(p_payload -> 'answer') >= 2
        and jsonb_typeof(p_payload -> 'tiles') = 'array' and jsonb_array_length(p_payload -> 'tiles') >= jsonb_array_length(p_payload -> 'answer')
      when 'match' then jsonb_typeof(p_payload -> 'pairs') = 'array' and jsonb_array_length(p_payload -> 'pairs') between 2 and 8
      when 'spot' then jsonb_typeof(p_payload -> 'words') = 'array' and jsonb_array_length(p_payload -> 'words') >= 2
        and (p_payload ->> 'wrong')::int between 0 and jsonb_array_length(p_payload -> 'words') - 1
        and length(coalesce(p_payload ->> 'fix', '')) > 0
      else false end
$$;

-- Créer une unité (p_id vide) ou modifier son titre et sa durée dans le manuel.
create function public.save_unit(p_id text, p_level text, p_number int, p_title text, p_manual_time text) returns text
language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  if length(trim(coalesce(p_title, ''))) = 0 then raise exception 'title required'; end if;
  if p_id is null or p_id = '' then
    if p_level not in ('A1', 'A2', 'B1', 'B2') then raise exception 'bad level'; end if;
    if p_number is null or p_number not between 1 and 64 then raise exception 'bad number'; end if;
    v_id := lower(p_level) || '-' || lpad(p_number::text, 2, '0');
    if exists (select 1 from units where id = v_id) then raise exception 'unit exists'; end if;
    insert into units (id, level, segment, number, title, manual_time)
      values (v_id, p_level, chr(64 + ((p_number - 1) / 16) + 1), p_number, left(trim(p_title), 160), nullif(trim(coalesce(p_manual_time, '')), ''));
    return v_id;
  end if;
  update units set title = left(trim(p_title), 160), manual_time = nullif(trim(coalesce(p_manual_time, '')), '') where id = p_id;
  if not found then raise exception 'unknown unit'; end if;
  return p_id;
end $$;

-- Créer (p_id vide, ajouté en fin d'unité, en brouillon) ou modifier un exercice.
create function public.save_exercise(p_id uuid, p_unit text, p_type text, p_kind text, p_payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  if not public._valid_exercise(p_type, p_payload) then raise exception 'invalid exercise'; end if;
  if length(trim(coalesce(p_kind, ''))) = 0 then raise exception 'kind required'; end if;
  if p_id is null then
    if not exists (select 1 from units where id = p_unit) then raise exception 'unknown unit'; end if;
    insert into exercises (unit_id, position, type, kind, payload, status)
      values (p_unit, coalesce((select max(position) from exercises where unit_id = p_unit), 0) + 1, p_type, left(trim(p_kind), 60), p_payload, 'draft')
      returning id into v_id;
    return v_id;
  end if;
  update exercises set type = p_type, kind = left(trim(p_kind), 60), payload = p_payload, updated_at = now() where id = p_id;
  if not found then raise exception 'unknown exercise'; end if;
  return p_id;
end $$;

create function public.delete_exercise(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_unit text; v_pos int;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  delete from exercises where id = p_id returning unit_id, position into v_unit, v_pos;
  if v_unit is null then return; end if;
  -- Keep positions continuous (1, 2, 3…).
  update exercises set position = -position where unit_id = v_unit and position > v_pos;
  update exercises set position = -position - 1 where unit_id = v_unit and position < 0;
end $$;

-- Monter (p_dir = -1) ou descendre (p_dir = 1) un exercice dans l'unité.
create function public.move_exercise(p_id uuid, p_dir int) returns void
language plpgsql security definer set search_path = public as $$
declare cur exercises; other exercises;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select * into cur from exercises where id = p_id;
  if not found then raise exception 'unknown exercise'; end if;
  select * into other from exercises where unit_id = cur.unit_id and position = cur.position + sign(p_dir)::int;
  if not found then return; end if;
  update exercises set position = 0 where id = cur.id;
  update exercises set position = cur.position where id = other.id;
  update exercises set position = other.position where id = cur.id;
end $$;

revoke execute on function public._valid_exercise(text, jsonb) from public, anon, authenticated;
revoke execute on function public.save_unit(text, text, int, text, text), public.save_exercise(uuid, text, text, text, jsonb),
  public.delete_exercise(uuid), public.move_exercise(uuid, int) from public, anon;
grant execute on function public.save_unit(text, text, int, text, text), public.save_exercise(uuid, text, text, text, jsonb),
  public.delete_exercise(uuid), public.move_exercise(uuid, int) to authenticated;

commit;
```

## 006 · Progression des unités

À lancer après le 005, dans une nouvelle requête. Une unité s'ouvre quand la précédente est réussie avec au moins 75 % ; en cas d'échec, nouvel essai après 24 heures ; une unité quittée en cours reprend où l'élève s'était arrêté.

```sql
-- Campus Pathway · 006 · progression des unités (décision de la réunion avec Ryan)
-- À exécuter après 005 (SQL Editor → New query → Run).
-- • Une unité s'ouvre quand la précédente (même niveau, publiée) est réussie avec au moins 75 % de bonnes réponses
--   du premier coup. La première unité publiée du niveau est toujours ouverte ; une unité donnée en devoir aussi.
-- • En cas d'échec (moins de 75 %), la même unité est bloquée 24 heures avant une nouvelle tentative.
-- • Une unité commencée et quittée peut être reprise là où l'élève s'était arrêté.
-- Les professeurs et les admins ne sont pas bloqués.

begin;

create function public.unit_access(p_user uuid, p_unit text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  u units;
  prev text;
  last_run lesson_runs;
  passed boolean;
  cooldown timestamptz;
  unlocked boolean;
begin
  select * into u from units where id = p_unit;
  if not found then return jsonb_build_object('unlocked', false, 'passed', false); end if;
  if exists (select 1 from profiles where id = p_user and role in ('teacher', 'admin')) then
    return jsonb_build_object('unlocked', true, 'passed', false);
  end if;
  passed := exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = p_unit and r.first_try_correct * 100 >= 75 * r.total);
  select * into last_run from lesson_runs r where r.user_id = p_user and r.unit_id = p_unit order by r.finished_at desc limit 1;
  if not passed and last_run.id is not null and last_run.finished_at + interval '24 hours' > now() then
    cooldown := last_run.finished_at + interval '24 hours';
  end if;
  select x.id into prev from units x
    where x.level = u.level and x.number < u.number
      and exists (select 1 from exercises e where e.unit_id = x.id and e.status = 'validated')
    order by x.number desc limit 1;
  unlocked := prev is null
    or exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = prev and r.first_try_correct * 100 >= 75 * r.total)
    or exists (select 1 from assignment_students s join assignments a on a.id = s.assignment_id where s.student_id = p_user and a.unit_id = p_unit);
  return jsonb_build_object('unlocked', unlocked, 'passed', passed, 'cooldown_until', cooldown);
end $$;

-- Garde-fou côté serveur : une leçon ne peut être enregistrée que sur une unité ouverte et hors délai de 24 h.
create function public._check_unit_access() returns trigger
language plpgsql security definer set search_path = public as $$
declare a jsonb := public.unit_access(new.user_id, new.unit_id);
begin
  if not coalesce((a ->> 'unlocked')::boolean, false) then raise exception 'unit locked'; end if;
  if a ->> 'cooldown_until' is not null then raise exception 'unit cooldown'; end if;
  return new;
end $$;
create trigger lesson_runs_access before insert on public.lesson_runs
  for each row execute function public._check_unit_access();

-- Reprise d'une unité commencée.
create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  unit_id text not null references public.units (id) on delete cascade,
  state jsonb not null check (octet_length(state::text) < 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);
alter table public.lesson_progress enable row level security;
create policy "lesson_progress: le sien" on public.lesson_progress for select to authenticated using (user_id = auth.uid());
grant select on public.lesson_progress to authenticated;

create function public.save_lesson_progress(p_unit text, p_state jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into lesson_progress (user_id, unit_id, state) values (auth.uid(), p_unit, p_state)
  on conflict (user_id, unit_id) do update set state = excluded.state, updated_at = now();
end $$;

create function public.clear_lesson_progress(p_unit text) returns void
language sql security definer set search_path = public as $$
  delete from lesson_progress where user_id = auth.uid() and unit_id = p_unit
$$;

revoke execute on function public.unit_access(uuid, text), public._check_unit_access() from public, anon, authenticated;
revoke execute on function public.save_lesson_progress(text, jsonb), public.clear_lesson_progress(text) from public, anon;
grant execute on function public.save_lesson_progress(text, jsonb), public.clear_lesson_progress(text) to authenticated;

commit;
```

## 007 · Tutoriels (élève et professeur)

Garde dans le compte quels tutoriels ont été vus, pour qu'un tutoriel ne s'ouvre tout seul qu'une fois, quel que soit l'appareil. À exécuter une fois, après le 006. Sans ce script, le Campus s'en souvient seulement sur l'appareil.

```sql
begin;

-- 007 · Tutorials (campus/tour.js): remember, per account, which guided tours were seen,
-- so a tour opens by itself only once, whatever the device. Run once, after 006.

alter table public.profiles add column if not exists tours jsonb not null default '{}'::jsonb;

-- Marks a tour as seen for the signed-in user: 'student' or 'teacher'.
create or replace function public.mark_tour_seen(p_tour text)
returns void
language sql security definer set search_path = public as $$
  update public.profiles
     set tours = tours || jsonb_build_object(p_tour, now())
   where id = auth.uid() and p_tour in ('student', 'teacher');
$$;

revoke execute on function public.mark_tour_seen(text) from public, anon;
grant execute on function public.mark_tour_seen(text) to authenticated;

commit;
```

## 008 · Groupes, horaires fixes et programme par niveau

Crée les groupes (un professeur, un lien Zoom, un horaire hebdomadaire fixe), les demandes de changement validées par l'admin et les documents du programme par niveau, rangés dans le stockage privé « programa ». À exécuter une fois, après le 007. Sans ce script, les écrans « Horarios » et « Mi curso » restent cachés et le Campus marche comme avant.

```sql
-- Campus Pathway · 008 · groupes, horaires fixes, changements validés et programme par niveau
-- À exécuter après 007 (SQL Editor → New query → Run).
-- • Chaque élève appartient à un groupe (un cours privé = un groupe d'un élève) avec un professeur,
--   un lien Zoom et un horaire hebdomadaire fixe. Le « Prochain cours » de l'élève en découle.
-- • Un professeur ne déplace ni n'annule un cours lui-même : il fait une demande que l'admin valide.
--   Les demandes de l'admin sont validées d'office. Tout reste enregistré.
-- • Les documents du programme (manuel, cahiers…) sont rangés par niveau dans le stockage privé
--   « programa » : chaque élève voit ceux de son niveau dès son arrivée, sans que personne les envoie.

begin;

-- Groupes et horaires ─────────────────────────────────────────────────────────────────────────────
create table public.class_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  teacher_id uuid references public.profiles (id) on delete set null,
  level text not null default 'A2' check (level in ('A1', 'A2', 'B1', 'B2')),
  zoom_link text,
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists group_id uuid references public.class_groups (id) on delete set null;

-- Créneaux hebdomadaires, à l'heure du fuseau du groupe. weekday : 1 = lundi … 7 = dimanche.
create table public.group_slots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups (id) on delete cascade,
  weekday int not null check (weekday between 1 and 7),
  start_time time not null,
  duration_min int not null default 60 check (duration_min between 15 and 240)
);

-- Demandes de changement : déplacer (new_at) ou annuler (new_at null) une séance précise.
create table public.schedule_changes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups (id) on delete cascade,
  original_at timestamptz not null,
  new_at timestamptz,
  reason text not null default '' check (length(reason) <= 300),
  requested_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index schedule_changes_one_open on public.schedule_changes (group_id, original_at) where status <> 'rejected';

alter table public.class_groups enable row level security;
alter table public.group_slots enable row level security;
alter table public.schedule_changes enable row level security;

create function public.in_group(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and group_id = p_group)
      or exists (select 1 from class_groups where id = p_group and teacher_id = auth.uid())
      or public.my_role() = 'admin'
$$;

create policy "class_groups: les siens" on public.class_groups for select to authenticated using (public.in_group(id));
create policy "group_slots: ceux de ses groupes" on public.group_slots for select to authenticated using (public.in_group(group_id));
create policy "schedule_changes: ceux de ses groupes" on public.schedule_changes for select to authenticated using (public.in_group(group_id));

-- Séances d'un groupe entre deux dates : l'horaire fixe, avec les changements validés appliqués.
-- status : planned (à l'heure prévue), moved (déplacée à actual_at), cancelled.
create function public._group_sessions(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (scheduled_at timestamptz, actual_at timestamptz, duration_min int, status text, change_id uuid)
language sql stable security definer set search_path = public as $$
  with g as (select timezone from class_groups where id = p_group),
  base as (
    select ((d::date + s.start_time) at time zone g.timezone) as at, s.duration_min
    from g, group_slots s,
      generate_series((p_from at time zone g.timezone)::date - 14, (p_to at time zone g.timezone)::date + 14, interval '1 day') d
    where s.group_id = p_group and extract(isodow from d) = s.weekday
  )
  select b.at, coalesce(c.new_at, b.at), b.duration_min,
    case when c.id is null then 'planned' when c.new_at is null then 'cancelled' else 'moved' end, c.id
  from base b
  left join schedule_changes c on c.group_id = p_group and c.original_at = b.at and c.status = 'approved'
  where coalesce(c.new_at, b.at) >= p_from and coalesce(c.new_at, b.at) < p_to
  order by 2
$$;

-- Élève : son groupe et ses prochaines séances (les annulées sont signalées, pas cachées).
create function public.my_schedule() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'group', jsonb_build_object('id', g.id, 'name', g.name, 'zoom_link', g.zoom_link, 'timezone', g.timezone,
      'teacher', (select full_name from profiles t where t.id = g.teacher_id)),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('scheduled_at', x.scheduled_at, 'at', x.actual_at,
        'duration_min', x.duration_min, 'status', x.status) order by x.actual_at)
      from (select * from public._group_sessions(g.id, now() - interval '3 hours', now() + interval '21 days') limit 8) x), '[]'::jsonb))
  from profiles me join class_groups g on g.id = me.group_id
  where me.id = auth.uid()
$$;

-- Équipe : ses groupes (tous pour l'admin) avec l'horaire, les élèves et le bilan du mois en cours.
create function public.staff_groups() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  month_start timestamptz := date_trunc('month', now());
  month_end timestamptz := date_trunc('month', now()) + interval '1 month';
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', g.id, 'name', g.name, 'level', g.level, 'zoom_link', g.zoom_link, 'timezone', g.timezone,
      'teacher_id', g.teacher_id, 'teacher', (select full_name from profiles t where t.id = g.teacher_id),
      'slots', coalesce((select jsonb_agg(jsonb_build_object('weekday', s.weekday, 'start_time', to_char(s.start_time, 'HH24:MI'), 'duration_min', s.duration_min)
        order by s.weekday, s.start_time) from group_slots s where s.group_id = g.id), '[]'::jsonb),
      'members', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'full_name', p.full_name) order by p.full_name)
        from profiles p where p.group_id = g.id), '[]'::jsonb),
      'month', (select jsonb_build_object(
          'planned', count(*) filter (where x.status <> 'cancelled'),
          'moved', count(*) filter (where x.status = 'moved'),
          'cancelled', count(*) filter (where x.status = 'cancelled'),
          'done', count(*) filter (where x.status <> 'cancelled' and x.actual_at < now()))
        from public._group_sessions(g.id, month_start, month_end) x),
      'upcoming', coalesce((select jsonb_agg(jsonb_build_object('scheduled_at', x.scheduled_at, 'at', x.actual_at, 'status', x.status) order by x.actual_at)
        from (select * from public._group_sessions(g.id, now() - interval '3 hours', now() + interval '28 days') limit 12) x), '[]'::jsonb)
    ) order by g.name)
    from class_groups g
    where public.my_role() = 'admin' or g.teacher_id = auth.uid()), '[]'::jsonb);
end $$;

-- Admin : créer ou modifier un groupe, son horaire et ses élèves.
create function public.save_group(p_id uuid, p_name text, p_teacher uuid, p_level text, p_zoom text, p_timezone text,
  p_slots jsonb, p_members uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid := p_id;
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  if p_teacher is not null and not exists (select 1 from profiles where id = p_teacher and role in ('teacher', 'admin')) then
    raise exception 'teacher not found';
  end if;
  if p_timezone is null or not exists (select 1 from pg_timezone_names where name = p_timezone) then raise exception 'bad timezone'; end if;
  if gid is null then
    insert into class_groups (name, teacher_id, level, zoom_link, timezone)
    values (trim(p_name), p_teacher, p_level, nullif(trim(p_zoom), ''), p_timezone) returning id into gid;
  else
    update class_groups set name = trim(p_name), teacher_id = p_teacher, level = p_level,
      zoom_link = nullif(trim(p_zoom), ''), timezone = p_timezone where id = gid;
    if not found then raise exception 'group not found'; end if;
  end if;
  delete from group_slots where group_id = gid;
  insert into group_slots (group_id, weekday, start_time, duration_min)
  select gid, (s->>'weekday')::int, (s->>'start_time')::time, coalesce((s->>'duration_min')::int, 60)
  from jsonb_array_elements(coalesce(p_slots, '[]'::jsonb)) s;
  update profiles set group_id = null where group_id = gid and not (id = any (coalesce(p_members, '{}')));
  update profiles set group_id = gid, level = p_level, teacher_id = coalesce(p_teacher, teacher_id)
   where id = any (coalesce(p_members, '{}')) and role = 'student';
  return gid;
end $$;

create function public.delete_group(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  delete from class_groups where id = p_id;
end $$;

-- Professeur du groupe ou admin : demander à déplacer (p_new_at) ou annuler (p_new_at null) une séance.
-- La séance doit exister dans l'horaire fixe. Une demande de l'admin est validée d'office.
create function public.request_schedule_change(p_group uuid, p_original_at timestamptz, p_new_at timestamptz, p_reason text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  admin boolean := public.my_role() = 'admin';
  cid uuid;
begin
  if not admin and not exists (select 1 from class_groups where id = p_group and teacher_id = auth.uid()) then
    raise exception 'not your group';
  end if;
  if not exists (select 1 from public._group_sessions(p_group, p_original_at - interval '1 minute', p_original_at + interval '1 minute') x
                 where x.scheduled_at = p_original_at and x.status = 'planned') then
    raise exception 'no such session';
  end if;
  if p_original_at < now() - interval '1 day' then raise exception 'session in the past'; end if;
  if p_new_at is not null and p_new_at < now() then raise exception 'new time in the past'; end if;
  insert into schedule_changes (group_id, original_at, new_at, reason, requested_by, status, decided_by, decided_at)
  values (p_group, p_original_at, p_new_at, left(coalesce(trim(p_reason), ''), 300), auth.uid(),
    case when admin then 'approved' else 'pending' end, case when admin then auth.uid() end, case when admin then now() end)
  returning id into cid;
  return cid;
end $$;

-- Admin : valider ou refuser une demande.
create function public.decide_schedule_change(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  update schedule_changes set status = case when p_approve then 'approved' else 'rejected' end, decided_by = auth.uid(), decided_at = now()
   where id = p_id and status = 'pending';
  if not found then raise exception 'not pending'; end if;
end $$;

-- Équipe : les demandes de ses groupes (toutes pour l'admin), en attente d'abord.
create function public.list_schedule_changes() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'group_id', c.group_id, 'group', g.name,
      'original_at', c.original_at, 'new_at', c.new_at, 'reason', c.reason, 'status', c.status, 'created_at', c.created_at,
      'requested_by', (select full_name from profiles p where p.id = c.requested_by))
    order by (c.status = 'pending') desc, c.created_at desc), '[]'::jsonb)
  from (select * from schedule_changes order by created_at desc limit 60) c
  join class_groups g on g.id = c.group_id
  where public.is_staff() and (public.my_role() = 'admin' or g.teacher_id = auth.uid())
$$;

-- Programme par niveau ──────────────────────────────────────────────────────────────────────────────
create table public.level_documents (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  title text not null check (length(trim(title)) between 1 and 120),
  path text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.level_documents enable row level security;
create policy "level_documents: son niveau, tout pour l'équipe" on public.level_documents for select to authenticated
  using (public.is_staff() or level = (select level from profiles where id = auth.uid()));
create policy "level_documents: l'admin gère" on public.level_documents for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- Fichiers : stockage privé « programa », un dossier par niveau (A1/…, A2/…).
insert into storage.buckets (id, name, public) values ('programa', 'programa', false) on conflict (id) do nothing;
create policy "programa: lire son niveau" on storage.objects for select to authenticated
  using (bucket_id = 'programa' and (public.is_staff() or (storage.foldername(name))[1] = (select level from public.profiles where id = auth.uid())));
create policy "programa: l'admin dépose" on storage.objects for insert to authenticated
  with check (bucket_id = 'programa' and public.my_role() = 'admin');
create policy "programa: l'admin supprime" on storage.objects for delete to authenticated
  using (bucket_id = 'programa' and public.my_role() = 'admin');

grant select on public.class_groups, public.group_slots, public.schedule_changes, public.level_documents to authenticated;
grant insert, update, delete on public.level_documents to authenticated;
revoke execute on function public._group_sessions(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.my_schedule(), public.staff_groups(), public.save_group(uuid, text, uuid, text, text, text, jsonb, uuid[]),
  public.delete_group(uuid), public.request_schedule_change(uuid, timestamptz, timestamptz, text),
  public.decide_schedule_change(uuid, boolean), public.list_schedule_changes(), public.in_group(uuid) from public, anon;
grant execute on function public.my_schedule(), public.staff_groups(), public.save_group(uuid, text, uuid, text, text, text, jsonb, uuid[]),
  public.delete_group(uuid), public.request_schedule_change(uuid, timestamptz, timestamptz, text),
  public.decide_schedule_change(uuid, boolean), public.list_schedule_changes(), public.in_group(uuid) to authenticated;

commit;
```

## 009 · Suivi Zoom (heure réelle des cours et enregistrements)

À exécuter après le 008. Range dans le Campus les avis du compte Zoom Pathway : début et fin de chaque cours, enregistrement cloud terminé. L'élève retrouve ses cours enregistrés dans « Mi curso » ; l'équipe voit, cours par cours, l'heure réelle de début et si l'enregistrement est arrivé. Sans ce script, ces blocs restent cachés.

```sql
-- Campus Pathway · 009 · suivi Zoom : heure réelle des cours et enregistrements automatiques
-- À exécuter après 008 (SQL Editor → New query → Run).
-- La fonction « zoom-webhook » (supabase/functions/zoom-webhook) reçoit les avis du compte Zoom
-- Pathway : début et fin de chaque réunion, enregistrement cloud terminé. Chaque réunion est
-- rattachée au groupe dont le lien Zoom porte le même numéro (zoom.us/j/<numéro>).
-- • L'élève retrouve les enregistrements de son groupe dans « Mi curso ».
-- • L'équipe voit, séance par séance, l'heure réelle de début et si l'enregistrement est arrivé.

begin;

alter table public.class_groups
  add column if not exists zoom_meeting_id text generated always as (substring(zoom_link from '/j/([0-9]+)')) stored;
create index if not exists class_groups_zoom_meeting on public.class_groups (zoom_meeting_id);

-- Une ligne par réunion Zoom réellement tenue (uuid Zoom de l'occurrence).
create table public.zoom_meetings (
  meeting_uuid text primary key,
  meeting_id text not null,
  group_id uuid references public.class_groups (id) on delete set null,
  topic text not null default '',
  host_email text not null default '',
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  recording_minutes int,
  recorded_at timestamptz,
  updated_at timestamptz not null default now()
);
create index zoom_meetings_group_start on public.zoom_meetings (group_id, started_at);
alter table public.zoom_meetings enable row level security;
create policy "zoom_meetings: ceux de ses groupes" on public.zoom_meetings for select to authenticated
  using (group_id is not null and public.in_group(group_id));

-- Appelée uniquement par la fonction zoom-webhook (clé service). p_event : meeting.started,
-- meeting.ended ou recording.completed.
create function public.zoom_event(p_event text, p_meeting_id text, p_uuid text, p_topic text, p_host_email text,
  p_start timestamptz, p_end timestamptz, p_recording_url text, p_recording_minutes int) returns void
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if p_uuid is null or p_meeting_id is null then return; end if;
  select id into gid from class_groups where zoom_meeting_id = p_meeting_id order by created_at limit 1;
  insert into zoom_meetings as z (meeting_uuid, meeting_id, group_id, topic, host_email, started_at, ended_at, recording_url, recording_minutes, recorded_at)
  values (p_uuid, p_meeting_id, gid, coalesce(p_topic, ''), coalesce(p_host_email, ''), p_start,
    case when p_event = 'meeting.ended' then coalesce(p_end, now()) end,
    case when p_event = 'recording.completed' then p_recording_url end,
    case when p_event = 'recording.completed' then p_recording_minutes end,
    case when p_event = 'recording.completed' then now() end)
  on conflict (meeting_uuid) do update set
    group_id = coalesce(z.group_id, excluded.group_id),
    topic = coalesce(nullif(excluded.topic, ''), z.topic),
    host_email = coalesce(nullif(excluded.host_email, ''), z.host_email),
    started_at = coalesce(z.started_at, excluded.started_at),
    ended_at = coalesce(excluded.ended_at, z.ended_at),
    recording_url = coalesce(excluded.recording_url, z.recording_url),
    recording_minutes = coalesce(excluded.recording_minutes, z.recording_minutes),
    recorded_at = coalesce(excluded.recorded_at, z.recorded_at),
    updated_at = now();
end $$;
revoke execute on function public.zoom_event(text, text, text, text, text, timestamptz, timestamptz, text, int) from public, anon, authenticated;
grant execute on function public.zoom_event(text, text, text, text, text, timestamptz, timestamptz, text, int) to service_role;

-- Séances passées d'un groupe, chacune avec la réunion Zoom qui lui correspond (démarrée entre
-- 60 min avant et 90 min après l'heure prévue) : heure réelle, retard, enregistrement.
create function public._group_log(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (scheduled_at timestamptz, at timestamptz, status text, started_at timestamptz, late_min int, recording_url text, recorded boolean)
language sql stable security definer set search_path = public as $$
  select s.scheduled_at, s.actual_at, s.status, z.started_at,
    case when z.started_at is not null then greatest(0, round(extract(epoch from z.started_at - s.actual_at) / 60))::int end,
    z.recording_url, z.recording_url is not null
  from public._group_sessions(p_group, p_from, p_to) s
  left join lateral (
    select * from zoom_meetings m
    where m.group_id = p_group and m.started_at between s.actual_at - interval '60 minutes' and s.actual_at + interval '90 minutes'
    order by abs(extract(epoch from m.started_at - s.actual_at)) limit 1
  ) z on s.status <> 'cancelled'
  where s.actual_at < now()
  order by s.actual_at desc
$$;
revoke execute on function public._group_log(uuid, timestamptz, timestamptz) from public, anon, authenticated;

-- Élève : enregistrements de son groupe (60 derniers jours).
create function public.my_recordings() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('at', m.started_at, 'url', m.recording_url, 'minutes', m.recording_minutes) order by m.started_at desc), '[]'::jsonb)
  from profiles me join zoom_meetings m on m.group_id = me.group_id
  where me.id = auth.uid() and m.recording_url is not null and m.started_at > now() - interval '60 days'
$$;

-- Équipe : journal des séances passées (30 jours) de ses groupes, et réunions Zoom sans groupe (admin).
create function public.staff_class_log() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return jsonb_build_object(
    'groups', coalesce((select jsonb_object_agg(g.id, coalesce((select jsonb_agg(to_jsonb(l)) from public._group_log(g.id, now() - interval '30 days', now()) l), '[]'::jsonb))
      from class_groups g where public.my_role() = 'admin' or g.teacher_id = auth.uid()), '{}'::jsonb),
    'unmatched', case when public.my_role() = 'admin' then coalesce((select jsonb_agg(jsonb_build_object('meeting_id', m.meeting_id, 'topic', m.topic,
        'host_email', m.host_email, 'started_at', m.started_at, 'recorded', m.recording_url is not null) order by m.started_at desc)
      from (select * from zoom_meetings where group_id is null and started_at > now() - interval '30 days' order by started_at desc limit 20) m), '[]'::jsonb) else '[]'::jsonb end);
end $$;

grant select on public.zoom_meetings to authenticated;
revoke execute on function public.my_recordings(), public.staff_class_log() from public, anon;
grant execute on function public.my_recordings(), public.staff_class_log() to authenticated;

commit;
```

### Fonction « zoom-webhook »

Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**. Nom : `zoom-webhook`. Remplacer le code par celui-ci, puis **Deploy**. Ensuite, dans les réglages de la fonction, désactiver **Verify JWT** (c'est Zoom qui appelle). Secret à ajouter dans **Edge Functions → Secrets** : `ZOOM_WEBHOOK_SECRET` = le « Secret Token » de l'app Zoom.

```ts
// Supabase Edge Function « zoom-webhook » : reçoit les avis du compte Zoom Pathway
// (début et fin de réunion, enregistrement cloud terminé) et les range dans le Campus
// (campus/db/009_zoom.sql, fonction zoom_event).
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor,
// nom « zoom-webhook », coller ce fichier, Deploy. Puis, dans les réglages de la fonction,
// désactiver « Verify JWT » (« Enforce JWT verification ») : c'est Zoom qui appelle, pas un
// utilisateur connecté ; chaque appel est vérifié avec la signature Zoom ci-dessous.
// Secret à ajouter (Edge Functions → Secrets) : ZOOM_WEBHOOK_SECRET = le « Secret Token »
// de l'app Zoom (onglet Features → Event Subscriptions). SUPABASE_URL et
// SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const encoder = new TextEncoder();
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
  return Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Comparaison en temps constant, pour ne rien laisser deviner de la signature attendue.
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Lien de lecture sans demander le code : Zoom indique de l'ajouter en « pwd » au lien de partage.
function recordingLink(object: Record<string, any>): string | null {
  const base = object.share_url || (object.recording_files || []).find((f: any) => f.play_url)?.play_url;
  if (!base) return null;
  const pass = object.recording_play_passcode;
  if (!pass || /[?&]pwd=/.test(base)) return base;
  return `${base}${base.includes('?') ? '&' : '?'}pwd=${encodeURIComponent(pass)}`;
}

Deno.serve(async req => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const secret = Deno.env.get('ZOOM_WEBHOOK_SECRET');
  if (!secret) return json(500, { error: 'missing_secret' });

  const raw = await req.text();
  let body: Record<string, any>;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'bad_json' }); }

  // Zoom vérifie l'adresse en envoyant un jeton à chiffrer avec le Secret Token.
  if (body.event === 'endpoint.url_validation') {
    const plainToken = String(body.payload?.plainToken ?? '');
    return json(200, { plainToken, encryptedToken: await hmacHex(secret, plainToken) });
  }

  const timestamp = req.headers.get('x-zm-request-timestamp') ?? '';
  const signature = req.headers.get('x-zm-signature') ?? '';
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
  if (!fresh || !sameText(signature, `v0=${await hmacHex(secret, `v0:${timestamp}:${raw}`)}`)) {
    return json(401, { error: 'bad_signature' });
  }

  const event = String(body.event ?? '');
  if (!['meeting.started', 'meeting.ended', 'recording.completed'].includes(event)) return json(200, { ignored: event });

  const object = body.payload?.object ?? {};
  const files = (object.recording_files || []) as Array<Record<string, any>>;
  const minutes = event === 'recording.completed'
    ? Math.round(Math.max(0, ...files.map(f => (Date.parse(f.recording_end) - Date.parse(f.recording_start)) / 60000).filter(Number.isFinite))) || object.duration || null
    : null;

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await supabase.rpc('zoom_event', {
    p_event: event,
    p_meeting_id: object.id != null ? String(object.id) : null,
    p_uuid: object.uuid ?? null,
    p_topic: object.topic ?? '',
    p_host_email: object.host_email ?? '',
    p_start: object.start_time ?? null,
    p_end: object.end_time ?? null,
    p_recording_url: event === 'recording.completed' ? recordingLink(object) : null,
    p_recording_minutes: minutes
  });
  if (error) return json(500, { error: 'store_failed' });
  return json(200, { ok: true });
});
```
