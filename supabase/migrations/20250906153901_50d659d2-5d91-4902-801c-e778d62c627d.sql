-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  data_primeiro_pedido DATE,
  data_ultimo_pedido DATE,
  total_pedidos INTEGER DEFAULT 0,
  valor_total_gasto NUMERIC(15,2) DEFAULT 0,
  ticket_medio NUMERIC(15,2) DEFAULT 0,
  status_cliente TEXT DEFAULT 'Regular' CHECK (status_cliente IN ('Regular', 'VIP', 'Premium', 'Inativo')),
  observacoes TEXT,
  empresa TEXT,
  integration_account_id UUID,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Constraints únicos condicionais
CREATE UNIQUE INDEX idx_clientes_unique_cpf_org 
  ON public.clientes(cpf_cnpj, organization_id) 
  WHERE cpf_cnpj IS NOT NULL;

CREATE UNIQUE INDEX idx_clientes_unique_email_org 
  ON public.clientes(email, organization_id) 
  WHERE email IS NOT NULL;

-- Índices para performance
CREATE INDEX idx_clientes_organization_id ON public.clientes(organization_id);
CREATE INDEX idx_clientes_cpf_cnpj ON public.clientes(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;
CREATE INDEX idx_clientes_email ON public.clientes(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clientes_nome ON public.clientes(nome_completo);

-- Trigger para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sync_control_updated_at();

-- RLS Policies
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_org_select" ON public.clientes
  FOR SELECT USING (organization_id = public.get_current_org_id());

CREATE POLICY "clientes_org_insert" ON public.clientes
  FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

CREATE POLICY "clientes_org_update" ON public.clientes
  FOR UPDATE USING (organization_id = public.get_current_org_id());

CREATE POLICY "clientes_org_delete" ON public.clientes
  FOR DELETE USING (organization_id = public.get_current_org_id());

-- Função para sincronizar clientes dos pedidos
CREATE OR REPLACE FUNCTION public.sync_cliente_from_pedido(
  p_nome_cliente TEXT,
  p_cpf_cnpj TEXT DEFAULT NULL,
  p_cidade TEXT DEFAULT NULL,
  p_uf TEXT DEFAULT NULL,
  p_empresa TEXT DEFAULT NULL,
  p_integration_account_id UUID DEFAULT NULL,
  p_data_pedido DATE DEFAULT NULL,
  p_valor_pedido NUMERIC DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_cliente_id UUID;
  v_org_id UUID;
  v_existing_cliente RECORD;
BEGIN
  v_org_id := public.get_current_org_id();
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organização não encontrada';
  END IF;
  
  IF p_nome_cliente IS NULL OR trim(p_nome_cliente) = '' THEN
    RAISE EXCEPTION 'Nome do cliente é obrigatório';
  END IF;
  
  -- Buscar cliente existente (por CPF/CNPJ primeiro, depois por nome)
  IF p_cpf_cnpj IS NOT NULL AND trim(p_cpf_cnpj) != '' THEN
    SELECT * INTO v_existing_cliente
    FROM public.clientes
    WHERE cpf_cnpj = p_cpf_cnpj 
      AND organization_id = v_org_id
    LIMIT 1;
  END IF;
  
  -- Se não encontrou por CPF/CNPJ, buscar por nome
  IF v_existing_cliente IS NULL THEN
    SELECT * INTO v_existing_cliente
    FROM public.clientes
    WHERE LOWER(nome_completo) = LOWER(trim(p_nome_cliente))
      AND organization_id = v_org_id
    LIMIT 1;
  END IF;
  
  IF v_existing_cliente IS NOT NULL THEN
    -- Atualizar cliente existente
    UPDATE public.clientes SET
      nome_completo = COALESCE(NULLIF(trim(p_nome_cliente), ''), nome_completo),
      cpf_cnpj = COALESCE(NULLIF(trim(p_cpf_cnpj), ''), cpf_cnpj),
      endereco_cidade = COALESCE(NULLIF(trim(p_cidade), ''), endereco_cidade),
      endereco_uf = COALESCE(NULLIF(trim(p_uf), ''), endereco_uf),
      empresa = COALESCE(NULLIF(trim(p_empresa), ''), empresa),
      data_ultimo_pedido = GREATEST(COALESCE(data_ultimo_pedido, p_data_pedido), p_data_pedido),
      total_pedidos = total_pedidos + 1,
      valor_total_gasto = valor_total_gasto + COALESCE(p_valor_pedido, 0),
      ticket_medio = (valor_total_gasto + COALESCE(p_valor_pedido, 0)) / (total_pedidos + 1),
      updated_at = now()
    WHERE id = v_existing_cliente.id
    RETURNING id INTO v_cliente_id;
  ELSE
    -- Criar novo cliente
    INSERT INTO public.clientes (
      nome_completo,
      cpf_cnpj,
      endereco_cidade,
      endereco_uf,
      empresa,
      data_primeiro_pedido,
      data_ultimo_pedido,
      total_pedidos,
      valor_total_gasto,
      ticket_medio,
      integration_account_id,
      organization_id
    ) VALUES (
      trim(p_nome_cliente),
      NULLIF(trim(p_cpf_cnpj), ''),
      NULLIF(trim(p_cidade), ''),
      NULLIF(trim(p_uf), ''),
      NULLIF(trim(p_empresa), ''),
      COALESCE(p_data_pedido, CURRENT_DATE),
      COALESCE(p_data_pedido, CURRENT_DATE),
      1,
      COALESCE(p_valor_pedido, 0),
      COALESCE(p_valor_pedido, 0),
      p_integration_account_id,
      v_org_id
    ) RETURNING id INTO v_cliente_id;
  END IF;
  
  RETURN v_cliente_id;
END;
$$;