-- Teste simples: inserir apenas uma categoria principal
-- Primeiro vamos criar o trigger se não existir
CREATE OR REPLACE FUNCTION public.set_categorias_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_set_categorias_organization ON public.categorias_produtos;
CREATE TRIGGER trigger_set_categorias_organization
  BEFORE INSERT ON public.categorias_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_categorias_organization();

-- Agora inserir uma categoria de teste
INSERT INTO public.categorias_produtos (nome, nivel, ativo, ordem) 
VALUES ('Beleza e Cuidado Pessoal', 1, true, 1);