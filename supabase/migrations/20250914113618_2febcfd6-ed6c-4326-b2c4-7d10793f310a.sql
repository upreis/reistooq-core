-- 1. Limpar dados incompletos para um novo começo
TRUNCATE TABLE devolucoes_avancadas RESTART IDENTITY;

-- 2. Migrar TODOS os 602 registros da tabela que já funciona
INSERT INTO devolucoes_avancadas (
  order_id,
  data_criacao,
  ultima_atualizacao,
  status_devolucao,
  dados_order,
  integration_account_id,
  processado_em
)
SELECT 
  order_id,
  created_at,
  updated_at,
  status,
  order_data,
  integration_account_id,
  NOW()
FROM ml_orders_completas;

-- 3. Verificar o resultado da migração
SELECT 
  COUNT(*) as total_migrado,
  COUNT(CASE WHEN status_devolucao = 'cancelled' THEN 1 END) as total_canceladas
FROM devolucoes_avancadas;