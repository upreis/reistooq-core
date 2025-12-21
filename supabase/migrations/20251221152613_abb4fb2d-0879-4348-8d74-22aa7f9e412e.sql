
-- Excluir apenas as 2 contas sem pedidos vinculados
DELETE FROM integration_accounts 
WHERE id IN (
  '43eb94b5-abc2-4c0d-a589-8b638a650b2b', -- Shopee - Shop 225917626
  'da163c47-9942-4133-934f-b31bfa8210ae'  -- Conta Padrão (Sistema)
);
