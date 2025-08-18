-- Function to clean expired OAuth states
CREATE OR REPLACE FUNCTION public.cleanup_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.oauth_states 
  WHERE expires_at < now() - interval '1 hour';
END;
$$;