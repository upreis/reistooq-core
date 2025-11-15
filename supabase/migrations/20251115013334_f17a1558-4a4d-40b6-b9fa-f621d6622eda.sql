-- ============================================================================
-- FASE 1: INFRAESTRUTURA CHATBOT INTELIGENTE
-- ============================================================================

-- Habilitar extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para conversas do chat
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para mensagens individuais
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para base de conhecimento (documentação, conversas passadas, session replays)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  source TEXT NOT NULL CHECK (source IN ('documentation', 'lovable_chat', 'session_replay', 'user_feedback', 'manual')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_org ON ai_chat_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_user ON ai_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conversation ON ai_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created ON ai_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_org ON knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(is_active);

-- RLS Policies para ai_chat_conversations
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON ai_chat_conversations FOR SELECT
  USING (user_id = auth.uid() AND organization_id = get_current_org_id());

CREATE POLICY "Users can create conversations in their org"
  ON ai_chat_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = get_current_org_id());

CREATE POLICY "Users can update their own conversations"
  ON ai_chat_conversations FOR UPDATE
  USING (user_id = auth.uid() AND organization_id = get_current_org_id());

CREATE POLICY "Users can delete their own conversations"
  ON ai_chat_conversations FOR DELETE
  USING (user_id = auth.uid() AND organization_id = get_current_org_id());

-- RLS Policies para ai_chat_messages
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations"
  ON ai_chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM ai_chat_conversations 
      WHERE user_id = auth.uid() AND organization_id = get_current_org_id()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON ai_chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_chat_conversations 
      WHERE user_id = auth.uid() AND organization_id = get_current_org_id()
    )
  );

-- RLS Policies para knowledge_base
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active knowledge from their org or public"
  ON knowledge_base FOR SELECT
  USING (
    is_active = true AND 
    (organization_id IS NULL OR organization_id = get_current_org_id())
  );

CREATE POLICY "Admins can manage knowledge in their org"
  ON knowledge_base FOR ALL
  USING (
    organization_id = get_current_org_id() AND 
    has_permission('system:admin'::text)
  )
  WITH CHECK (
    organization_id = get_current_org_id() AND 
    has_permission('system:admin'::text)
  );

-- Trigger para atualizar last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Inserir documentação inicial na base de conhecimento
INSERT INTO knowledge_base (source, title, content, metadata, is_active) VALUES
('documentation', 'Visão Geral do Sistema', 
'O sistema é uma plataforma de gestão integrada com Mercado Livre e Shopee. Principais funcionalidades:
- Gestão de Devoluções: Sincronização automática de devoluções do ML, com notificações e prazos
- Gestão de Pedidos: Visualização e gerenciamento de pedidos de múltiplos marketplaces
- Gestão de Produtos: Cadastro, categorização e controle de estoque
- Gestão de Estoque: Controle por locais, movimentações e composições
- Integrações: Mercado Livre (OAuth, sync automático), Shopee
- Relatórios e Analytics: Dashboards com métricas de vendas, devoluções, estoque',
'{"tags": ["overview", "features"], "priority": "high"}'::jsonb, true),

('documentation', 'Como Acessar Devoluções',
'Para acessar devoluções do Mercado Livre:
1. Menu lateral > Devoluções
2. Sistema sincroniza automaticamente a cada 5 minutos
3. Use filtros por status, data, claim_id
4. Botão "Sincronizar" força atualização manual
5. Notificações aparecem quando há ações necessárias com prazo',
'{"tags": ["devolucoes", "mercadolivre", "tutorial"], "module": "devolucoes"}'::jsonb, true),

('documentation', 'Como Cadastrar Produtos',
'Para cadastrar um novo produto:
1. Menu lateral > Estoque > Produtos
2. Botão "Novo Produto" (canto superior)
3. Campos obrigatórios: SKU, Nome, Preço
4. Opcionais: Categoria, Descrição, Imagens, Estoque inicial
5. Salvar - produto fica disponível imediatamente',
'{"tags": ["produtos", "cadastro", "tutorial"], "module": "estoque"}'::jsonb, true),

('documentation', 'Integração Mercado Livre',
'Sistema possui integração completa com ML:
- OAuth automático (configurado via edge functions)
- Sincronização de pedidos e devoluções
- Token refresh automático
- Webhooks para notificações em tempo real
- Claims, returns e mensagens sincronizados
Para conectar nova conta: Integrações > Mercado Livre > Conectar',
'{"tags": ["mercadolivre", "integracoes", "oauth"], "module": "integracoes"}'::jsonb, true);