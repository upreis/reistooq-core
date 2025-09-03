-- Criar uma política adicional para permitir leitura de categorias principais sem filtro de organização
-- Isso permite que as categorias principais sejam visíveis mesmo sem autenticação
CREATE POLICY "categorias_principais_publicas" 
ON public.categorias_produtos
FOR SELECT
USING (nivel = 1 AND ativo = true);

-- Aumentar a prioridade desta política
DROP POLICY IF EXISTS "categorias: select org" ON public.categorias_produtos;

-- Recriar a política original com menor prioridade
CREATE POLICY "categorias: select org" 
ON public.categorias_produtos
FOR SELECT
USING (organization_id = get_current_org_id());