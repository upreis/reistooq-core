
-- Fix views to use SECURITY INVOKER instead of SECURITY DEFINER

-- 1. Recreate clientes_secure view with SECURITY INVOKER
DROP VIEW IF EXISTS public.clientes_secure;
CREATE VIEW public.clientes_secure 
WITH (security_invoker = true)
AS
SELECT 
  id,
  organization_id,
  mask_name(nome_completo) AS nome,
  mask_cpf_cnpj(cpf_cnpj) AS cpf_cnpj,
  mask_email(email) AS email,
  mask_phone(telefone) AS telefone,
  created_at
FROM clientes
WHERE organization_id = (SELECT profiles.organizacao_id FROM profiles WHERE profiles.id = auth.uid());

-- 2. Recreate profiles_safe view with SECURITY INVOKER  
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  organizacao_id,
  CASE
    WHEN (telefone IS NULL) OR (length(telefone) < 4) THEN telefone
    ELSE '****' || right(telefone, 4)
  END AS telefone,
  created_at,
  updated_at
FROM profiles
WHERE organizacao_id = (SELECT profiles_1.organizacao_id FROM profiles profiles_1 WHERE profiles_1.id = auth.uid());

-- 3. Recreate devolucoes_sync_stats view with SECURITY INVOKER
DROP VIEW IF EXISTS public.devolucoes_sync_stats;
CREATE VIEW public.devolucoes_sync_stats
WITH (security_invoker = true)
AS
SELECT 
  dss.integration_account_id,
  ia.name AS account_name,
  ia.organization_id,
  dss.sync_type,
  dss.last_sync_at,
  dss.last_sync_status,
  dss.items_synced,
  dss.items_failed,
  dss.items_total,
  dss.duration_ms,
  dss.error_message,
  CASE
    WHEN dss.last_sync_at IS NULL THEN 'Nunca sincronizado'
    WHEN dss.last_sync_status = 'in_progress' THEN 'Sincronizando...'
    WHEN dss.last_sync_at < (now() - '01:00:00'::interval) THEN 'Desatualizado'
    ELSE 'Atualizado'
  END AS sync_health,
  (EXTRACT(epoch FROM (now() - dss.last_sync_at)) / 60) AS minutes_since_sync
FROM devolucoes_sync_status dss
JOIN integration_accounts ia ON ia.id = dss.integration_account_id
ORDER BY dss.last_sync_at DESC NULLS LAST;
