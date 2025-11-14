-- ✅ HABILITAR REALTIME PARA NOTIFICAÇÕES DE DEVOLUÇÕES
-- Permite que o frontend receba notificações em tempo real quando novos claims chegam

-- 1. Configurar REPLICA IDENTITY para capturar todos os dados
ALTER TABLE devolucoes_notificacoes REPLICA IDENTITY FULL;

-- 2. Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE devolucoes_notificacoes;

-- 3. Criar índice para melhorar performance de queries por organização
CREATE INDEX IF NOT EXISTS idx_devolucoes_notificacoes_org_not_read 
ON devolucoes_notificacoes(organization_id, lida) 
WHERE lida = false;