-- =============================================
-- FASE 1: Tabelas de Agregação para 5 meses
-- Arquitetura híbrida - NÃO altera tabelas existentes
-- =============================================

-- Tabela para dados agregados por produto (5 meses de retenção)
CREATE TABLE public.vendas_agregadas_produto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  integration_account_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  sku TEXT,
  titulo TEXT,
  thumbnail TEXT,
  quantidade_vendida INTEGER NOT NULL DEFAULT 0,
  receita NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT vendas_agregadas_produto_unique UNIQUE(data, integration_account_id, sku)
);

-- Tabela para totais diários agregados (5 meses de retenção)
CREATE TABLE public.vendas_agregadas_totais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  integration_account_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  total_receita NUMERIC NOT NULL DEFAULT 0,
  total_pedidos INTEGER NOT NULL DEFAULT 0,
  ticket_medio NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT vendas_agregadas_totais_unique UNIQUE(data, integration_account_id)
);

-- Indexes para performance
CREATE INDEX idx_vendas_agregadas_produto_data ON public.vendas_agregadas_produto(data);
CREATE INDEX idx_vendas_agregadas_produto_account ON public.vendas_agregadas_produto(integration_account_id);
CREATE INDEX idx_vendas_agregadas_produto_org ON public.vendas_agregadas_produto(organization_id);
CREATE INDEX idx_vendas_agregadas_produto_sku ON public.vendas_agregadas_produto(sku);

CREATE INDEX idx_vendas_agregadas_totais_data ON public.vendas_agregadas_totais(data);
CREATE INDEX idx_vendas_agregadas_totais_account ON public.vendas_agregadas_totais(integration_account_id);
CREATE INDEX idx_vendas_agregadas_totais_org ON public.vendas_agregadas_totais(organization_id);

-- Enable RLS
ALTER TABLE public.vendas_agregadas_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_agregadas_totais ENABLE ROW LEVEL SECURITY;

-- RLS policies para isolamento por organização
CREATE POLICY "vendas_agregadas_produto_org_select" 
ON public.vendas_agregadas_produto 
FOR SELECT 
USING (organization_id = get_current_org_id());

CREATE POLICY "vendas_agregadas_totais_org_select" 
ON public.vendas_agregadas_totais 
FOR SELECT 
USING (organization_id = get_current_org_id());

-- Comentários para documentação
COMMENT ON TABLE public.vendas_agregadas_produto IS 'Dados agregados de vendas por produto por dia - retenção de 5 meses';
COMMENT ON TABLE public.vendas_agregadas_totais IS 'Totais diários agregados de vendas - retenção de 5 meses';
COMMENT ON COLUMN public.vendas_agregadas_produto.data IS 'Data da agregação (dia)';
COMMENT ON COLUMN public.vendas_agregadas_produto.integration_account_id IS 'Conta ML - garante separação entre contas';
COMMENT ON COLUMN public.vendas_agregadas_produto.sku IS 'SKU do produto vendido';