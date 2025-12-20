-- Tabela para pedidos importados da Shopee via planilha
CREATE TABLE public.pedidos_shopee (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  
  -- Identificadores do pedido
  order_id TEXT NOT NULL,
  order_status TEXT,
  
  -- Datas
  data_pedido TIMESTAMP WITH TIME ZONE,
  data_envio TIMESTAMP WITH TIME ZONE,
  data_entrega TIMESTAMP WITH TIME ZONE,
  
  -- Comprador
  comprador_nome TEXT,
  comprador_telefone TEXT,
  
  -- Endereço
  endereco_rua TEXT,
  endereco_cidade TEXT,
  endereco_estado TEXT,
  endereco_cep TEXT,
  
  -- Produto
  sku TEXT,
  produto_nome TEXT,
  quantidade INTEGER DEFAULT 1,
  preco_unitario NUMERIC(12, 2),
  preco_total NUMERIC(12, 2),
  
  -- Frete e taxas
  frete NUMERIC(12, 2) DEFAULT 0,
  desconto NUMERIC(12, 2) DEFAULT 0,
  
  -- Controle de estoque
  baixa_estoque_realizada BOOLEAN DEFAULT FALSE,
  data_baixa_estoque TIMESTAMP WITH TIME ZONE,
  
  -- Metadados de importação
  importacao_id UUID,
  dados_originais JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint para evitar duplicatas
  CONSTRAINT pedidos_shopee_unique_order UNIQUE (organization_id, order_id, sku)
);

-- Índices para performance
CREATE INDEX idx_pedidos_shopee_org ON public.pedidos_shopee(organization_id);
CREATE INDEX idx_pedidos_shopee_order_id ON public.pedidos_shopee(order_id);
CREATE INDEX idx_pedidos_shopee_sku ON public.pedidos_shopee(sku);
CREATE INDEX idx_pedidos_shopee_data_pedido ON public.pedidos_shopee(data_pedido DESC);
CREATE INDEX idx_pedidos_shopee_baixa ON public.pedidos_shopee(baixa_estoque_realizada);

-- Tabela para histórico de importações (sem armazenar o arquivo)
CREATE TABLE public.importacoes_shopee (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  
  -- Metadados da importação
  nome_arquivo TEXT NOT NULL,
  total_linhas INTEGER DEFAULT 0,
  linhas_processadas INTEGER DEFAULT 0,
  linhas_erro INTEGER DEFAULT 0,
  pedidos_novos INTEGER DEFAULT 0,
  pedidos_duplicados INTEGER DEFAULT 0,
  baixas_realizadas INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'processando' CHECK (status IN ('processando', 'concluido', 'erro', 'concluido_com_erros')),
  erro_mensagem TEXT,
  detalhes_erros JSONB,
  
  -- Usuário
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para pedidos_shopee
ALTER TABLE public.pedidos_shopee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_shopee_org_select"
  ON public.pedidos_shopee FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "pedidos_shopee_org_insert"
  ON public.pedidos_shopee FOR INSERT
  WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "pedidos_shopee_org_update"
  ON public.pedidos_shopee FOR UPDATE
  USING (organization_id = get_current_org_id());

CREATE POLICY "pedidos_shopee_org_delete"
  ON public.pedidos_shopee FOR DELETE
  USING (organization_id = get_current_org_id());

-- RLS para importacoes_shopee
ALTER TABLE public.importacoes_shopee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "importacoes_shopee_org_select"
  ON public.importacoes_shopee FOR SELECT
  USING (organization_id = get_current_org_id());

CREATE POLICY "importacoes_shopee_org_insert"
  ON public.importacoes_shopee FOR INSERT
  WITH CHECK (organization_id = get_current_org_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pedidos_shopee_updated_at
  BEFORE UPDATE ON public.pedidos_shopee
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();