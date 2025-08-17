-- Check if tiny_v3_tokens table exists and create it if needed
CREATE TABLE IF NOT EXISTS public.tiny_v3_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Now run the security hardening for Tiny v3 credentials and tokens
BEGIN;

-- Bloquear qualquer permissão direta
REVOKE ALL ON public.tiny_v3_credentials FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.tiny_v3_tokens      FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE IF EXISTS public.tiny_v3_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tiny_v3_tokens      ENABLE ROW LEVEL SECURITY;

-- Políticas "nega tudo" para evitar futuros grants acidentais
DROP POLICY IF EXISTS tiny3_creds_deny_all ON public.tiny_v3_credentials;
DROP POLICY IF EXISTS tiny3_tokens_deny_all ON public.tiny_v3_tokens;

CREATE POLICY tiny3_creds_deny_all ON public.tiny_v3_credentials
FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY tiny3_tokens_deny_all ON public.tiny_v3_tokens
FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Auditoria
CREATE TABLE IF NOT EXISTS public.tiny_v3_audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor uuid DEFAULT auth.uid(),
  action text NOT NULL,           -- 'set_creds' | 'get_creds' | 'set_tokens' | 'get_tokens'
  detail jsonb NOT NULL
);

-- Funções seguras (apenas servidor) para ler/gravar
CREATE OR REPLACE FUNCTION public.tiny3_set_credentials(_client_id text, _client_secret text, _redirect_uri text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.tiny_v3_credentials(client_id, client_secret, redirect_uri)
  VALUES (_client_id, _client_secret, _redirect_uri)
  ON CONFLICT (client_id) DO UPDATE
     SET client_secret = EXCLUDED.client_secret,
         redirect_uri  = EXCLUDED.redirect_uri,
         updated_at = now();

  INSERT INTO public.tiny_v3_audit(action, detail) VALUES ('set_creds', jsonb_build_object('client_id', _client_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.tiny3_get_credentials(_client_id text)
RETURNS TABLE (client_id text, client_secret text, redirect_uri text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT client_id, client_secret, redirect_uri
  FROM public.tiny_v3_credentials
  WHERE client_id = _client_id
$$;

CREATE OR REPLACE FUNCTION public.tiny3_set_tokens(_client_id text, _access_token text, _refresh_token text, _expires_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.tiny_v3_tokens(client_id, access_token, refresh_token, expires_at)
  VALUES (_client_id, _access_token, _refresh_token, _expires_at)
  ON CONFLICT (client_id) DO UPDATE
     SET access_token  = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at    = EXCLUDED.expires_at,
         updated_at = now();

  INSERT INTO public.tiny_v3_audit(action, detail)
  VALUES ('set_tokens', jsonb_build_object('client_id', _client_id, 'expires_at', _expires_at));
END;
$$;

CREATE OR REPLACE FUNCTION public.tiny3_get_tokens(_client_id text)
RETURNS TABLE (client_id text, access_token text, refresh_token text, expires_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT client_id, access_token, refresh_token, expires_at
  FROM public.tiny_v3_tokens
  WHERE client_id = _client_id
$$;

-- Só o backend (service_role) executa as funções; nenhum acesso direto às tabelas
REVOKE ALL ON FUNCTION public.tiny3_set_credentials(text,text,text)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tiny3_get_credentials(text)                 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tiny3_set_tokens(text,text,text,timestamptz)FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tiny3_get_tokens(text)                      FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.tiny3_set_credentials(text,text,text)       TO service_role;
GRANT EXECUTE ON FUNCTION public.tiny3_get_credentials(text)                  TO service_role;
GRANT EXECUTE ON FUNCTION public.tiny3_set_tokens(text,text,text,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.tiny3_get_tokens(text)                       TO service_role;

COMMIT;