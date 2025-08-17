BEGIN;

-- Bloquear qualquer permissão direta nas tabelas tiny v3
REVOKE ALL ON public.tiny_v3_credentials FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE IF EXISTS public.tiny_v3_credentials ENABLE ROW LEVEL SECURITY;

-- Política "nega tudo" para evitar futuros grants acidentais na tabela de credenciais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tiny_v3_credentials' AND policyname='tiny3_creds_deny_all'
  ) THEN
    EXECUTE 'CREATE POLICY tiny3_creds_deny_all ON public.tiny_v3_credentials
             FOR ALL TO authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- Auditoria para Tiny v3
CREATE TABLE IF NOT EXISTS public.tiny_v3_audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor uuid DEFAULT auth.uid(),
  action text NOT NULL,           -- 'set_creds' | 'get_creds'
  detail jsonb NOT NULL
);

-- Funções seguras (apenas servidor) para ler/gravar credenciais Tiny v3
CREATE OR REPLACE FUNCTION public.tiny3_set_credentials(_org_id uuid, _client_id text, _client_secret text, _redirect_uri text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.tiny_v3_credentials(organization_id, client_id, client_secret, redirect_uri)
  VALUES (_org_id, _client_id, _client_secret, _redirect_uri)
  ON CONFLICT (organization_id) DO UPDATE
     SET client_id     = EXCLUDED.client_id,
         client_secret = EXCLUDED.client_secret,
         redirect_uri  = EXCLUDED.redirect_uri,
         updated_at    = now();

  INSERT INTO public.tiny_v3_audit(action, detail) 
  VALUES ('set_creds', jsonb_build_object('organization_id', _org_id, 'client_id', _client_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.tiny3_get_credentials(_org_id uuid)
RETURNS TABLE (client_id text, client_secret text, redirect_uri text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT client_id, client_secret, redirect_uri
  FROM public.tiny_v3_credentials
  WHERE organization_id = _org_id
$$;

-- Só o backend (service_role) executa as funções; nenhum acesso direto às tabelas
REVOKE ALL ON FUNCTION public.tiny3_set_credentials(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tiny3_get_credentials(uuid)                 FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.tiny3_set_credentials(uuid,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.tiny3_get_credentials(uuid)                TO service_role;

-- RLS na tabela de auditoria
ALTER TABLE IF EXISTS public.tiny_v3_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tiny_v3_audit' AND policyname='tiny3_audit_deny_all'
  ) THEN
    EXECUTE 'CREATE POLICY tiny3_audit_deny_all ON public.tiny_v3_audit
             FOR ALL TO authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

REVOKE ALL ON public.tiny_v3_audit FROM PUBLIC, anon, authenticated, service_role;

COMMIT;