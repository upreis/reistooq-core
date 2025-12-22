-- Adicionar coluna para marcar locais sincronizados
ALTER TABLE public.locais_estoque
ADD COLUMN IF NOT EXISTS sincronizar_com_principal boolean NOT NULL DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN public.locais_estoque.sincronizar_com_principal IS 'Quando true, este local espelha automaticamente o estoque do local principal em tempo real';

-- Função que sincroniza estoque para locais marcados
CREATE OR REPLACE FUNCTION public.sync_estoque_para_locais_sincronizados()
RETURNS TRIGGER AS $$
DECLARE
  local_principal_id uuid;
  local_sync record;
BEGIN
  -- Buscar o local principal desta organização
  SELECT id INTO local_principal_id
  FROM public.locais_estoque
  WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND tipo = 'principal'
  LIMIT 1;

  -- Se não for uma mudança no local principal, ignorar
  IF local_principal_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Verificar se a mudança é no local principal
  IF COALESCE(NEW.local_id, OLD.local_id) != local_principal_id THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Para cada local sincronizado, replicar a mudança
  FOR local_sync IN
    SELECT id FROM public.locais_estoque
    WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
      AND sincronizar_com_principal = true
      AND id != local_principal_id
  LOOP
    IF TG_OP = 'INSERT' THEN
      -- Inserir ou atualizar no local sincronizado
      INSERT INTO public.estoque_por_local (organization_id, local_id, produto_id, quantidade)
      VALUES (NEW.organization_id, local_sync.id, NEW.produto_id, NEW.quantidade)
      ON CONFLICT (local_id, produto_id) 
      DO UPDATE SET quantidade = EXCLUDED.quantidade, updated_at = now();
      
    ELSIF TG_OP = 'UPDATE' THEN
      -- Atualizar no local sincronizado
      INSERT INTO public.estoque_por_local (organization_id, local_id, produto_id, quantidade)
      VALUES (NEW.organization_id, local_sync.id, NEW.produto_id, NEW.quantidade)
      ON CONFLICT (local_id, produto_id) 
      DO UPDATE SET quantidade = EXCLUDED.quantidade, updated_at = now();
      
    ELSIF TG_OP = 'DELETE' THEN
      -- Deletar do local sincronizado
      DELETE FROM public.estoque_por_local
      WHERE local_id = local_sync.id
        AND produto_id = OLD.produto_id;
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS trigger_sync_estoque_principal ON public.estoque_por_local;

CREATE TRIGGER trigger_sync_estoque_principal
AFTER INSERT OR UPDATE OR DELETE ON public.estoque_por_local
FOR EACH ROW
EXECUTE FUNCTION public.sync_estoque_para_locais_sincronizados();