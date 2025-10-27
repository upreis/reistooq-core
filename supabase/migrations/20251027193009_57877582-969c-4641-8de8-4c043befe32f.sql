-- ✅ Adicionar campos para armazenar dados de TROCAS (Changes API)
ALTER TABLE reclamacoes
ADD COLUMN IF NOT EXISTS total_trocas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS troca_status TEXT,
ADD COLUMN IF NOT EXISTS troca_status_detail TEXT,
ADD COLUMN IF NOT EXISTS troca_type TEXT,
ADD COLUMN IF NOT EXISTS troca_data_criacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS troca_data_estimada_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS troca_data_estimada_fim TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS troca_return_id TEXT,
ADD COLUMN IF NOT EXISTS troca_new_orders JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS troca_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS troca_raw_data JSONB;

-- 📝 Comentários sobre os campos:
COMMENT ON COLUMN reclamacoes.total_trocas IS 'Quantidade total de trocas relacionadas ao claim';
COMMENT ON COLUMN reclamacoes.troca_status IS 'Status da troca: not_started, in_process, completed, cancelled';
COMMENT ON COLUMN reclamacoes.troca_status_detail IS 'Detalhes do status da troca';
COMMENT ON COLUMN reclamacoes.troca_type IS 'Tipo de troca: simple_change, exchange';
COMMENT ON COLUMN reclamacoes.troca_data_criacao IS 'Data de criação da troca';
COMMENT ON COLUMN reclamacoes.troca_data_estimada_inicio IS 'Data estimada de início da troca';
COMMENT ON COLUMN reclamacoes.troca_data_estimada_fim IS 'Data estimada de finalização da troca';
COMMENT ON COLUMN reclamacoes.troca_return_id IS 'ID do return relacionado à troca';
COMMENT ON COLUMN reclamacoes.troca_new_orders IS 'Array de novos pedidos criados pela troca';
COMMENT ON COLUMN reclamacoes.troca_items IS 'Array de itens envolvidos na troca';
COMMENT ON COLUMN reclamacoes.troca_raw_data IS 'Dados brutos completos da API /changes';

-- 🔄 Atualizar tem_trocas para claims que já têm changes em related_entities
UPDATE reclamacoes
SET tem_trocas = true
WHERE raw_data->'related_entities' @> '["changes"]'::jsonb
AND tem_trocas = false;