-- Atualizar todos os produtos sem organization_id para a primeira organização disponível
-- Isso vai associar os produtos órfãos a uma organização para que apareçam no frontend

UPDATE produtos 
SET organization_id = (
  SELECT id 
  FROM organizacoes 
  LIMIT 1
)
WHERE organization_id IS NULL AND ativo = true;