-- Desativar contas "Comercial" que não têm integração válida (provider tiny sem token)
-- Não podemos excluir pois há pedidos referenciando
UPDATE integration_accounts 
SET is_active = false
WHERE name = 'Comercial' 
  AND provider = 'tiny' 
  AND token_status = 'unknown';