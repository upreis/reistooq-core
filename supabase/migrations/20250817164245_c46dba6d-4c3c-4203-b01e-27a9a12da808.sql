-- ✅ ENCERRAR ERROS "profiles_safe" e "historico_vendas_safe"
-- Pré-requisito: código já usando as RPCs get_my_profile() e get_historico_vendas_masked()

BEGIN;

-- garanta que ninguém tem SELECT nelas (até o drop acontecer)
REVOKE ALL ON public.profiles_safe           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.historico_vendas_safe   FROM PUBLIC, anon, authenticated;

-- remova as views (scanner para de acusar "publicly readable/sem RLS")
DROP VIEW IF EXISTS public.profiles_safe;
DROP VIEW IF EXISTS public.historico_vendas_safe;

COMMIT;