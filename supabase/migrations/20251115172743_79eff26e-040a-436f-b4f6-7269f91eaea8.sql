-- Grant ALL necessary permissions to service_role for AI chat functionality
-- This is critical for edge functions to work properly

-- 1. Grant on profiles table
GRANT SELECT ON public.profiles TO service_role;

-- 2. Grant on ai_chat_conversations table  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_conversations TO service_role;

-- 3. Grant on ai_chat_messages table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_messages TO service_role;

-- 4. Ensure RLS policies exist for authenticated users on conversations
DO $$
BEGIN
  -- Drop existing policy if it exists to recreate it
  DROP POLICY IF EXISTS "Users can view own conversations" ON public.ai_chat_conversations;
  
  CREATE POLICY "Users can view own conversations" 
  ON public.ai_chat_conversations 
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid() AND organization_id = get_current_org_id());
END $$;

-- 5. Ensure RLS policies exist for authenticated users on messages
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.ai_chat_messages;
  
  CREATE POLICY "Users can view messages from own conversations" 
  ON public.ai_chat_messages 
  FOR SELECT 
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM ai_chat_conversations 
      WHERE user_id = auth.uid() 
      AND organization_id = get_current_org_id()
    )
  );
END $$;