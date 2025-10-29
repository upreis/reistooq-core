-- Remover política duplicada que sobrou
DROP POLICY IF EXISTS "profiles_update_secure" ON public.profiles;