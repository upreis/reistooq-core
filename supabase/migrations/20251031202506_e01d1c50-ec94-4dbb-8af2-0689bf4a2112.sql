-- Fix permissions for decrypt_simple and encrypt_simple functions
-- The functions need to be accessible by authenticated users and service_role

-- Grant execute to authenticated users (for RPC calls)
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_simple(text) TO authenticated;

-- Grant execute to anon (for public access if needed)
GRANT EXECUTE ON FUNCTION public.decrypt_simple(text) TO anon;
GRANT EXECUTE ON FUNCTION public.encrypt_simple(text) TO anon;