-- Ativar todos os produtos com o SKU informado, em qualquer organização
UPDATE public.produtos 
SET ativo = true,
    updated_at = now()
WHERE sku_interno = 'FL-14-TRAN-1';