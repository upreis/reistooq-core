-- Create secure admin profile update function
create or replace function public.admin_update_profile(
  _user_id uuid,
  _updates jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated public.profiles;
begin
  -- Ensure caller has appropriate permission
  if not has_permission('settings:manage') then
    raise exception 'Permission denied';
  end if;

  update public.profiles p
  set 
    nome_completo = coalesce(_updates->>'nome_completo', p.nome_completo),
    nome_exibicao = coalesce(_updates->>'nome_exibicao', p.nome_exibicao),
    telefone = coalesce(_updates->>'telefone', p.telefone),
    cargo = coalesce(_updates->>'cargo', p.cargo),
    departamento = coalesce(_updates->>'departamento', p.departamento),
    avatar_url = coalesce(_updates->>'avatar_url', p.avatar_url),
    configuracoes_notificacao = coalesce((_updates->'configuracoes_notificacao')::jsonb, p.configuracoes_notificacao)
  where p.id = _user_id
  returning p.* into _updated;

  return _updated;
end;
$$;

-- Lock down and grant execute to authenticated users
revoke all on function public.admin_update_profile(uuid, jsonb) from public;
grant execute on function public.admin_update_profile(uuid, jsonb) to authenticated;