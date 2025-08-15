-- Create table historico_vendas based on the columns from the orders page
CREATE TABLE IF NOT EXISTS public.historico_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_unico TEXT NOT NULL,
  numero_pedido TEXT NOT NULL,
  data_pedido DATE NOT NULL,
  sku_pedido TEXT NOT NULL,
  descricao TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  uf TEXT,
  cidade TEXT,
  situacao TEXT NOT NULL DEFAULT 'Entregue',
  numero_venda TEXT,
  sku_estoque TEXT, -- SKU mapeado para estoque
  sku_kit TEXT, -- SKU KIT mapeado
  qtd_kit INTEGER DEFAULT 0,
  total_itens INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'concluida',
  cliente_nome TEXT,
  cliente_documento TEXT,
  cpf_cnpj TEXT,
  observacoes TEXT,
  integration_account_id UUID REFERENCES public.integration_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_vendas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization-based access
CREATE POLICY "historico_vendas: select by org" 
ON public.historico_vendas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.integration_accounts ia 
    WHERE ia.id = historico_vendas.integration_account_id 
    AND ia.organization_id = public.get_current_org_id()
  )
);

CREATE POLICY "historico_vendas: insert by org" 
ON public.historico_vendas 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.integration_accounts ia 
    WHERE ia.id = historico_vendas.integration_account_id 
    AND ia.organization_id = public.get_current_org_id()
  )
);

CREATE POLICY "historico_vendas: update by org" 
ON public.historico_vendas 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.integration_accounts ia 
    WHERE ia.id = historico_vendas.integration_account_id 
    AND ia.organization_id = public.get_current_org_id()
  )
);

CREATE POLICY "historico_vendas: delete by org" 
ON public.historico_vendas 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.integration_accounts ia 
    WHERE ia.id = historico_vendas.integration_account_id 
    AND ia.organization_id = public.get_current_org_id()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_historico_vendas_data_pedido ON public.historico_vendas(data_pedido);
CREATE INDEX idx_historico_vendas_numero_pedido ON public.historico_vendas(numero_pedido);
CREATE INDEX idx_historico_vendas_sku_pedido ON public.historico_vendas(sku_pedido);
CREATE INDEX idx_historico_vendas_integration_account ON public.historico_vendas(integration_account_id);
CREATE INDEX idx_historico_vendas_status ON public.historico_vendas(status);
CREATE INDEX idx_historico_vendas_situacao ON public.historico_vendas(situacao);

-- Add trigger for updated_at
CREATE TRIGGER update_historico_vendas_updated_at
  BEFORE UPDATE ON public.historico_vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.historico_vendas (
  id_unico, numero_pedido, data_pedido, sku_pedido, descricao, quantidade, 
  valor_unitario, valor_total, uf, cidade, situacao, numero_venda, 
  sku_estoque, sku_kit, qtd_kit, total_itens, status, cliente_nome, 
  cliente_documento, integration_account_id
) VALUES
  ('FL-85-MAR-1-SV', '#2790', '2025-07-08', 'FL-85-MAR-1', 'Flanela 85g Azul Marinho', 4, 15.99, 63.96, 'RJ', 'Rio de Janeiro', 'Entregue', '258789KDM41N4', 'FL-85-MAR-1', NULL, 0, 4, 'concluida', 'João Silva', '123.456.789-01', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-779-BEGE-1-SV', '#2813', '2025-07-08', 'CMD-779-BEGE-1', 'Camiseta 77% Poliester Bege', 2, 19.99, 39.98, 'AM', 'Manaus', 'Entregue', '258789M6BV56Q', 'CMD-779-BEGE-1', 'CMD-779-BEGE-1', 1, 2, 'concluida', 'Maria Santos', '987.654.321-02', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-991-BRAN-1-SV', '#2793', '2025-07-08', 'CMD-991-BRAN-1', 'Camiseta 99% Algodão Branca', 1, 34.00, 34.00, 'SP', 'São Paulo', 'Entregue', '258789KJM6N5B', 'CMD-991-BRAN-1', 'CMD-991-BRAN-1', 1, 1, 'concluida', 'Pedro Costa', '456.789.123-03', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('CMD-413-SORT-3-SV', '#2810', '2025-07-08', 'CMD-413-SORT-3', 'Camiseta 41% Poliester Sortida', 1, 24.39, 24.39, 'SP', 'Campinas', 'Entregue', '258789N3X917A3', 'CMD-413-SORT-3', 'CMD-413-SORT-1', 3, 3, 'concluida', 'Ana Oliveira', '789.123.456-04', (SELECT id FROM public.integration_accounts LIMIT 1)),
  ('FL-85-MAR-1-SV', '#2788', '2025-07-08', 'FL-85-MAR-1', 'Flanela 85g Azul Marinho', 2, 15.99, 31.98, 'SP', 'Santos', 'Entregue', '258783JHNABRF', 'FL-85-MAR-1', NULL, 0, 2, 'concluida', 'Carlos Ferreira', '321.654.987-05', (SELECT id FROM public.integration_accounts LIMIT 1));