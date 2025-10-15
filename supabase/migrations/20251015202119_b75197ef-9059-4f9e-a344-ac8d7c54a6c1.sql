-- Renomear colunas de rastreamento para deixar claro o propósito de cada uma
-- status_rastreamento -> status_rastreamento_pedido (rastreamento do pedido original)
ALTER TABLE devolucoes_avancadas RENAME COLUMN status_rastreamento TO status_rastreamento_pedido;

-- ultimo_status_rastreamento -> status_rastreamento_devolucao (rastreamento da devolução)
ALTER TABLE devolucoes_avancadas RENAME COLUMN ultimo_status_rastreamento TO status_rastreamento_devolucao;