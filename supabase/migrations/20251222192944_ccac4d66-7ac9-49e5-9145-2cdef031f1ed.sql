-- ✅ Política RLS para impedir UPDATE em locais do sistema (tipo 'principal' ou is_system = true)
DROP POLICY IF EXISTS "Impedir edição de locais do sistema" ON locais_estoque;
CREATE POLICY "Impedir edição de locais do sistema" ON locais_estoque
  FOR UPDATE
  USING (
    organization_id = get_current_org_id() 
    AND (
      -- Permite update apenas se NÃO for local do sistema
      is_system = false 
      AND tipo != 'principal'
    )
  );

-- Garantir que todos os locais 'principal' tenham is_system = true
UPDATE locais_estoque 
SET is_system = true 
WHERE tipo = 'principal' AND (is_system = false OR is_system IS NULL);

-- Comentário explicativo
COMMENT ON POLICY "Impedir edição de locais do sistema" ON locais_estoque IS 'Impede edição de locais do sistema (is_system=true ou tipo=principal)';