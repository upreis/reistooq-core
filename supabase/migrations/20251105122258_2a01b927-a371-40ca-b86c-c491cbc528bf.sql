-- Atualizar produtos existentes sem organization_id para associá-los à organização do usuário
UPDATE produtos 
SET organization_id = (
  SELECT organizacao_id FROM profiles WHERE id = auth.uid() LIMIT 1
)
WHERE organization_id IS NULL;

-- Criar ou atualizar trigger para garantir organization_id em produtos
DROP TRIGGER IF EXISTS set_produto_organization ON produtos;

CREATE TRIGGER set_produto_organization
  BEFORE INSERT ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION set_produtos_organization();