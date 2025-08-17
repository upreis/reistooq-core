BEGIN;

-- 1) Bloquear acesso direto à tabela (inclusive service_role)
REVOKE ALL ON public.integration_secrets FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE IF EXISTS public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Política "nega tudo" para evitar futuros grants acidentais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
     WHERE schemaname='public' AND tablename='integration_secrets' AND policyname='is_deny_all'
  ) THEN
    EXECUTE 'CREATE POLICY is_deny_all ON public.integration_secrets
             FOR ALL TO authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- 2) Tabela de auditoria
CREATE TABLE IF NOT EXISTS public.integration_secrets_audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor uuid DEFAULT auth.uid(),
  action text NOT NULL,               -- 'get' | 'set'
  provider text NOT NULL,
  secret_key text NOT NULL
);

-- 3) Funções seguras para acesso (único ponto de leitura/escrita)
CREATE OR REPLACE FUNCTION public.set_integration_secret(_provider text, _key text, _value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.integration_secrets(provider, secret_key, secret_value)
  VALUES (_provider, _key, _value)
  ON CONFLICT (provider, secret_key) DO UPDATE
    SET secret_value = EXCLUDED.secret_value;

  INSERT INTO public.integration_secrets_audit(action, provider, secret_key)
  VALUES ('set', _provider, _key);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_integration_secret(_provider text, _key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE v text;
BEGIN
  SELECT secret_value INTO v
  FROM public.integration_secrets
  WHERE provider = _provider AND secret_key = _key;

  INSERT INTO public.integration_secrets_audit(action, provider, secret_key)
  VALUES ('get', _provider, _key);

  RETURN v;
END;
$$;

-- 4) Permissões de execução: somente service_role (nenhum acesso direto à tabela)
REVOKE ALL ON FUNCTION public.set_integration_secret(text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_integration_secret(text,text)     FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.set_integration_secret(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_integration_secret(text,text)     TO service_role;

COMMIT;