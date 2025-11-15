-- Adicionar permissão específica para AI Insights (apenas admins)
INSERT INTO app_permissions (key, name, description) 
VALUES (
  'system:ai_insights',
  'Acessar Insights da IA',
  'Permite visualizar e gerenciar insights gerados pela IA sobre comportamento dos usuários'
) ON CONFLICT (key) DO NOTHING;

-- Atualizar políticas RLS da tabela ai_insights para ser mais restritiva
-- Apenas admins podem ver e gerenciar insights
DROP POLICY IF EXISTS "Users can view insights from their organization" ON ai_insights;
DROP POLICY IF EXISTS "System can create insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can update insights in their organization" ON ai_insights;

-- Nova política: apenas admins podem ver insights
CREATE POLICY "Only admins can view AI insights"
ON ai_insights FOR SELECT
TO authenticated
USING (
  organization_id = get_current_org_id() 
  AND has_permission('system:ai_insights')
);

-- Nova política: sistema pode criar insights (edge function)
CREATE POLICY "System can create AI insights"
ON ai_insights FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_current_org_id());

-- Nova política: apenas admins podem atualizar insights
CREATE POLICY "Only admins can update AI insights"
ON ai_insights FOR UPDATE
TO authenticated
USING (
  organization_id = get_current_org_id() 
  AND has_permission('system:ai_insights')
)
WITH CHECK (
  organization_id = get_current_org_id() 
  AND has_permission('system:ai_insights')
);

-- Nova política: apenas admins podem deletar insights
CREATE POLICY "Only admins can delete AI insights"
ON ai_insights FOR DELETE
TO authenticated
USING (
  organization_id = get_current_org_id() 
  AND has_permission('system:ai_insights')
);