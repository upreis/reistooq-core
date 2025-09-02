-- Corrigir trigger e função com CASCADE
DROP TRIGGER IF EXISTS trigger_update_categoria_completa ON categorias_produtos;
DROP FUNCTION IF EXISTS update_categoria_completa() CASCADE;

-- Recriar função com search_path corrigido
CREATE OR REPLACE FUNCTION update_categoria_completa()
RETURNS TRIGGER AS $$
DECLARE
    cat_principal TEXT := '';
    cat_intermediaria TEXT := '';
BEGIN
    -- Buscar categoria principal
    IF NEW.categoria_principal_id IS NOT NULL THEN
        SELECT nome INTO cat_principal 
        FROM categorias_produtos 
        WHERE id = NEW.categoria_principal_id;
    END IF;
    
    -- Buscar categoria intermediária
    IF NEW.categoria_id IS NOT NULL THEN
        SELECT nome INTO cat_intermediaria 
        FROM categorias_produtos 
        WHERE id = NEW.categoria_id;
    END IF;
    
    -- Montar categoria completa baseada no nível
    CASE NEW.nivel
        WHEN 1 THEN -- Categoria Principal
            NEW.categoria_completa := NEW.nome;
        WHEN 2 THEN -- Categoria
            NEW.categoria_completa := COALESCE(cat_principal, '') || ' > ' || NEW.nome;
        WHEN 3 THEN -- Subcategoria
            NEW.categoria_completa := COALESCE(cat_principal, '') || ' > ' || COALESCE(cat_intermediaria, '') || ' > ' || NEW.nome;
        ELSE
            NEW.categoria_completa := NEW.nome;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

-- Recriar trigger
CREATE TRIGGER trigger_update_categoria_completa
    BEFORE INSERT OR UPDATE ON categorias_produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_categoria_completa();