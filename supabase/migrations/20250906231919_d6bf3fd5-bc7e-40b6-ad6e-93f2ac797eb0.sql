-- Fix Security Linter: make views run with caller privileges (security_invoker) and add barrier
ALTER VIEW IF EXISTS public.clientes_safe SET (security_invoker = true);
ALTER VIEW IF EXISTS public.historico_vendas_safe SET (security_invoker = true);
ALTER VIEW IF EXISTS public.historico_vendas_public SET (security_invoker = true);

-- Extra hardening: prevent information-leak optimizations
ALTER VIEW IF EXISTS public.clientes_safe SET (security_barrier = true);
ALTER VIEW IF EXISTS public.historico_vendas_safe SET (security_barrier = true);
ALTER VIEW IF EXISTS public.historico_vendas_public SET (security_barrier = true);