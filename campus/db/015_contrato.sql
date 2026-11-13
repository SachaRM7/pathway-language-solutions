-- Campus Pathway · 015 · contrat d'engagement de l'élève
-- À exécuter après 014 (SQL Editor → New query → Run). Rien ne change pour les élèves tant que
-- l'admin n'a pas activé la signature dans « Ajustes » → « Contrato del alumno ».
--
-- • L'élève signe le contrat à la fin de l'onboarding (ou à sa prochaine connexion s'il était déjà
--   inscrit) : il coche les règles clés, écrit son nom et signe au doigt ou à la souris.
-- • Chaque signature garde le texte exact signé, la signature, la date, l'adresse IP et le
--   navigateur : c'est la preuve en cas d'exclusion. Si le texte change (règles modifiées dans
--   « Ajustes » ou nouvelle version), l'élève signe à nouveau la nouvelle version.

begin;

insert into public.campus_settings (key, value) values
  ('contract', '{"enabled": false, "max_absences": 3, "lates_per_absence": 3}')
on conflict (key) do nothing;

-- Les réglages modifiables par l'admin : on ajoute « contract » (remplace celle du 013).
create or replace function public.set_campus_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v jsonb := p_value;
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  if p_key not in ('attendance', 'reminder', 'contract') then raise exception 'unknown setting'; end if;
  -- Les présences ne comptent qu'à partir de leur activation : rien n'est reproché pour avant.
  if p_key = 'attendance' and (v->>'enabled')::boolean and not coalesce((public._setting('attendance')->>'enabled')::boolean, false) then
    v := v || jsonb_build_object('since', now());
  end if;
  update campus_settings set value = public._setting(p_key) || v, updated_at = now() where key = p_key;
end $$;

create table public.contract_signatures (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  body_sha256 text not null,
  signed_name text not null,
  signature text not null,
  signed_at timestamptz not null default now(),
  ip text,
  user_agent text
);
create index contract_signatures_student on public.contract_signatures (student_id, signed_at desc);
alter table public.contract_signatures enable row level security;
-- Lecture seule : une signature ne se modifie ni ne s'efface depuis le Campus.
revoke all on public.contract_signatures from anon, authenticated;
grant select on public.contract_signatures to authenticated;
create policy "contract_signatures: les siennes ou celles de ses élèves" on public.contract_signatures for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- Pour l'élève (et l'aperçu des profs) : les règles du contrat et sa dernière signature.
create function public.contract_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'contract', public._setting('contract'),
    'attendance', (select jsonb_build_object('open_min', a->'open_min', 'absent_after_min', a->'absent_after_min', 'late_after_min', a->'late_after_min')
                   from (select public._setting('attendance') a) x),
    'signed', (select jsonb_build_object('body', body, 'signed_name', signed_name, 'signature', signature, 'signed_at', signed_at)
               from contract_signatures where student_id = auth.uid() order by signed_at desc limit 1))
  where auth.uid() is not null
$$;

-- Signature par l'élève lui-même. L'IP et le navigateur viennent de la requête.
create function public.sign_contract(p_body text, p_name text, p_signature text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare h jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb); t timestamptz;
begin
  if auth.uid() is null or public.my_role() <> 'student' then raise exception 'students only'; end if;
  if length(coalesce(p_body, '')) < 200 or length(p_body) > 40000 then raise exception 'invalid contract'; end if;
  if length(trim(coalesce(p_name, ''))) < 3 or length(p_name) > 160 then raise exception 'invalid name'; end if;
  if p_signature !~ '^M[0-9 .MLQ,-]+$' or length(p_signature) > 60000 then raise exception 'invalid signature'; end if;
  insert into contract_signatures (student_id, body, body_sha256, signed_name, signature, ip, user_agent)
  values (auth.uid(), p_body, encode(sha256(convert_to(p_body, 'UTF8')), 'hex'), trim(p_name), p_signature,
          nullif(split_part(coalesce(h->>'cf-connecting-ip', h->>'x-forwarded-for', h->>'x-real-ip', ''), ',', 1), ''),
          left(h->>'user-agent', 300))
  returning signed_at into t;
  return t;
end $$;

-- Pour les profs et l'admin : la dernière signature de chacun de leurs élèves.
create function public.staff_contracts() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(student_id, jsonb_build_object('signed_at', signed_at, 'body_sha256', body_sha256)), '{}'::jsonb)
  from (select distinct on (student_id) student_id, signed_at, body_sha256 from contract_signatures
        where public.teaches(student_id) order by student_id, signed_at desc) x
$$;
create function public.staff_contract(p_student uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('body', body, 'signed_name', signed_name, 'signature', signature, 'signed_at', signed_at, 'ip', ip, 'user_agent', user_agent)
  from contract_signatures where student_id = p_student and public.teaches(p_student)
  order by signed_at desc limit 1
$$;

revoke execute on function public.contract_status(), public.sign_contract(text, text, text), public.staff_contracts(), public.staff_contract(uuid) from public, anon;
grant execute on function public.contract_status(), public.sign_contract(text, text, text), public.staff_contracts(), public.staff_contract(uuid) to authenticated;

commit;
