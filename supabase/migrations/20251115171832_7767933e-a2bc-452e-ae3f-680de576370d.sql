-- Force grant SELECT permission to service_role on profiles table
-- This must work for edge functions to access user profiles

-- Grant SELECT to service_role (bypass RLS for service operations)
GRANT SELECT ON public.profiles TO service_role;

-- Also grant to authenticated users for their own profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;