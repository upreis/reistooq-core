-- Allow service role to bypass RLS on profiles table
-- This is needed for Edge Functions to read user profiles

-- Create a policy that allows service role to read all profiles
CREATE POLICY "Service role can read all profiles"
  ON public.profiles
  FOR SELECT
  TO service_role
  USING (true);
