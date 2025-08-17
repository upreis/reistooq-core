-- Ensure RLS is properly enforced on historico_vendas
ALTER TABLE public.historico_vendas FORCE ROW LEVEL SECURITY;