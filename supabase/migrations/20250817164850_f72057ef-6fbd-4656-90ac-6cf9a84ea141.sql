-- 🔒 Zerar erro no PROFILES: somente "self" pode fazer SELECT na TABELA

BEGIN;

-- 0) Garantir RLS ativo e nenhum grant direto de SELECT
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE ALL    ON public.profiles FROM PUBLIC, anon;
-- (mantenha o que precisa para operar; SELECT continua negado)
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL            ON public.profiles TO service_role;

-- 1) Remover QUALQUER policy de SELECT para 'authenticated' que não seja "profiles_select_self"
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='profiles'
      AND cmd='SELECT'
      AND 'authenticated' = ANY(roles)
      AND policyname <> 'profiles_select_self'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles;', pol.policyname);
  END LOOP;
END $$;

-- 2) Garantir a única policy de SELECT (self-only) existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
      AND policyname='profiles_select_self'
  ) THEN
    EXECUTE 'CREATE POLICY "profiles_select_self" ON public.profiles
             FOR SELECT TO authenticated
             USING (id = auth.uid())';
  END IF;
END $$;

COMMIT;

-- 3) (Opcional, para telas de admin) Recriar RPC segura para listar perfis com checagem de permissão
DROP FUNCTION IF EXISTS public.admin_list_profiles(text, integer, integer);

CREATE OR REPLACE FUNCTION public.admin_list_profiles(
  _search text DEFAULT NULL, _limit int DEFAULT 100, _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, nome_completo text, nome_exibicao text, telefone text,
  cargo text, departamento text, organizacao_id uuid, created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT p.id, p.nome_completo, p.nome_exibicao,
         COALESCE(public.mask_phone(p.telefone), p.telefone) AS telefone,
         p.cargo, p.departamento, p.organizacao_id, p.created_at
  FROM public.profiles p
  WHERE public.has_permission('users:read')
    AND p.organizacao_id = public.get_current_org_id()
    AND (
      _search IS NULL OR _search = '' OR
      p.nome_completo ILIKE '%'||_search||'%' OR
      p.nome_exibicao ILIKE '%'||_search||'%'
    )
  ORDER BY p.created_at DESC
  LIMIT COALESCE(_limit,100) OFFSET COALESCE(_offset,0);
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles(text,int,int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_profiles(text,int,int) TO authenticated;

-- 4) (Hardening opcional) Corrigir funções SECURITY DEFINER sem search_path fixo
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT (p.oid::regprocedure)::text rp
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.prosecdef AND n.nspname='public'
      AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', f.rp);
  END LOOP;
END $$;

-- 5) (Hardening opcional) Mover extensões que forem movíveis para "extensions"
CREATE SCHEMA IF NOT EXISTS extensions;