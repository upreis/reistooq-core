-- Ativar contas Mercado Livre inativas para corrigir erro "Integration account is not active"
UPDATE public.integration_accounts 
SET is_active = true, updated_at = now()
WHERE provider = 'mercadolivre' AND is_active = false;