-- Limpar e recriar políticas RLS para oauth_states
-- Remover todas as políticas existentes primeiro
DROP POLICY IF EXISTS "OAuth states delete policy" ON public.oauth_states;
DROP POLICY IF EXISTS "OAuth states insert policy" ON public.oauth_states;
DROP POLICY IF EXISTS "OAuth states select policy" ON public.oauth_states;
DROP POLICY IF EXISTS "OAuth states update policy" ON public.oauth_states;
DROP POLICY IF EXISTS "oauth_states: self read" ON public.oauth_states;

-- Criar políticas simplificadas que funcionem tanto para usuários quanto para Edge Functions
CREATE POLICY "oauth_states_insert_policy" 
ON public.oauth_states 
FOR INSERT 
TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "oauth_states_select_policy" 
ON public.oauth_states 
FOR SELECT 
TO authenticated, service_role
USING (true);

CREATE POLICY "oauth_states_update_policy" 
ON public.oauth_states 
FOR UPDATE 
TO authenticated, service_role
USING (true);

CREATE POLICY "oauth_states_delete_policy" 
ON public.oauth_states 
FOR DELETE 
TO authenticated, service_role
USING (true);