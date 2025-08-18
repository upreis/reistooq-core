-- Criar função RPC mascarada para pedidos (necessária após bloqueio de acesso direto)
CREATE OR REPLACE FUNCTION public.get_pedidos_masked(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS SETOF pedidos
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.*
  FROM public.pedidos p
  JOIN public.integration_accounts ia ON ia.id = p.integration_account_id
  WHERE ia.organization_id = public.get_current_org_id()
    AND public.has_permission('orders:read')
    AND (_start IS NULL OR p.data_pedido >= _start)
    AND (_end   IS NULL OR p.data_pedido <= _end)
    AND (_search IS NULL OR p.nome_cliente ILIKE '%'||_search||'%' OR p.numero ILIKE '%'||_search||'%')
  ORDER BY p.data_pedido DESC, p.created_at DESC
  LIMIT COALESCE(_limit,100) OFFSET COALESCE(_offset,0);
$function$;

-- Garantir que todas as funções mascaradas existam e funcionem
CREATE OR REPLACE FUNCTION public.get_historico_vendas_safe(
  _start date DEFAULT NULL,
  _end date DEFAULT NULL,
  _search text DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, id_unico text, numero_pedido text, sku_produto text, descricao text,
  quantidade integer, valor_unitario numeric, valor_total numeric, cliente_nome text,
  cliente_documento text, status text, observacoes text, data_pedido date,
  created_at timestamp with time zone, updated_at timestamp with time zone,
  ncm text, codigo_barras text, pedido_id text, cpf_cnpj text, valor_frete numeric,
  data_prevista date, obs text, obs_interna text, cidade text, uf text,
  url_rastreamento text, situacao text, codigo_rastreamento text, numero_ecommerce text,
  valor_desconto numeric, numero_venda text, sku_estoque text, sku_kit text,
  qtd_kit integer, total_itens integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Use the existing secure RPC that already handles organization filtering and PII masking
  SELECT * FROM public.get_historico_vendas_masked(_start, _end, _search, _limit, _offset);
$function$;