-- Create a default integration account for existing data with valid provider
INSERT INTO public.integration_accounts (name, provider, organization_id, account_identifier, is_active)
SELECT 'Sistema Interno', 'tiny'::integration_provider, id, 'sistema-interno', true
FROM public.organizacoes
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update records with null integration_account_id
UPDATE public.historico_vendas 
SET integration_account_id = (SELECT id FROM public.integration_accounts LIMIT 1)
WHERE integration_account_id IS NULL;