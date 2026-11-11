# SQL à copier-coller dans Supabase

Supabase → **SQL Editor** → **New query** → coller le bloc → **Run**.
Résultat attendu : « Success. No rows returned ».
Chaque bloc ne s'exécute **qu'une seule fois**, dans l'ordre : 001, 002, 003, 004, puis 005, chacun dans une nouvelle requête.

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

