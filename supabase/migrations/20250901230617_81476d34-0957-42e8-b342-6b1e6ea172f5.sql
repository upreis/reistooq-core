-- ===========================================
-- TABELA LOGISTIC_EVENTS (Calendário Logístico)
-- ===========================================

CREATE TABLE public.logistic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('delivery', 'pickup', 'transport', 'deadline', 'meeting', 'maintenance')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'delayed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Data e horário
  event_date DATE NOT NULL,
  event_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Localização e logística
  location TEXT,
  customer_name TEXT,
  tracking_code TEXT,
  transport_company TEXT,
  
  -- Conectividade com sistema principal
  related_pedido_id TEXT, -- Referência para pedidos
  related_produto_id UUID, -- Referência para produtos
  integration_account_id UUID REFERENCES public.integration_accounts(id),
  
  -- Notificações
  notification_days_before INTEGER DEFAULT 1,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  organization_id UUID NOT NULL DEFAULT public.get_current_org_id(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.logistic_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para eventos logísticos
CREATE POLICY "logistic_events_org_select" ON public.logistic_events
  FOR SELECT USING (organization_id = public.get_current_org_id());

CREATE POLICY "logistic_events_org_insert" ON public.logistic_events
  FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

CREATE POLICY "logistic_events_org_update" ON public.logistic_events
  FOR UPDATE USING (organization_id = public.get_current_org_id());

CREATE POLICY "logistic_events_org_delete" ON public.logistic_events
  FOR DELETE USING (organization_id = public.get_current_org_id());

-- ===========================================
-- TABELA NOTES (Sistema de Notas)
-- ===========================================

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  
  -- Organização visual
  color TEXT NOT NULL DEFAULT 'amarelo' CHECK (color IN ('amarelo', 'azul', 'rosa', 'verde', 'roxo', 'laranja')),
  tags TEXT[] DEFAULT '{}',
  
  -- Estados
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  
  -- Conectividade com sistema principal
  related_pedido_id TEXT, -- Referência para pedidos
  related_produto_id UUID, -- Referência para produtos
  related_cliente_id TEXT, -- Referência para clientes
  
  -- Colaboração
  shared_with UUID[], -- IDs de usuários com acesso
  created_by UUID NOT NULL REFERENCES auth.users(id),
  last_edited_by UUID REFERENCES auth.users(id),
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  organization_id UUID NOT NULL DEFAULT public.get_current_org_id(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notas
CREATE POLICY "notes_own_select" ON public.notes
  FOR SELECT USING (
    organization_id = public.get_current_org_id() AND 
    (created_by = auth.uid() OR auth.uid() = ANY(shared_with) OR is_shared = TRUE)
  );

CREATE POLICY "notes_own_insert" ON public.notes
  FOR INSERT WITH CHECK (
    organization_id = public.get_current_org_id() AND 
    created_by = auth.uid()
  );

CREATE POLICY "notes_own_update" ON public.notes
  FOR UPDATE USING (
    organization_id = public.get_current_org_id() AND 
    (created_by = auth.uid() OR auth.uid() = ANY(shared_with))
  );

CREATE POLICY "notes_own_delete" ON public.notes
  FOR DELETE USING (
    organization_id = public.get_current_org_id() AND 
    created_by = auth.uid()
  );

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================

-- Índices para logistic_events
CREATE INDEX idx_logistic_events_org_date ON public.logistic_events(organization_id, event_date);
CREATE INDEX idx_logistic_events_status ON public.logistic_events(status) WHERE status != 'completed';
CREATE INDEX idx_logistic_events_priority ON public.logistic_events(priority) WHERE priority IN ('high', 'critical');
CREATE INDEX idx_logistic_events_pedido ON public.logistic_events(related_pedido_id) WHERE related_pedido_id IS NOT NULL;
CREATE INDEX idx_logistic_events_tracking ON public.logistic_events(tracking_code) WHERE tracking_code IS NOT NULL;

-- Índices para notes
CREATE INDEX idx_notes_org_user ON public.notes(organization_id, created_by);
CREATE INDEX idx_notes_tags ON public.notes USING GIN(tags);
CREATE INDEX idx_notes_content_search ON public.notes USING GIN(to_tsvector('portuguese', title || ' ' || content));
CREATE INDEX idx_notes_pinned ON public.notes(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_notes_shared ON public.notes(is_shared) WHERE is_shared = TRUE;
CREATE INDEX idx_notes_related_pedido ON public.notes(related_pedido_id) WHERE related_pedido_id IS NOT NULL;
CREATE INDEX idx_notes_related_produto ON public.notes(related_produto_id) WHERE related_produto_id IS NOT NULL;

-- ===========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ===========================================

-- Trigger para updated_at em logistic_events
CREATE OR REPLACE FUNCTION public.update_logistic_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_logistic_events_updated_at
  BEFORE UPDATE ON public.logistic_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_logistic_events_updated_at();

-- Trigger para updated_at em notes
CREATE OR REPLACE FUNCTION public.update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_edited_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notes_updated_at();

-- ===========================================
-- FUNÇÃO PARA CRIAR EVENTOS AUTOMÁTICOS BASEADOS EM PEDIDOS
-- ===========================================

CREATE OR REPLACE FUNCTION public.create_logistic_events_from_pedido(p_pedido_data JSONB)
RETURNS UUID[] AS $$
DECLARE
  event_ids UUID[] := '{}';
  new_event_id UUID;
  delivery_date DATE;
  pickup_date DATE;
BEGIN
  -- Extrair datas do pedido
  delivery_date := COALESCE((p_pedido_data->>'data_prevista')::DATE, (NOW() + INTERVAL '3 days')::DATE);
  pickup_date := COALESCE((p_pedido_data->>'data_pedido')::DATE, NOW()::DATE);
  
  -- Criar evento de coleta (se necessário)
  IF (p_pedido_data->>'situacao') IN ('pendente', 'processando') THEN
    INSERT INTO public.logistic_events (
      title, description, type, status, priority,
      event_date, event_time, duration_minutes,
      customer_name, tracking_code,
      related_pedido_id, integration_account_id,
      notification_days_before, notes
    ) VALUES (
      'Coleta - Pedido ' || (p_pedido_data->>'numero'),
      'Coleta de produtos para o pedido ' || (p_pedido_data->>'numero'),
      'pickup', 'scheduled', 'medium',
      pickup_date, '09:00'::TIME, 60,
      p_pedido_data->>'nome_cliente', p_pedido_data->>'codigo_rastreamento',
      p_pedido_data->>'id', (p_pedido_data->>'integration_account_id')::UUID,
      1, 'Evento criado automaticamente pelo sistema'
    ) RETURNING id INTO new_event_id;
    
    event_ids := array_append(event_ids, new_event_id);
  END IF;
  
  -- Criar evento de entrega
  INSERT INTO public.logistic_events (
    title, description, type, status, priority,
    event_date, event_time, duration_minutes,
    location, customer_name, tracking_code,
    related_pedido_id, integration_account_id,
    notification_days_before, notes
  ) VALUES (
    'Entrega - Pedido ' || (p_pedido_data->>'numero'),
    'Entrega do pedido ' || (p_pedido_data->>'numero') || ' para ' || (p_pedido_data->>'nome_cliente'),
    'delivery', 'scheduled', 
    CASE WHEN (p_pedido_data->>'valor_total')::NUMERIC > 1000 THEN 'high' ELSE 'medium' END,
    delivery_date, '14:00'::TIME, 120,
    COALESCE(p_pedido_data->>'cidade', '') || ', ' || COALESCE(p_pedido_data->>'uf', ''),
    p_pedido_data->>'nome_cliente', p_pedido_data->>'codigo_rastreamento',
    p_pedido_data->>'id', (p_pedido_data->>'integration_account_id')::UUID,
    2, 'Evento criado automaticamente pelo sistema'
  ) RETURNING id INTO new_event_id;
  
  event_ids := array_append(event_ids, new_event_id);
  
  RETURN event_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- DADOS INICIAIS PARA DEMONSTRAÇÃO
-- ===========================================

-- Inserir alguns eventos de exemplo
INSERT INTO public.logistic_events (
  title, description, type, status, priority,
  event_date, event_time, duration_minutes,
  location, customer_name, tracking_code,
  notification_days_before, notes
) VALUES 
  ('Entrega Cliente VIP - São Paulo', 'Entrega de produtos eletrônicos para cliente premium', 'delivery', 'scheduled', 'high', 
   CURRENT_DATE + INTERVAL '1 day', '14:00'::TIME, 60, 'São Paulo, SP', 'TechCorp LTDA', 'BR123456789', 2, 'Cliente VIP - prioridade alta'),
  
  ('Coleta no Fornecedor - Campinas', 'Buscar novo lote de produtos', 'pickup', 'confirmed', 'medium',
   CURRENT_DATE + INTERVAL '2 days', '09:00'::TIME, 120, 'Campinas, SP', 'Fornecedor ABC', NULL, 1, 'Confirmar horário com fornecedor'),
   
  ('Prazo Final - Relatório Mensal', 'Entrega do relatório de vendas', 'deadline', 'scheduled', 'critical',
   CURRENT_DATE + INTERVAL '5 days', '18:00'::TIME, NULL, NULL, NULL, NULL, 3, 'Prazo improrrogável');

-- Inserir algumas notas de exemplo
INSERT INTO public.notes (
  title, content, color, tags, is_pinned
) VALUES 
  ('Fornecedores Confiáveis', 'Lista dos principais fornecedores:\n- ABC Corp (eletrônicos)\n- XYZ LTDA (roupas)\n- 123 SA (acessórios)', 'azul', ARRAY['fornecedores', 'parceiros'], TRUE),
  
  ('Checklist Entrega VIP', '✅ Confirmar endereço\n✅ Embalar com cuidado especial\n⏳ Agendar horário\n⏳ Enviar tracking\n⏳ Follow-up pós-entrega', 'verde', ARRAY['checklist', 'vip'], FALSE),
  
  ('Ideias Melhorias Sistema', 'Implementar:\n- Notificações push\n- Dashboard analytics\n- Integração WhatsApp\n- Scanner QR Code', 'roxo', ARRAY['ideias', 'sistema'], TRUE);