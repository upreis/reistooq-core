-- Fix existing views only (skip non-existing ones)
ALTER VIEW public.clientes_safe SET (security_invoker = true);
ALTER VIEW public.historico_vendas_safe SET (security_invoker = true);

-- Add security barriers for protection against optimizer info leaks
ALTER VIEW public.clientes_safe SET (security_barrier = true);
ALTER VIEW public.historico_vendas_safe SET (security_barrier = true);