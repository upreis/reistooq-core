-- Security fix: Add RLS policies to historico_vendas_safe view
-- This prevents unauthorized access to customer sales data across organizations

-- Enable RLS on the historico_vendas_safe view
ALTER TABLE public.historico_vendas_safe ENABLE ROW LEVEL SECURITY;

-- Add policy to restrict access to organization members only
CREATE POLICY "historico_vendas_safe: org members only" 
ON public.historico_vendas_safe 
FOR SELECT 
USING (
  -- Only allow access if user belongs to the same organization as the sales record
  EXISTS (
    SELECT 1 
    FROM public.historico_vendas hv
    JOIN public.integration_accounts ia ON ia.id = hv.integration_account_id
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE hv.id = historico_vendas_safe.id 
      AND ia.organization_id = p.organizacao_id
  )
);

-- Add comment explaining the security purpose
COMMENT ON POLICY "historico_vendas_safe: org members only" ON public.historico_vendas_safe 
IS 'Security policy: Restricts access to sales history data to users within the same organization only. Prevents cross-organization data access.';