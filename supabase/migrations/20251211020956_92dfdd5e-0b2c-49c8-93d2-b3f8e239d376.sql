-- Adicionar índice para otimizar queries por data
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_realtime_date_created 
ON vendas_hoje_realtime(date_created DESC);

-- Adicionar índice composto para filtros comuns
CREATE INDEX IF NOT EXISTS idx_vendas_hoje_realtime_account_date 
ON vendas_hoje_realtime(account_name, date_created DESC);

-- Função para limpar vendas antigas (mais de 60 dias)
CREATE OR REPLACE FUNCTION cleanup_vendas_antigas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM vendas_hoje_realtime
  WHERE date_created < NOW() - INTERVAL '60 days';
  
  RAISE NOTICE 'Cleanup concluído: vendas com mais de 60 dias removidas';
END;
$$;

-- Agendar cleanup diário via pg_cron (executa às 3:00 AM)
SELECT cron.schedule(
  'cleanup-vendas-antigas-daily',
  '0 3 * * *',
  $$SELECT cleanup_vendas_antigas()$$
);