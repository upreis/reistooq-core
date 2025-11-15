-- Tabela para armazenar insights e sugestões da IA sobre melhorias do sistema
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Tipo de insight
  insight_type TEXT NOT NULL CHECK (insight_type IN ('ui_improvement', 'feature_request', 'bug_pattern', 'user_struggle', 'workflow_optimization')),
  
  -- Severidade/prioridade
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Dados da análise
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_route TEXT,
  user_actions_analyzed INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Sugestão de melhoria
  suggested_improvement TEXT,
  implementation_notes TEXT,
  
  -- Dados brutos da análise
  raw_data JSONB,
  session_replay_ids TEXT[],
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented', 'archived')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT ai_insights_organization_fkey FOREIGN KEY (organization_id) REFERENCES organizacoes(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_ai_insights_organization ON ai_insights(organization_id);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_route ON ai_insights(affected_route);

-- RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver insights da sua organização
CREATE POLICY "Users can view insights from their organization"
ON ai_insights FOR SELECT
TO authenticated
USING (organization_id = get_current_org_id());

-- Usuários podem criar insights (pela edge function)
CREATE POLICY "System can create insights"
ON ai_insights FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_current_org_id());

-- Usuários podem atualizar status dos insights
CREATE POLICY "Users can update insights in their organization"
ON ai_insights FOR UPDATE
TO authenticated
USING (organization_id = get_current_org_id())
WITH CHECK (organization_id = get_current_org_id());

-- Trigger para updated_at
CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE ai_insights IS 'Armazena insights e sugestões de melhorias geradas pela IA através da análise de comportamento dos usuários';
COMMENT ON COLUMN ai_insights.confidence_score IS 'Score de 0 a 1 indicando a confiança da IA na análise';
COMMENT ON COLUMN ai_insights.session_replay_ids IS 'IDs das sessões analisadas que geraram este insight';