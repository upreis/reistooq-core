-- Criar tabela para cotações internacionais
CREATE TABLE public.cotacoes_internacionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cotacao VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  pais_origem VARCHAR(100) NOT NULL DEFAULT 'China',
  moeda_origem VARCHAR(10) NOT NULL DEFAULT 'CNY',
  fator_multiplicador DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fechamento DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
  observacoes TEXT,
  
  -- Produtos da cotação (armazenados como JSON)
  produtos JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Totais calculados
  total_peso_kg DECIMAL(10,3) DEFAULT 0,
  total_cbm DECIMAL(10,6) DEFAULT 0,
  total_quantidade INTEGER DEFAULT 0,
  total_valor_origem DECIMAL(15,2) DEFAULT 0,
  total_valor_usd DECIMAL(15,2) DEFAULT 0,
  total_valor_brl DECIMAL(15,2) DEFAULT 0,
  
  -- Auditoria
  organization_id UUID NOT NULL DEFAULT get_current_org_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  updated_by UUID NOT NULL DEFAULT auth.uid()
);

-- Habilitar RLS
ALTER TABLE public.cotacoes_internacionais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Cotações internacionais visíveis por organização" 
ON public.cotacoes_internacionais 
FOR ALL 
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Índices para performance
CREATE INDEX idx_cotacoes_internacionais_org ON public.cotacoes_internacionais(organization_id);
CREATE INDEX idx_cotacoes_internacionais_status ON public.cotacoes_internacionais(status);
CREATE INDEX idx_cotacoes_internacionais_data ON public.cotacoes_internacionais(data_abertura);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cotacoes_internacionais_updated_at
  BEFORE UPDATE ON public.cotacoes_internacionais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();