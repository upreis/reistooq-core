-- Remover registros duplicados/incorretos da organização
DELETE FROM locais_estoque 
WHERE id IN (
  'b10b0903-c7e1-4c25-9c00-99be9b9c3300',  -- Estoque Principal duplicado
  'ed5be7ec-933c-4e75-8215-bb2366f46b28'   -- Galpão incorreto
);

-- Criar índice único para evitar duplicatas futuras de tipo 'principal' por organização
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_principal_per_org 
ON locais_estoque (organization_id) 
WHERE tipo = 'principal';