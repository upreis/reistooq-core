
-- 🔧 CORREÇÃO FASE B.2: Corrigir RLS policies conflitantes em ml_sync_status

-- Remover policies antigas conflitantes
DROP POLICY IF EXISTS "Users can read sync status for their org" ON ml_sync_status;
DROP POLICY IF EXISTS "System can manage sync status" ON ml_sync_status;

-- Criar policies corrigidas e consolidadas
CREATE POLICY "Users can read sync status for their org"
ON ml_sync_status FOR SELECT
TO authenticated
USING (
  integration_account_id IN (
    SELECT ia.id 
    FROM integration_accounts ia
    WHERE ia.organization_id = (SELECT get_current_org_id())
  )
);

CREATE POLICY "Service role can manage sync status"
ON ml_sync_status FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
