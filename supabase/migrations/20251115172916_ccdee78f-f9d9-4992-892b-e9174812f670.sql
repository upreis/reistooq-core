-- Alternative approach: Create RLS policies that allow service_role access
-- This bypasses the GRANT issue

-- 1. Create permissive policy for service_role on profiles
DO $$
BEGIN
  DROP POLICY IF EXISTS "service_role_full_access_profiles" ON public.profiles;
  
  CREATE POLICY "service_role_full_access_profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
END $$;

-- 2. Create permissive policies for service_role on ai_chat_conversations
DO $$
BEGIN
  DROP POLICY IF EXISTS "service_role_full_access_conversations" ON public.ai_chat_conversations;
  
  CREATE POLICY "service_role_full_access_conversations"
  ON public.ai_chat_conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
END $$;

-- 3. Create permissive policies for service_role on ai_chat_messages
DO $$
BEGIN
  DROP POLICY IF EXISTS "service_role_full_access_messages" ON public.ai_chat_messages;
  
  CREATE POLICY "service_role_full_access_messages"
  ON public.ai_chat_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
END $$;