-- Reativar todas as contas do Mercado Livre que foram desativadas
UPDATE integration_accounts 
SET is_active = true, updated_at = now()
WHERE provider = 'mercadolivre' 
  AND is_active = false;