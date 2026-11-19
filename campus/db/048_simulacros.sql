-- Campus Pathway · 048 · Simulacros en ligne : compréhension orale et compréhension écrite
--
-- Les examens blancs TCF Canada de Pathway (B1, B2), passés dans le Campus en conditions d'examen :
--   - CO : 39 questions, 35 min, chaque document s'écoute une seule fois (voix du navigateur), pas de retour ;
--   - CE : 39 questions, 60 min, on peut revenir en arrière ;
--   - correction côté serveur : les bonnes réponses ne sont jamais envoyées avant la fin ;
--   - à la fin : le score, une appréciation indicative et la correction question par question.
-- L'expression écrite et l'expression orale se travaillent en classe avec le professeur (pas en ligne pour l'instant).
-- Les questions sont chargées par 049 (depuis campus/simulacros/tcf_examenes_blancos.json).

create table if not exists public.sim_exams (
  id text primary key,
  label text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  rules jsonb not null default '{}',
  scoring text,
  position int not null default 0
);

create table if not exists public.sim_items (
  exam_id text not null references public.sim_exams(id) on delete cascade,
  section text not null check (section in ('co', 'ce')),
  n int not null check (n between 1 and 99),
  doc_group text,
  script text,            -- CO : le texte lu une fois par la voix
  document text,          -- CE : le document à lire
  question text not null,
  question_after boolean not null default false, -- CO : la question n'apparaît qu'après l'écoute
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer int not null check (answer between 0 and 3),
  note text,
  primary key (exam_id, section, n)
);

create table if not exists public.sim_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id text not null references public.sim_exams(id) on delete cascade,
  section text not null check (section in ('co', 'ce')),
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  finished_at timestamptz,
  answers jsonb not null default '{}',   -- { "n": index choisi }
  correct int,
  total int,
  estimate jsonb
);
create index if not exists sim_attempts_user on public.sim_attempts (user_id, finished_at desc);

alter table public.sim_exams enable row level security;
alter table public.sim_items enable row level security;
alter table public.sim_attempts enable row level security;
-- Les questions et les corrigés ne se lisent que par les fonctions ci-dessous (et par l'équipe).
create policy "sim_exams: lecture" on public.sim_exams for select using (auth.uid() is not null);
create policy "sim_items: équipe" on public.sim_items for select using (public.is_staff());
create policy "sim_attempts: les siens, ou ses élèves" on public.sim_attempts for select
  using (user_id = auth.uid() or public.teaches(user_id));
grant select on public.sim_exams, public.sim_items, public.sim_attempts to authenticated;

-- Appréciation indicative à partir du pourcentage de bonnes réponses. Ce n'est ni un score TCF ni un niveau
-- NCLC : l'examen blanc de Pathway ne se convertit pas officiellement.
create or replace function public._sim_estimate(p_correct int, p_total int) returns jsonb
language sql immutable as $$
  select jsonb_build_object('pct', p, 'band', case when p >= 80 then 'muy_solido' when p >= 65 then 'solido'
                                                  when p >= 45 then 'en_progreso' else 'por_reforzar' end)
  from (select case when coalesce(p_total, 0) = 0 then 0 else round(100.0 * p_correct / p_total)::int end p) x
$$;

-- Catalogue : les examens, leurs épreuves et mes derniers résultats.
create or replace function public.sim_catalog() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'label', e.label, 'level', e.level, 'rules', e.rules,
    'sections', (select jsonb_object_agg(s.section, jsonb_build_object('count', s.cnt,
        'minutes', case s.section when 'co' then 35 else 60 end))
      from (select section, count(*) cnt from sim_items i where i.exam_id = e.id group by section) s),
    'attempts', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'section', a.section, 'started_at', a.started_at,
        'finished_at', a.finished_at, 'deadline', a.deadline, 'correct', a.correct, 'total', a.total, 'estimate', a.estimate)
        order by a.started_at desc)
      from sim_attempts a where a.user_id = auth.uid() and a.exam_id = e.id), '[]'::jsonb))
    order by e.position), '[]'::jsonb)
  from sim_exams e
  where auth.uid() is not null and exists (select 1 from sim_items i where i.exam_id = e.id)
$$;

-- Les questions d'une épreuve, sans les réponses.
create or replace function public._sim_items_public(p_exam text, p_section text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('n', n, 'doc_group', doc_group, 'script', script, 'document', document,
    'question', question, 'question_after', question_after, 'options', options) order by n), '[]'::jsonb)
  from sim_items where exam_id = p_exam and section = p_section
$$;

-- Enregistrer une réponse (au fur et à mesure : rien n'est perdu si la connexion coupe).
create or replace function public.sim_answer(p_attempt uuid, p_n int, p_choice int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_choice is not null and p_choice not between 0 and 3 then raise exception 'invalid choice'; end if;
  update sim_attempts set answers = case when p_choice is null then answers - p_n::text else answers || jsonb_build_object(p_n::text, p_choice) end
  where id = p_attempt and user_id = auth.uid() and finished_at is null and deadline + interval '2 minutes' > now();
  if not found then raise exception 'test closed'; end if;
end $$;

-- La correction d'une épreuve terminée (la sienne, ou celle d'un de ses élèves).
create or replace function public.sim_review(p_attempt uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', a.id, 'exam_id', a.exam_id, 'section', a.section, 'started_at', a.started_at,
    'finished_at', a.finished_at, 'correct', a.correct, 'total', a.total, 'estimate', a.estimate,
    'items', (select jsonb_agg(jsonb_build_object('n', i.n, 'doc_group', i.doc_group, 'script', i.script, 'document', i.document,
        'question', i.question, 'options', i.options, 'answer', i.answer, 'note', i.note,
        'chosen', (a.answers ->> i.n::text)::int) order by i.n)
      from sim_items i where i.exam_id = a.exam_id and i.section = a.section))
  from sim_attempts a
  where a.id = p_attempt and a.finished_at is not null and (a.user_id = auth.uid() or public.teaches(a.user_id))
$$;

-- Terminer (bouton « Terminar » ou temps écoulé) : correction et appréciation.
create or replace function public.sim_finish(p_attempt uuid, p_answers jsonb default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a sim_attempts; c int; t int;
begin
  select * into a from sim_attempts where id = p_attempt and user_id = auth.uid() for update;
  if not found then raise exception 'not found'; end if;
  if a.finished_at is null then
    -- Les dernières réponses envoyées avec « Terminar » comptent si le temps (plus 2 minutes de marge) n'est pas dépassé.
    if p_answers is not null and jsonb_typeof(p_answers) = 'object' and a.deadline + interval '2 minutes' > now() then
      a.answers := a.answers || (select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) from jsonb_each(p_answers) x(k, v)
        where k ~ '^\d{1,2}$' and jsonb_typeof(v) = 'number' and (v::text)::int between 0 and 3);
    end if;
    select count(*) filter (where (a.answers ->> i.n::text)::int = i.answer), count(*) into c, t
      from sim_items i where i.exam_id = a.exam_id and i.section = a.section;
    update sim_attempts set answers = a.answers, finished_at = least(now(), deadline + interval '2 minutes'),
      correct = c, total = t, estimate = public._sim_estimate(c, t)
    where id = a.id;
  end if;
  return public.sim_review(p_attempt);
end $$;

-- Commencer une épreuve (ou reprendre celle en cours, si le temps n'est pas écoulé).
create or replace function public.sim_start(p_exam text, p_section text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a sim_attempts; mins int; x record;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  -- Les épreuves abandonnées dont le temps est écoulé sont corrigées avec les réponses enregistrées.
  for x in select id from sim_attempts where user_id = auth.uid() and finished_at is null and deadline + interval '2 minutes' < now() loop
    perform public.sim_finish(x.id);
  end loop;
  if p_section not in ('co', 'ce') or not exists (select 1 from sim_items where exam_id = p_exam and section = p_section) then
    raise exception 'unknown test';
  end if;
  select * into a from sim_attempts where user_id = auth.uid() and exam_id = p_exam and section = p_section
    and finished_at is null and deadline > now() order by started_at desc limit 1;
  if not found then
    if (select count(*) from sim_attempts where user_id = auth.uid() and started_at > now() - interval '24 hours') >= 6 then
      raise exception 'too many tests today';
    end if;
    mins := case p_section when 'co' then 35 else 60 end;
    insert into sim_attempts (user_id, exam_id, section, deadline)
      values (auth.uid(), p_exam, p_section, now() + make_interval(mins => mins)) returning * into a;
  end if;
  return jsonb_build_object('id', a.id, 'exam_id', a.exam_id, 'section', a.section, 'started_at', a.started_at,
    'deadline', a.deadline, 'answers', a.answers, 'items', public._sim_items_public(a.exam_id, a.section));
end $$;

-- Pour l'équipe : les derniers résultats de ses élèves.
create or replace function public.staff_sim_results() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'student_id', a.user_id, 'exam_id', a.exam_id, 'section', a.section,
    'finished_at', a.finished_at, 'correct', a.correct, 'total', a.total, 'estimate', a.estimate) order by a.finished_at desc), '[]'::jsonb)
  from (select * from sim_attempts where finished_at is not null and finished_at > now() - interval '120 days' order by finished_at desc limit 300) a
  where public.is_staff() and public.teaches(a.user_id)
$$;

revoke all on function public.sim_catalog(), public._sim_items_public(text, text), public.sim_start(text, text), public.sim_answer(uuid, int, int),
  public.sim_review(uuid), public.sim_finish(uuid, jsonb), public.staff_sim_results(), public._sim_estimate(int, int) from public, anon;
grant execute on function public.sim_catalog(), public.sim_start(text, text), public.sim_answer(uuid, int, int),
  public.sim_review(uuid), public.sim_finish(uuid, jsonb), public.staff_sim_results() to authenticated;
