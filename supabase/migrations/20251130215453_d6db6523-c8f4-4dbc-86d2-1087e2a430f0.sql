-- =====================================================
-- FASE B: CORREÇÃO ML_SYNC_STATUS (já existe)
-- Adicionar apenas o que falta
-- =====================================================

-- Adicionar index se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ml_sync_status_last_sync'
  ) THEN
    CREATE INDEX idx_ml_sync_status_last_sync 
    ON public.ml_sync_status(last_sync_at DESC);
  END IF;
END $$;

-- Adicionar policy de SELECT se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ml_sync_status' 
    AND policyname = 'ml_sync_status_select_org'
  ) THEN
    CREATE POLICY ml_sync_status_select_org 
    ON public.ml_sync_status 
    FOR SELECT 
    USING (organization_id = get_current_org_id());
  END IF;
END $$;

-- Adicionar policy de sistema se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ml_sync_status' 
    AND policyname = 'ml_sync_status_system_manage'
  ) THEN
    CREATE POLICY ml_sync_status_system_manage 
    ON public.ml_sync_status 
    FOR ALL
    USING (current_setting('role', true) = 'service_role')
    WITH CHECK (current_setting('role', true) = 'service_role');
  END IF;
END $$;