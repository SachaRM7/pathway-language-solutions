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
