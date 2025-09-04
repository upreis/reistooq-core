-- Inserir categorias usando uma abordagem mais direta
DO $$
DECLARE
    org_id uuid;
    principal_id uuid;
BEGIN
    -- Obter o organization_id atual
    SELECT get_current_org_id() INTO org_id;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID não encontrado';
    END IF;
    
    -- Inserir Beleza e Cuidado Pessoal se não existir
    INSERT INTO public.categorias_produtos (nome, nivel, organization_id, ativo, ordem) 
    SELECT 'Beleza e Cuidado Pessoal', 1, org_id, true, 1
    WHERE NOT EXISTS (
        SELECT 1 FROM public.categorias_produtos 
        WHERE nome = 'Beleza e Cuidado Pessoal' AND nivel = 1 AND organization_id = org_id
    );
    
    -- Obter o ID da categoria principal
    SELECT id INTO principal_id 
    FROM public.categorias_produtos 
    WHERE nome = 'Beleza e Cuidado Pessoal' AND nivel = 1 AND organization_id = org_id;
    
    -- Inserir categorias de nível 2 para Beleza e Cuidado Pessoal
    INSERT INTO public.categorias_produtos (nome, nivel, categoria_principal_id, organization_id, ativo, ordem)
    VALUES 
        ('Barbearia', 2, principal_id, org_id, true, 1),
        ('Cuidados com a Pele', 2, principal_id, org_id, true, 2),
        ('Cuidados com o Cabelo', 2, principal_id, org_id, true, 3),
        ('Depilação', 2, principal_id, org_id, true, 4),
        ('Farmácia', 2, principal_id, org_id, true, 5),
        ('Higiene Pessoal', 2, principal_id, org_id, true, 6),
        ('Manicure e Pedicure', 2, principal_id, org_id, true, 7),
        ('Maquiagem', 2, principal_id, org_id, true, 8)
    ON CONFLICT DO NOTHING;
    
END $$;