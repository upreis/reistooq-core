-- Adicionar novos campos na tabela oms_customers para o formulário completo

ALTER TABLE public.oms_customers
ADD COLUMN IF NOT EXISTS fantasia TEXT,
ADD COLUMN IF NOT EXISTS codigo TEXT,
ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'PJ' CHECK (tipo_pessoa IN ('PF', 'PJ')),
ADD COLUMN IF NOT EXISTS contribuinte TEXT DEFAULT '9',
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT,
ADD COLUMN IF NOT EXISTS tipo_contato TEXT[] DEFAULT ARRAY['cliente'],
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT,
ADD COLUMN IF NOT EXISTS possui_endereco_cobranca BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cobranca_cep TEXT,
ADD COLUMN IF NOT EXISTS cobranca_cidade TEXT,
ADD COLUMN IF NOT EXISTS cobranca_uf TEXT,
ADD COLUMN IF NOT EXISTS cobranca_rua TEXT,
ADD COLUMN IF NOT EXISTS cobranca_numero TEXT,
ADD COLUMN IF NOT EXISTS cobranca_bairro TEXT,
ADD COLUMN IF NOT EXISTS cobranca_complemento TEXT,
ADD COLUMN IF NOT EXISTS telefone_adicional TEXT,
ADD COLUMN IF NOT EXISTS celular TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS email_nfe TEXT,
ADD COLUMN IF NOT EXISTS observacoes_contato TEXT;

-- Criar tabela para pessoas de contato
CREATE TABLE IF NOT EXISTS public.oms_customer_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.oms_customers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizacoes(id),
  nome TEXT NOT NULL,
  setor TEXT,
  email TEXT,
  telefone TEXT,
  ramal TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de contatos
ALTER TABLE public.oms_customer_contacts ENABLE ROW LEVEL SECURITY;

-- Política de RLS para contatos
CREATE POLICY "oms_customer_contacts_org_policy" ON public.oms_customer_contacts
  FOR ALL
  USING (organization_id = get_current_org_id())
  WITH CHECK (organization_id = get_current_org_id());