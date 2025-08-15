-- Vincular produtos existentes sem organization_id à organização do usuário atual
UPDATE produtos 
SET organization_id = (
  SELECT organizacao_id 
  FROM profiles 
  WHERE id = auth.uid()
) 
WHERE organization_id IS NULL 
  AND (sku_interno LIKE 'CMD-%' OR sku_interno LIKE 'FL-%');