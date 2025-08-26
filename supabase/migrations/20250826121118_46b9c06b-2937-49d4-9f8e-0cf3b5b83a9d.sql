-- Backfill integration_account_id in historico_vendas using pedidos.numero
UPDATE public.historico_vendas hv
SET integration_account_id = p.integration_account_id
FROM public.pedidos p
WHERE hv.integration_account_id IS NULL
  AND p.numero = hv.numero_pedido;

-- Optional: index to speed future lookups
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON public.pedidos (numero);
