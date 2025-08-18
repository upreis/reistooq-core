-- Adicionar política específica para service role na tabela profiles
-- Isso permite que o service role acesse todos os profiles sem restrições RLS
CREATE POLICY "Service role can access all profiles" 
ON public.profiles FOR SELECT 
TO service_role
USING (true);