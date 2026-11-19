-- Campus Pathway · 045 · les données du compte démo
--
-- demo_seed() remplit (ou remet à zéro) le monde démo, avec des dates relatives à maintenant : la prochaine
-- classe est toujours à venir, la série est en cours, les cours enregistrés sont récents.
--
-- Les 5 comptes démo (créés par la fonction « demo » avec des adresses @example.com, qui ne reçoivent
-- jamais d'e-mail) :
--   profesor.demo@example.com   Julien Moreau, professeur (rôle teacher)
--   lucia.demo@example.com      Lucía Ramírez, A2, TEF, Lima : l'élève « vitrine » (série de 12 jours)
--   mateo.demo@example.com      Mateo Torres, A2, TCF, Bogotá : en retard, 2 absences, à relancer
--   valentina.demo@example.com  Valentina Quispe, A2, TEF, Lima : tout l'A2 fait, série de 31 jours, fin de niveau à valider
--   diego.demo@example.com      Diego Fernández, A2, TCF, Santiago : nouveau, une question en attente
--
-- Tout est marqué is_demo (voir 044) : invisible pour l'équipe réelle, jamais d'e-mail, rien dans le CRM.
-- Appelée par la fonction « demo » (rôle service) ou par un membre de l'équipe.

create table if not exists public.demo_state (id int primary key default 1 check (id = 1), seeded_at timestamptz);
alter table public.demo_state enable row level security;

create or replace function public.demo_seed() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
  t uuid; lu uuid; ma uuid; va uuid; di uuid;
  g_lu uuid; g_ma uuid; g_va uuid; g_di uuid;
  studs uuid[]; grps uuid[];
  s record; e record; r uuid; th uuid; m bigint; i int; k int; tz text; ok int;
  sig text := 'M20 120 Q 60 40 110 110 Q 160 170 190 90 Q 250 30 280 110 M300 100 Q 340 60 380 120 Q 430 160 470 90 L 520 120';
  body text := E'COMPROMISO DEL ALUMNO · PATHWAY LANGUAGE SOLUTIONS\n\n1. Tu curso\nCuenta de demostración del Campus Pathway.';
begin
  if auth.uid() is not null and not public.is_staff() then raise exception 'staff only'; end if;

  select id into t  from auth.users where email = 'profesor.demo@example.com';
  select id into lu from auth.users where email = 'lucia.demo@example.com';
  select id into ma from auth.users where email = 'mateo.demo@example.com';
  select id into va from auth.users where email = 'valentina.demo@example.com';
  select id into di from auth.users where email = 'diego.demo@example.com';
  if t is null or lu is null or ma is null or va is null or di is null then raise exception 'demo accounts missing'; end if;
  studs := array[lu, ma, va, di];

  -- 0. Remise à zéro de tout ce qui appartient au monde démo.
  update profiles set is_demo = true where id = any(studs || t);
  select coalesce(array_agg(id), '{}') into grps from class_groups where teacher_id = t;
  delete from zoom_meetings where group_id = any(grps);
  delete from schedule_changes where group_id = any(grps);
  update profiles set group_id = null where id = any(studs);
  delete from class_groups where id = any(grps);
  delete from attempts where user_id = any(studs);
  delete from lesson_runs where user_id = any(studs);
  delete from xp_events where user_id = any(studs);
  delete from review_cards where user_id = any(studs);
  delete from user_badges where user_id = any(studs);
  delete from weekly_claims where user_id = any(studs);
  delete from lesson_progress where user_id = any(studs);
  delete from taught_units where student_id = any(studs);
  delete from taught_numbers where student_id = any(studs);
  delete from level_validations where student_id = any(studs);
  delete from contract_signatures where student_id = any(studs);
  delete from message_threads where student_id = any(studs);
  delete from absence_excuses where student_id = any(studs);
  delete from absence_requests where student_id = any(studs);
  delete from absence_notices where student_id = any(studs);
  delete from absence_warnings where student_id = any(studs);
  delete from makeup_sessions where student_id = any(studs);
  delete from class_joins where student_id = any(studs);
  delete from class_reminders_sent where student_id = any(studs);
  delete from assignment_students where student_id = any(studs);
  delete from assignments where teacher_id = t;

  -- 1. Les profils.
  update profiles set role = 'teacher', full_name = 'Julien Moreau', teacher_id = null, level = 'A2', timezone = 'America/Lima',
    onboarded_at = now() - interval '60 days', tours = jsonb_build_object('teacher', now(), 'student', now())
  where id = t;
  update profiles set role = 'student', teacher_id = t, level = 'A2', tours = jsonb_build_object('student', now()),
    reminder = 'noche', reminder_channel = 'correo', freezes = 1, next_class_at = null, class_link = null
  where id = any(studs);
  update profiles set full_name = 'Lucía Ramírez', motive = 'rp', exam = 'tef', timezone = 'America/Lima', daily_goal = 50,
    target_month = to_char(now() + interval '9 months', 'YYYY-MM'), onboarded_at = now() - interval '40 days', created_at = now() - interval '40 days',
    xp_total = 2150, streak = 12, best_streak = 15, last_goal_day = (now() at time zone 'America/Lima')::date - 1,
    plan = 'mensual', plan_start = (now() - interval '26 days')::date where id = lu;
  update profiles set full_name = 'Mateo Torres', motive = 'trabajo', exam = 'tcf', timezone = 'America/Bogota', daily_goal = 30,
    target_month = to_char(now() + interval '12 months', 'YYYY-MM'), onboarded_at = now() - interval '35 days', created_at = now() - interval '35 days',
    xp_total = 640, streak = 0, best_streak = 6, last_goal_day = (now() at time zone 'America/Bogota')::date - 9, freezes = 0,
    plan = 'mensual', plan_start = (now() - interval '20 days')::date where id = ma;
  update profiles set full_name = 'Valentina Quispe', motive = 'rp', exam = 'tef', timezone = 'America/Lima', daily_goal = 80,
    target_month = to_char(now() + interval '6 months', 'YYYY-MM'), onboarded_at = now() - interval '140 days', created_at = now() - interval '140 days',
    xp_total = 9480, streak = 31, best_streak = 31, last_goal_day = (now() at time zone 'America/Lima')::date - 1, freezes = 2,
    plan = 'ciclo', plan_start = (now() - interval '135 days')::date where id = va;
  update profiles set full_name = 'Diego Fernández', motive = 'estudios', exam = 'tcf', timezone = 'America/Santiago', daily_goal = 50,
    target_month = to_char(now() + interval '14 months', 'YYYY-MM'), onboarded_at = now() - interval '6 days', created_at = now() - interval '6 days',
    xp_total = 180, streak = 3, best_streak = 3, last_goal_day = (now() at time zone 'America/Santiago')::date - 1,
    plan = 'mensual', plan_start = (now() - interval '5 days')::date where id = di;

  -- 2. Cours particuliers : un « groupe » par élève, horaire fixe, lien Zoom factice (0000…, aucune vraie réunion).
  insert into class_groups (name, teacher_id, level, zoom_link, timezone, created_at)
    values ('Lucía Ramírez', t, 'A2', 'https://zoom.us/j/00000000001', 'America/Lima', now() - interval '40 days') returning id into g_lu;
  insert into class_groups (name, teacher_id, level, zoom_link, timezone, created_at)
    values ('Mateo Torres', t, 'A2', 'https://zoom.us/j/00000000002', 'America/Bogota', now() - interval '35 days') returning id into g_ma;
  insert into class_groups (name, teacher_id, level, zoom_link, timezone, created_at)
    values ('Valentina Quispe', t, 'A2', 'https://zoom.us/j/00000000003', 'America/Lima', now() - interval '140 days') returning id into g_va;
  insert into class_groups (name, teacher_id, level, zoom_link, timezone, created_at)
    values ('Diego Fernández', t, 'A2', 'https://zoom.us/j/00000000004', 'America/Santiago', now() - interval '6 days') returning id into g_di;
  insert into group_slots (group_id, weekday, start_time, duration_min) values
    (g_lu, 2, '19:00', 60), (g_lu, 4, '19:00', 60),
    (g_ma, 1, '20:00', 60), (g_ma, 3, '20:00', 60),
    (g_va, 1, '07:00', 60), (g_va, 3, '07:00', 60), (g_va, 5, '07:00', 60),
    (g_di, 2, '18:30', 60), (g_di, 5, '18:30', 60);
  update profiles set group_id = g_lu where id = lu;
  update profiles set group_id = g_ma where id = ma;
  update profiles set group_id = g_va where id = va;
  update profiles set group_id = g_di where id = di;
  update profiles set group_joined_at = now() - interval '35 days' where id = lu;
  update profiles set group_joined_at = now() - interval '30 days' where id = ma;
  update profiles set group_joined_at = now() - interval '135 days' where id = va;
  update profiles set group_joined_at = now() - interval '6 days' where id = di;

  -- 3. Contrat signé (le Campus fait signer à nouveau si le texte en vigueur a changé).
  insert into contract_signatures (student_id, body, body_sha256, signed_name, signature, signed_at, ip, user_agent)
  select p.id, body, encode(sha256(convert_to(body, 'UTF8')), 'hex'), p.full_name, sig, p.onboarded_at + interval '10 minutes', 'demo', 'demo'
  from profiles p where p.id = any(studs);

  -- 4. Cours passés : présences, enregistrements Zoom, rapports de cours (unités vues en classe).
  for s in
    select x.gid, x.sid, x.tz, c.scheduled_at, c.actual_at, c.duration_min,
           row_number() over (partition by x.gid order by c.actual_at desc) as rk,
           row_number() over (partition by x.gid order by c.actual_at) as nth
    from (values (g_lu, lu, 'America/Lima', now() - interval '35 days'), (g_ma, ma, 'America/Bogota', now() - interval '30 days'),
                 (g_va, va, 'America/Lima', now() - interval '135 days'), (g_di, di, 'America/Santiago', now() - interval '6 days')) x(gid, sid, tz, since)
    cross join lateral public._group_sessions(x.gid, x.since, now()) c
    where c.status <> 'cancelled' and c.actual_at + make_interval(mins => c.duration_min) < now()
  loop
    -- Mateo manque ses 2 derniers cours (absences sans justificatif) ; Lucía arrive une fois en retard.
    continue when s.sid = ma and s.rk <= 2;
    insert into class_joins (student_id, group_id, scheduled_at, clicked_at)
      values (s.sid, s.gid, s.scheduled_at, s.actual_at + case when s.sid = lu and s.rk = 5 then interval '7 minutes' else interval '-3 minutes' end);
    insert into zoom_meetings (meeting_uuid, meeting_id, group_id, topic, host_email, started_at, ended_at, recording_url, recording_minutes, recorded_at, updated_at)
      values ('demo-' || s.gid || '-' || extract(epoch from s.actual_at)::bigint, '0000000000' || (array_position(array[g_lu, g_ma, g_va, g_di], s.gid))::text,
              s.gid, 'Clase de francés', 'profesor.demo@example.com', s.actual_at + interval '1 minute', s.actual_at + interval '59 minutes',
              case when s.rk <= 6 then 'https://zoom.us/rec/share/demo-pathway' end, case when s.rk <= 6 then 57 end,
              case when s.rk <= 6 then s.actual_at + interval '70 minutes' end, now());
    insert into session_reports (group_id, scheduled_at, teacher_id, unit_ids, unit_numbers, note, created_at)
      values (s.gid, s.scheduled_at, t, case when s.nth = 1 then array['a2-01'] else array[]::text[] end,
              array[least(s.nth::int, 63)], case when s.nth = 1 then 'Presentarse y hablar de su trabajo.' end, s.actual_at + interval '65 minutes');
    insert into taught_numbers (student_id, level, number, first_at) values (s.sid, 'A2', least(s.nth::int, 63), s.actual_at)
      on conflict do nothing;
  end loop;
  insert into taught_units (student_id, unit_id, first_at)
    select x.uid, u.id, now() - make_interval(days => x.days - 2 * u.number)
    from (values (lu, 7, 40), (ma, 3, 30), (va, 63, 130), (di, 1, 5)) x(uid, upto, days)
    join units u on u.level = 'A2' and u.number <= x.upto
      and exists (select 1 from exercises ex where ex.unit_id = u.id and ex.status in ('validated', 'draft'));

  -- 5. Unités faites, avec le détail des réponses (les brouillons comptent dans la démo, voir 046).
  -- Unités réussies (≥ 75 %), dans l'ordre : Lucía 1–6 (la 7 est l'unité actuelle), Valentina tout l'A2
  -- (fin de niveau), Mateo 1–2 puis un échec sur la 3 ; Diego n'a pas commencé (tâche sur l'unité 1).
  for s in
    select x.uid, u.id as unit_id, u.number,
           case when x.uid = ma and u.number = 3 then 5 else 6 + (u.number % 3) end as ok,
           greatest(x.days - 2 * u.number - 1, 1) as days_ago
    from (values (lu, 6, 38), (ma, 3, 28), (va, 63, 128)) x(uid, upto, days)
    join units u on u.level = 'A2' and u.number <= x.upto
      and exists (select 1 from exercises ex where ex.unit_id = u.id and ex.status in ('validated', 'draft'))
    order by x.uid, u.number
  loop
    select count(*) into k from exercises where unit_id = s.unit_id and status in ('validated', 'draft');
    ok := case when s.uid = ma and s.number = 3 then floor(k * 0.6)::int else least(k, ceil(k * 0.75)::int + (s.number % 3)) end;
    insert into lesson_runs (user_id, unit_id, total, first_try_correct, xp, duration_s, finished_at, focus_lost)
      values (s.uid, s.unit_id, k, ok, 10 * ok, 60 * k + 20 * ok, now() - make_interval(days => s.days_ago),
              case when s.uid = ma and s.number = 3 then 2 else 0 end)
      returning id into r;
    i := 0;
    for e in select id from exercises where unit_id = s.unit_id and status in ('validated', 'draft') order by position loop
      i := i + 1;
      insert into attempts (user_id, run_id, exercise_id, first_try, correct, created_at)
        values (s.uid, r, e.id, i <= ok, true, now() - make_interval(days => s.days_ago) - make_interval(mins => 9 - i));
    end loop;
  end loop;

  -- 6. XP jour par jour : la série en cours, et quelques jours plus anciens.
  for s in select * from (values (lu, 'America/Lima', 12, 55, 20, 40), (va, 'America/Lima', 31, 85, 45, 60),
                                 (ma, 'America/Bogota', 0, 35, 0, 30), (di, 'America/Santiago', 3, 55, 15, 6)) v(uid, tz, streak, per_day, today, span) loop
    for k in 1 .. s.span loop
      if k <= s.streak or (s.uid = ma and k between 9 and 14) or (k > s.streak + 2 and k % 3 = 0) then
        insert into xp_events (user_id, amount, reason, created_at)
          values (s.uid, s.per_day + (k % 4) * 5, case when k % 2 = 0 then 'review' else 'lesson' end,
                  ((((now() at time zone s.tz)::date - k) + time '20:15') at time zone s.tz));
      end if;
    end loop;
    if s.today > 0 then
      insert into xp_events (user_id, amount, reason, created_at) values (s.uid, s.today, 'review', now() - interval '2 hours');
    end if;
  end loop;

  -- 7. Cartes de révision (des erreurs de leçon et de cours), dont certaines à revoir aujourd'hui.
  insert into review_cards (user_id, card_key, front, back, note, source, source_label, due_at, interval_days, ease, reps, created_by, created_at)
  select v.uid, 'demo-' || v.n, v.front, v.back, v.note, v.src, v.lbl, now() + make_interval(days => v.due), greatest(v.due, 1), 2.5, v.reps,
         case when v.src = 'class' then t end, now() - interval '20 days'
  from (values
    (lu, 1, 'Nous ___ français au travail. (parler)', 'parlons', 'Verbos en -er: nous → -ons.', 'unit', 'Unidad 1', -1, 2),
    (lu, 2, 'la cita (de trabajo)', 'le rendez-vous', null, 'class', 'Clase con Julien', 0, 1),
    (lu, 3, 'Ils ___ au restaurant. (manger)', 'mangent', 'Ils/elles → -ent (no se pronuncia).', 'unit', 'Unidad 1', 0, 3),
    (lu, 4, 'el fin de semana', 'le week-end', null, 'class', 'Clase con Julien', -2, 1),
    (lu, 5, 'J''___ de la musique. (écouter)', 'écoute', 'Je → j'' delante de vocal.', 'unit', 'Unidad 1', 3, 4),
    (lu, 6, 'la oficina', 'le bureau', null, 'class', 'Clase con Julien', 5, 2),
    (lu, 7, 'Tu ___ le cinéma ? (aimer)', 'aimes', null, 'unit', 'Unidad 1', 7, 3),
    (lu, 8, 'tener prisa', 'être pressé(e)', null, 'class', 'Clase con Julien', 9, 2),
    (ma, 1, 'Nous ___ français au travail. (parler)', 'parlons', 'Verbos en -er: nous → -ons.', 'unit', 'Unidad 1', -6, 1),
    (ma, 2, 'el trabajo', 'le travail', null, 'class', 'Clase con Julien', -5, 1),
    (ma, 3, 'Ils ___ au restaurant. (manger)', 'mangent', null, 'unit', 'Unidad 1', -4, 1),
    (ma, 4, 'presentarse', 'se présenter', null, 'class', 'Clase con Julien', -3, 1),
    (va, 1, 'la entrevista', 'l''entretien', null, 'class', 'Clase con Julien', 4, 5),
    (va, 2, 'Vous ___ où ? (habiter)', 'habitez', null, 'unit', 'Unidad 1', 6, 6),
    (di, 1, 'me llamo', 'je m''appelle', null, 'class', 'Clase con Julien', 0, 0)
  ) v(uid, n, front, back, note, src, lbl, due, reps);

  -- 8. Insignes.
  insert into user_badges (user_id, badge_id, earned_at) values
    (lu, 'primeros', now() - interval '30 days'), (lu, 'racha7', now() - interval '6 days'), (lu, 'oido', now() - interval '30 days'),
    (va, 'primeros', now() - interval '50 days'), (va, 'racha7', now() - interval '25 days'), (va, 'racha30', now() - interval '1 day'), (va, 'perfecta', now() - interval '50 days'),
    (ma, 'primeros', now() - interval '22 days')
  on conflict do nothing;

  -- 9. Tâches : l'unité 1 à faire pour Diego (avant la prochaine classe), faite par Mateo.
  insert into assignments (teacher_id, unit_id, due_on, note, created_at)
    values (t, 'a2-01', (now() + interval '2 days')::date, 'Antes de la clase del viernes.', now() - interval '2 days') returning id into th;
  insert into assignment_students (assignment_id, student_id, completed_at) values (th, di, null);
  insert into assignments (teacher_id, unit_id, due_on, note, created_at)
    values (t, 'a2-01', (now() - interval '18 days')::date, 'Para repasar el presente.', now() - interval '23 days') returning id into th;
  insert into assignment_students (assignment_id, student_id, completed_at) values (th, ma, now() - interval '20 days');

  -- 10. Fin de niveau : Valentina a fini les unités publiées, l'examen du professeur reste à valider.
  insert into level_validations (student_id, level) values (va, 'A2');

  -- 11. Une demande de changement d'horaire à valider (Lucía, prochain jeudi déplacé au vendredi).
  select c.scheduled_at into s from public._group_sessions(g_lu, now() + interval '1 day', now() + interval '10 days') c
    where extract(isodow from c.scheduled_at at time zone 'America/Lima') = 4 limit 1;
  if s.scheduled_at is not null then
    insert into schedule_changes (group_id, original_at, new_at, reason, requested_by, status, created_at)
      values (g_lu, s.scheduled_at, s.scheduled_at + interval '1 day', 'Tengo una reunión de trabajo ese día.', lu, 'pending', now() - interval '5 hours');
  end if;

  -- 12. Messagerie : Lucía (conversation réglée) et Diego (question en attente du professeur).
  insert into message_threads (student_id, created_at) values (lu, now() - interval '30 days') returning id into th;
  insert into messages (thread_id, author_kind, author_id, body) values (th, 'student', lu,
    'Hola, Julien: ¿el jueves podemos ver otra vez el passé composé? Me confundo entre être y avoir.') returning id into m;
  update messages set created_at = now() - interval '8 days 3 hours' where id = m;
  insert into messages (thread_id, author_kind, author_id, body) values (th, 'staff', t,
    '¡Claro, Lucía! El jueves empezamos por ahí. Mientras tanto, repasa las tarjetas de la unidad 1 en «Repasar».') returning id into m;
  update messages set created_at = now() - interval '8 days 1 hour' where id = m;
  insert into messages (thread_id, author_kind, author_id, body) values (th, 'student', lu,
    '¿Dónde encuentro la grabación de la clase del martes?') returning id into m;
  update messages set created_at = now() - interval '2 days 20 minutes' where id = m;
  perform set_config('pathway.assistant_reply', 'on', true);
  insert into messages (thread_id, author_kind, author_id, body, reply_to, assistant_kind) values (th, 'assistant', null,
    'La encuentras en «Mi curso», en «Tus clases grabadas». Aparece unos minutos después de que termina la clase.', m, 'answer') returning id into m;
  update messages set created_at = now() - interval '2 days 19 minutes' where id = m;
  perform set_config('pathway.assistant_reply', 'off', true);
  update message_threads set last_message_at = now() - interval '2 days 19 minutes', last_student_at = now() - interval '2 days 20 minutes',
    last_staff_at = now() - interval '8 days 1 hour', student_read_at = now() - interval '2 days', staff_read_at = now() - interval '2 days',
    needs_staff = false, needs_staff_since = null, handled_at = now() - interval '8 days 1 hour', handled_by = t,
    staff_emailed_at = now(), student_emailed_at = now()
  where id = th;

  insert into message_threads (student_id, created_at) values (di, now() - interval '5 days') returning id into th;
  insert into messages (thread_id, author_kind, author_id, body) values (th, 'student', di,
    'Hola profe, ¿qué tengo que preparar para la clase del viernes?') returning id into m;
  update messages set created_at = now() - interval '3 hours' where id = m;
  update message_threads set last_message_at = now() - interval '3 hours', last_student_at = now() - interval '3 hours',
    student_read_at = now() - interval '3 hours', needs_staff = true, needs_staff_since = now() - interval '3 hours', staff_emailed_at = now()
  where id = th;

  insert into demo_state (id, seeded_at) values (1, now()) on conflict (id) do update set seeded_at = excluded.seeded_at;
  return jsonb_build_object('ok', true, 'teacher', t, 'students', to_jsonb(studs), 'seeded_at', now());
end $$;

revoke all on function public.demo_seed() from public, anon;
grant execute on function public.demo_seed() to authenticated, service_role;

-- La dernière remise à zéro (la fonction « demo » relance demo_seed() si elle date de plus de 6 jours).
create or replace function public.demo_seeded_at() returns timestamptz
language sql stable security definer set search_path = public as $$
  select seeded_at from demo_state where id = 1
$$;
revoke all on function public.demo_seeded_at() from public, anon;
grant execute on function public.demo_seeded_at() to authenticated, service_role;
