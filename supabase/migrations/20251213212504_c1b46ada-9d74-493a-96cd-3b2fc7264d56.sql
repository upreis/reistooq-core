-- Adicionar coluna is_system para marcar locais que não podem ser excluídos
ALTER TABLE locais_estoque 
ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Criar função para criar estoque padrão para nova organização
CREATE OR REPLACE FUNCTION create_default_stock_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar "Estoque Principal" para a nova organização
  INSERT INTO locais_estoque (organization_id, nome, tipo, descricao, is_system, ativo)
  VALUES (NEW.id, 'Estoque Principal', 'principal', 'Local de estoque principal da organização', true, true)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar quando nova organização for criada
DROP TRIGGER IF EXISTS create_default_stock_on_org_created ON organizacoes;
CREATE TRIGGER create_default_stock_on_org_created
  AFTER INSERT ON organizacoes
  FOR EACH ROW
  EXECUTE FUNCTION create_default_stock_location();

-- Criar "Estoque Principal" para organizações existentes que não têm
INSERT INTO locais_estoque (organization_id, nome, tipo, descricao, is_system, ativo)
SELECT o.id, 'Estoque Principal', 'principal', 'Local de estoque principal da organização', true, true
FROM organizacoes o
WHERE NOT EXISTS (
  SELECT 1 FROM locais_estoque l 
  WHERE l.organization_id = o.id 
  AND (l.nome = 'Estoque Principal' OR l.is_system = true)
);

-- Atualizar locais existentes com nome "Estoque Principal" para is_system = true
UPDATE locais_estoque 
SET is_system = true 
WHERE nome = 'Estoque Principal' AND is_system = false;

-- Criar política RLS para impedir exclusão de locais do sistema
DROP POLICY IF EXISTS "Impedir exclusão de locais do sistema" ON locais_estoque;
CREATE POLICY "Impedir exclusão de locais do sistema" ON locais_estoque
  FOR DELETE
  USING (organization_id = get_current_org_id() AND is_system = false);

-- Comentário na coluna
COMMENT ON COLUMN locais_estoque.is_system IS 'Indica se é um local do sistema que não pode ser excluído';