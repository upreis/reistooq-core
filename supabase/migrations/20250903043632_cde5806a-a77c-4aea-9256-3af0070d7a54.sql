-- Adicionar colunas separadas para categorias hierárquicas na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN categoria_principal text,
ADD COLUMN categoria_nivel2 text, 
ADD COLUMN subcategoria text;

-- Função para dividir a categoria existente nas novas colunas
CREATE OR REPLACE FUNCTION split_existing_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  produto_rec record;
  parts text[];
BEGIN
  -- Processar todos os produtos que têm categoria hierárquica
  FOR produto_rec IN 
    SELECT id, categoria 
    FROM produtos 
    WHERE categoria IS NOT NULL 
      AND categoria != '' 
      AND categoria LIKE '%→%'
  LOOP
    -- Dividir a categoria em partes
    parts := string_to_array(produto_rec.categoria, '→');
    
    -- Limpar espaços das partes
    FOR i IN 1..array_length(parts, 1) LOOP
      parts[i] := trim(parts[i]);
    END LOOP;
    
    -- Atualizar as novas colunas baseado no número de partes
    UPDATE produtos 
    SET 
      categoria_principal = CASE WHEN array_length(parts, 1) >= 1 THEN parts[1] ELSE NULL END,
      categoria_nivel2 = CASE WHEN array_length(parts, 1) >= 2 THEN parts[2] ELSE NULL END,
      subcategoria = CASE WHEN array_length(parts, 1) >= 3 THEN parts[3] ELSE NULL END
    WHERE id = produto_rec.id;
  END LOOP;
  
  -- Para produtos sem categoria hierárquica, definir apenas categoria_principal
  UPDATE produtos 
  SET categoria_principal = categoria
  WHERE categoria IS NOT NULL 
    AND categoria != '' 
    AND categoria NOT LIKE '%→%'
    AND categoria_principal IS NULL;
    
END;
$$;

-- Executar a função para dividir as categorias existentes
SELECT split_existing_categories();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_principal ON produtos(categoria_principal);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_nivel2 ON produtos(categoria_nivel2);
CREATE INDEX IF NOT EXISTS idx_produtos_subcategoria ON produtos(subcategoria);