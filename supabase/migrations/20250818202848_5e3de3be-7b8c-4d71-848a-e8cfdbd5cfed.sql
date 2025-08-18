-- CORREÇÃO EMERGENCIAL DE SEGURANÇA - PROTEGER DADOS DOS CLIENTES
-- Resolver problemas críticos identificados pelo scanner

-- 1. BLOQUEAR acesso direto à tabela historico_vendas (dados dos clientes expostos)
DROP POLICY IF EXISTS "hv_select_org_perms" ON public.historico_vendas;

CREATE POLICY "historico_vendas_deny_all_access"
ON public.historico_vendas
FOR ALL
USING (false)
WITH CHECK (false);

-- 2. BLOQUEAR acesso direto à tabela pedidos (informações de pedidos expostas)  
DROP POLICY IF EXISTS "pedidos_select_org_perms" ON public.pedidos;

CREATE POLICY "pedidos_deny_all_access"
ON public.pedidos
FOR ALL
USING (false)
WITH CHECK (false);

-- 3. FORTALECER proteção da tabela profiles (dados pessoais dos funcionários)
DROP POLICY IF EXISTS "profiles_select_org_secure" ON public.profiles;

CREATE POLICY "profiles_select_restricted"
ON public.profiles  
FOR SELECT
USING (
  id = auth.uid() OR 
  (organizacao_id = get_current_org_id() AND has_permission('users:read'))
);

-- 4. ADICIONAR auditoria de emergência
INSERT INTO public.audit_logs (
  organization_id, user_id, action, resource_type, resource_id, new_values
) VALUES (
  gen_random_uuid(), -- temporary org id for system action
  NULL, 
  'emergency_security_lockdown', 
  'rls_policies', 
  'multiple_tables',
  '{"action": "blocked_direct_access_to_sensitive_tables", "tables": ["historico_vendas", "pedidos"], "reason": "prevent_data_theft"}'::jsonb
);

-- Log de segurança crítico
COMMENT ON POLICY "historico_vendas_deny_all_access" ON public.historico_vendas IS 
'SEGURANÇA: Acesso direto bloqueado - usar apenas get_historico_vendas_masked()';

COMMENT ON POLICY "pedidos_deny_all_access" ON public.pedidos IS 
'SEGURANÇA: Acesso direto bloqueado - usar apenas get_pedidos_masked()';