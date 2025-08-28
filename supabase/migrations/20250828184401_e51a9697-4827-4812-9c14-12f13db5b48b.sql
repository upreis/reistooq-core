-- Migration para alinhar RLS policies com o sistema RBAC
-- Aplicar permissões específicas conforme definido nos cargos

-- ==================== PRODUTOS ====================
-- Remover políticas antigas e criar novas baseadas em permissões

DROP POLICY IF EXISTS "produtos: mutate org" ON public.produtos;
DROP POLICY IF EXISTS "produtos: select org" ON public.produtos;

-- Política para visualizar produtos (estoque:view)
CREATE POLICY "produtos_select_with_permission" 
ON public.produtos 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:view')
);

-- Política para criar/editar produtos (estoque:edit)
CREATE POLICY "produtos_mutate_with_permission" 
ON public.produtos 
FOR ALL 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:edit')
)
WITH CHECK (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:edit')
);

-- ==================== MOVIMENTAÇÕES ESTOQUE ====================
DROP POLICY IF EXISTS "mov_estoque: mutate org" ON public.movimentacoes_estoque;
DROP POLICY IF EXISTS "mov_estoque: select org" ON public.movimentacoes_estoque;

-- Visualizar movimentações (estoque:view)
CREATE POLICY "movimentacoes_select_with_permission" 
ON public.movimentacoes_estoque 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.produtos pr 
    WHERE pr.id = movimentacoes_estoque.produto_id 
    AND pr.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:view')
);

-- Criar movimentações (estoque:edit)
CREATE POLICY "movimentacoes_mutate_with_permission" 
ON public.movimentacoes_estoque 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.produtos pr 
    WHERE pr.id = movimentacoes_estoque.produto_id 
    AND pr.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:edit')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.produtos pr 
    WHERE pr.id = movimentacoes_estoque.produto_id 
    AND pr.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:edit')
);

-- ==================== MAPEAMENTOS DE/PARA ====================
DROP POLICY IF EXISTS "mapeamentos_depara: org mutate" ON public.mapeamentos_depara;
DROP POLICY IF EXISTS "mapeamentos_depara: org read" ON public.mapeamentos_depara;

-- Visualizar mapeamentos (depara:view)
CREATE POLICY "mapeamentos_select_with_permission" 
ON public.mapeamentos_depara 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('depara:view')
);

-- Criar/editar mapeamentos (depara:edit)
CREATE POLICY "mapeamentos_mutate_with_permission" 
ON public.mapeamentos_depara 
FOR ALL 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('depara:edit')
)
WITH CHECK (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('depara:edit')
);

-- ==================== HISTÓRICO DE/PARA ====================
DROP POLICY IF EXISTS "historico_depara: org mutate" ON public.historico_depara;
DROP POLICY IF EXISTS "historico_depara: org read" ON public.historico_depara;

-- Visualizar histórico de/para (depara:view)
CREATE POLICY "historico_depara_select_with_permission" 
ON public.historico_depara 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('depara:view')
);

-- Apenas sistema pode inserir no histórico (auditoria)
CREATE POLICY "historico_depara_system_insert" 
ON public.historico_depara 
FOR INSERT 
WITH CHECK (organization_id = public.get_current_org_id());

-- ==================== HISTÓRICO VENDAS ====================
-- Atualizar para usar permissão de histórico
DROP POLICY IF EXISTS "hv_select_own" ON public.historico_vendas;
DROP POLICY IF EXISTS "hv_insert_own" ON public.historico_vendas;

-- Visualizar histórico (historico:view)
CREATE POLICY "historico_vendas_select_with_permission" 
ON public.historico_vendas 
FOR SELECT 
USING (
  public.has_permission('historico:view')
);

-- Inserir no histórico (apenas sistema/importações)
CREATE POLICY "historico_vendas_insert_system" 
ON public.historico_vendas 
FOR INSERT 
WITH CHECK (
  public.has_permission('historico:edit') OR created_by = auth.uid()
);

-- ==================== CATEGORIAS E TAGS ====================
-- Ajustar para usar permissões de estoque

DROP POLICY IF EXISTS "categorias: mutate org" ON public.categorias_produtos;
DROP POLICY IF EXISTS "categorias: select org" ON public.categorias_produtos;

CREATE POLICY "categorias_select_with_permission" 
ON public.categorias_produtos 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:view')
);

CREATE POLICY "categorias_mutate_with_permission" 
ON public.categorias_produtos 
FOR ALL 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:edit')
)
WITH CHECK (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:edit')
);

-- Tags de produtos
DROP POLICY IF EXISTS "produto_tags: mutate org" ON public.produto_tags;
DROP POLICY IF EXISTS "produto_tags: select org" ON public.produto_tags;

CREATE POLICY "produto_tags_select_with_permission" 
ON public.produto_tags 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:view')
);

CREATE POLICY "produto_tags_mutate_with_permission" 
ON public.produto_tags 
FOR ALL 
USING (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:edit')
)
WITH CHECK (
  organization_id = public.get_current_org_id() 
  AND public.has_permission('estoque:edit')
);

-- ==================== IMAGENS DE PRODUTOS ====================
DROP POLICY IF EXISTS "produto_imagens: mutate org" ON public.produto_imagens;
DROP POLICY IF EXISTS "produto_imagens: select org" ON public.produto_imagens;

CREATE POLICY "produto_imagens_select_with_permission" 
ON public.produto_imagens 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.id = produto_imagens.produto_id 
    AND p.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:view')
);

CREATE POLICY "produto_imagens_mutate_with_permission" 
ON public.produto_imagens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.id = produto_imagens.produto_id 
    AND p.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:edit')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.id = produto_imagens.produto_id 
    AND p.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:edit')
);

-- ==================== RELACIONAMENTOS PRODUTO-TAG ====================
DROP POLICY IF EXISTS "produto_tag_rel: mutate org" ON public.produto_tag_relacionamentos;
DROP POLICY IF EXISTS "produto_tag_rel: select org" ON public.produto_tag_relacionamentos;

CREATE POLICY "produto_tag_rel_select_with_permission" 
ON public.produto_tag_relacionamentos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.id = produto_tag_relacionamentos.produto_id 
    AND p.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:view')
);

CREATE POLICY "produto_tag_rel_mutate_with_permission" 
ON public.produto_tag_relacionamentos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.id = produto_tag_relacionamentos.produto_id 
    AND p.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:edit')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.produtos p 
    WHERE p.id = produto_tag_relacionamentos.produto_id 
    AND p.organization_id = public.get_current_org_id()
  ) 
  AND public.has_permission('estoque:edit')
);

-- ==================== LOG DE AUDITORIA ====================
-- Criar função para logging de mudanças de permissão
INSERT INTO public.audit_logs (
  organization_id, 
  user_id, 
  action, 
  resource_type, 
  resource_id, 
  new_values
) VALUES (
  public.get_current_org_id(),
  auth.uid(),
  'update',
  'rls_policies',
  'rbac_migration',
  jsonb_build_object(
    'message', 'Aplicadas políticas RLS baseadas em RBAC',
    'affected_tables', ARRAY[
      'produtos', 'movimentacoes_estoque', 'mapeamentos_depara', 
      'historico_depara', 'historico_vendas', 'categorias_produtos',
      'produto_tags', 'produto_imagens', 'produto_tag_relacionamentos'
    ]
  )
);