-- Reativar todas as contas do Mercado Livre que foram desativadas
UPDATE integration_accounts 
SET is_active = true, updated_at = now()
WHERE provider = 'mercadolivre' 
  AND is_active = false;

-- Log da correção
INSERT INTO audit_logs (organization_id, action, resource_type, resource_id)
VALUES (NULL, 'reactivate_ml_accounts', 'integration_accounts', 'bulk_correction');