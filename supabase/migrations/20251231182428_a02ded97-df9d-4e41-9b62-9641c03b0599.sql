
-- ================================================
-- CORREÇÕES RESTANTES: Tabelas de prioridade média/baixa
-- Com correção de tipos (text vs uuid)
-- ================================================

-- 1. historico: Bloquear tabela sem organization_id (não usada ativamente)
DROP POLICY IF EXISTS "Usuários autenticados podem acessar histórico" ON public.historico;
CREATE POLICY "historico_block_all" ON public.historico FOR ALL USING (false);
COMMENT ON TABLE public.historico IS 'BLOCKED: Tabela genérica sem organization_id. Usar funções RPC seguras.';

-- 2. historico_vendas_public: Remover policy redundante (já está bloqueada por deny_all_access)
DROP POLICY IF EXISTS "hist_select_org_members" ON public.historico_vendas_public;

-- 3. logs_atualizacao: Corrigir policy parcialmente insegura (tinha OR auth.uid() IS NOT NULL)
-- integration_account_id é UUID
DROP POLICY IF EXISTS "Users can view logs from their organization" ON public.logs_atualizacao;
CREATE POLICY "logs_atualizacao_org_isolation" ON public.logs_atualizacao
FOR SELECT USING (
  integration_account_id IN (
    SELECT ia.id FROM integration_accounts ia
    JOIN profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
);

-- 4. ml_devolucoes_historico_acoes: Corrigir policies (auth.uid() IS NOT NULL)
-- integration_account_id é TEXT, precisa de cast
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico" ON public.ml_devolucoes_historico_acoes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico" ON public.ml_devolucoes_historico_acoes;
CREATE POLICY "ml_devolucoes_historico_acoes_org_isolation" ON public.ml_devolucoes_historico_acoes
FOR ALL USING (
  integration_account_id::uuid IN (
    SELECT ia.id FROM integration_accounts ia
    JOIN profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  integration_account_id::uuid IN (
    SELECT ia.id FROM integration_accounts ia
    JOIN profiles p ON p.organizacao_id = ia.organization_id
    WHERE p.id = auth.uid()
  )
);

-- 5. system_alerts: Remover policy redundante (já tem system_alerts_org_read e system_alerts_users_read)
DROP POLICY IF EXISTS "Users can view active system alerts" ON public.system_alerts;

-- Comentários de segurança
COMMENT ON TABLE public.logs_atualizacao IS 'SECURITY: Acesso via logs_atualizacao_org_isolation (integration_account_id)';
COMMENT ON TABLE public.ml_devolucoes_historico_acoes IS 'SECURITY: Acesso via ml_devolucoes_historico_acoes_org_isolation (integration_account_id::uuid)';
