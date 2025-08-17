-- Fix OAuth security vulnerability: Restrict oauth_states access to record owners only
-- Remove overly permissive policies
DROP POLICY IF EXISTS "oauth_states_insert_policy" ON public.oauth_states;
DROP POLICY IF EXISTS "oauth_states_select_policy" ON public.oauth_states;
DROP POLICY IF EXISTS "oauth_states_update_policy" ON public.oauth_states;
DROP POLICY IF EXISTS "oauth_states_delete_policy" ON public.oauth_states;

-- Create secure policies that only allow users to access their own OAuth state records
CREATE POLICY "oauth_states_insert_own" 
ON public.oauth_states 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oauth_states_select_own" 
ON public.oauth_states 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "oauth_states_update_own" 
ON public.oauth_states 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oauth_states_delete_own" 
ON public.oauth_states 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Allow service_role (Edge Functions) to access all records for OAuth processing
CREATE POLICY "oauth_states_service_role_all" 
ON public.oauth_states 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);