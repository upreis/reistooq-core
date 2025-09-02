-- Adicionar campos para hierarquia de categorias
ALTER TABLE categorias_produtos 
ADD COLUMN categoria_principal_id uuid REFERENCES categorias_produtos(id),
ADD COLUMN categoria_id uuid REFERENCES categorias_produtos(id),
ADD COLUMN nivel integer NOT NULL DEFAULT 1,
ADD COLUMN categoria_completa text;

-- Criar índices para melhor performance
CREATE INDEX idx_categorias_produtos_categoria_principal ON categorias_produtos(categoria_principal_id);
CREATE INDEX idx_categorias_produtos_categoria ON categorias_produtos(categoria_id);
CREATE INDEX idx_categorias_produtos_nivel ON categorias_produtos(nivel);

-- Função para atualizar categoria_completa automaticamente
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
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar categoria_completa
CREATE TRIGGER trigger_update_categoria_completa
    BEFORE INSERT OR UPDATE ON categorias_produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_categoria_completa();

-- Adicionar constraint para garantir hierarquia correta
ALTER TABLE categorias_produtos 
ADD CONSTRAINT check_categoria_hierarchy 
CHECK (
    (nivel = 1 AND categoria_principal_id IS NULL AND categoria_id IS NULL) OR
    (nivel = 2 AND categoria_principal_id IS NOT NULL AND categoria_id IS NULL) OR
    (nivel = 3 AND categoria_principal_id IS NOT NULL AND categoria_id IS NOT NULL)
);

-- Criar função para buscar categorias hierárquicas
CREATE OR REPLACE FUNCTION get_categorias_hierarquicas(org_id uuid)
RETURNS TABLE (
    id uuid,
    nome text,
    descricao text,
    cor text,
    icone text,
    nivel integer,
    categoria_principal_id uuid,
    categoria_id uuid,
    categoria_completa text,
    ativo boolean,
    ordem integer,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.nome,
        cp.descricao,
        cp.cor,
        cp.icone,
        cp.nivel,
        cp.categoria_principal_id,
        cp.categoria_id,
        cp.categoria_completa,
        cp.ativo,
        cp.ordem,
        cp.created_at,
        cp.updated_at
    FROM categorias_produtos cp
    WHERE cp.organization_id = org_id
    ORDER BY 
        CASE WHEN cp.nivel = 1 THEN cp.nome END,
        CASE WHEN cp.nivel = 2 THEN (
            SELECT nome FROM categorias_produtos WHERE id = cp.categoria_principal_id
        ) END,
        CASE WHEN cp.nivel = 2 THEN cp.nome END,
        CASE WHEN cp.nivel = 3 THEN (
            SELECT nome FROM categorias_produtos WHERE id = cp.categoria_principal_id
        ) END,
        CASE WHEN cp.nivel = 3 THEN (
            SELECT nome FROM categorias_produtos WHERE id = cp.categoria_id
        ) END,
        CASE WHEN cp.nivel = 3 THEN cp.nome END,
        cp.ordem;
END;
$$ LANGUAGE plpgsql;