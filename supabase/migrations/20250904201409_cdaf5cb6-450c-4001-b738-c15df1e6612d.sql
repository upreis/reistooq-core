-- Corrigir políticas RLS da tabela categorias_catalogo
-- Remover política que bloqueia tudo
DROP POLICY IF EXISTS "catcat_block_mutations" ON public.categorias_catalogo;
DROP POLICY IF EXISTS "catcat_select_all" ON public.categorias_catalogo;

-- Criar políticas corretas: permitir leitura pública, bloquear escritas
CREATE POLICY "categorias_catalogo_public_read" 
ON public.categorias_catalogo 
FOR SELECT 
USING (true);

CREATE POLICY "categorias_catalogo_block_writes" 
ON public.categorias_catalogo 
FOR ALL 
USING (false);