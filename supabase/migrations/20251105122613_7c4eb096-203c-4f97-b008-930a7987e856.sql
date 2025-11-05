-- Função para atualizar organization_id de produtos existentes
CREATE OR REPLACE FUNCTION fix_produtos_organization_id()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Atualizar todos os produtos sem organization_id para a organização padrão
  UPDATE produtos
  SET organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
  WHERE organization_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object('success', true, 'updated', updated_count);
END;
$$;

-- Executar a função
SELECT fix_produtos_organization_id();