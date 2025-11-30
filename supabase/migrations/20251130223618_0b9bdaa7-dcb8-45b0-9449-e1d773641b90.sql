-- ============================================
-- 🔧 CORREÇÃO FASE A: RLS Policies
-- Remove auth.uid() IS NULL de todas policies
-- ============================================

-- CORREÇÃO ml_claims policies
DROP POLICY IF EXISTS "ml_claims_insert_validated" ON ml_claims;
CREATE POLICY "ml_claims_insert_validated"
  ON ml_claims FOR INSERT
  WITH CHECK (organization_id = get_current_org_id());

-- CORREÇÃO ml_claims_cache policies  
DROP POLICY IF EXISTS "ml_claims_cache_insert_validated" ON ml_claims_cache;
CREATE POLICY "ml_claims_cache_insert_validated"
  ON ml_claims_cache FOR INSERT
  WITH CHECK (organization_id = get_current_org_id());

-- CORREÇÃO ml_claims_sync_status policies
DROP POLICY IF EXISTS "ml_claims_sync_insert_validated" ON ml_claims_sync_status;
CREATE POLICY "ml_claims_sync_insert_validated"
  ON ml_claims_sync_status FOR INSERT
  WITH CHECK (organization_id = get_current_org_id());