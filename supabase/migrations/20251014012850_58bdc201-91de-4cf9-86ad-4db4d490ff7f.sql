-- ✅ ADICIONAR 17 NOVAS COLUNAS DE STATUS DE DEVOLUÇÃO
-- Conforme solicitado no PDF de análise

ALTER TABLE devolucoes_avancadas
  ADD COLUMN IF NOT EXISTS status_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS status_dinheiro TEXT,
  ADD COLUMN IF NOT EXISTS subtipo_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS data_criacao_devolucao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_atualizacao_devolucao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_fechamento_devolucao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reembolso_quando TEXT,
  ADD COLUMN IF NOT EXISTS shipment_id_devolucao BIGINT,
  ADD COLUMN IF NOT EXISTS status_envio_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS codigo_rastreamento_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS tipo_envio_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS destino_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS endereco_destino_devolucao TEXT,
  ADD COLUMN IF NOT EXISTS timeline_rastreamento TEXT,
  ADD COLUMN IF NOT EXISTS ultimo_status_rastreamento TEXT,
  ADD COLUMN IF NOT EXISTS data_ultimo_status TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS descricao_ultimo_status TEXT;

-- Comentários explicativos das novas colunas
COMMENT ON COLUMN devolucoes_avancadas.status_devolucao IS 'Status atual da devolução (pending, in_transit, delivered, etc)';
COMMENT ON COLUMN devolucoes_avancadas.status_dinheiro IS 'Status do dinheiro da devolução (refunded, held, pending)';
COMMENT ON COLUMN devolucoes_avancadas.subtipo_devolucao IS 'Subtipo da devolução';
COMMENT ON COLUMN devolucoes_avancadas.data_criacao_devolucao IS 'Data de criação do processo de devolução';
COMMENT ON COLUMN devolucoes_avancadas.data_atualizacao_devolucao IS 'Data da última atualização da devolução';
COMMENT ON COLUMN devolucoes_avancadas.data_fechamento_devolucao IS 'Data de fechamento da devolução';
COMMENT ON COLUMN devolucoes_avancadas.reembolso_quando IS 'Quando o reembolso será processado';
COMMENT ON COLUMN devolucoes_avancadas.shipment_id_devolucao IS 'ID do envio da devolução';
COMMENT ON COLUMN devolucoes_avancadas.status_envio_devolucao IS 'Status do envio da devolução';
COMMENT ON COLUMN devolucoes_avancadas.codigo_rastreamento_devolucao IS 'Código de rastreamento da devolução';
COMMENT ON COLUMN devolucoes_avancadas.tipo_envio_devolucao IS 'Tipo de envio da devolução';
COMMENT ON COLUMN devolucoes_avancadas.destino_devolucao IS 'Destino da devolução';
COMMENT ON COLUMN devolucoes_avancadas.endereco_destino_devolucao IS 'Endereço completo do destino';
COMMENT ON COLUMN devolucoes_avancadas.timeline_rastreamento IS 'Timeline completo do rastreamento (JSON)';
COMMENT ON COLUMN devolucoes_avancadas.ultimo_status_rastreamento IS 'Último status registrado no rastreamento';
COMMENT ON COLUMN devolucoes_avancadas.data_ultimo_status IS 'Data do último status de rastreamento';
COMMENT ON COLUMN devolucoes_avancadas.descricao_ultimo_status IS 'Descrição detalhada do último status';