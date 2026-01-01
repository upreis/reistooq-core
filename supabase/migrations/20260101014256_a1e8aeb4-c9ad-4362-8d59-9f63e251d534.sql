-- Garantir que a role `service_role` (usada por Edge Functions com SERVICE_ROLE_KEY)
-- tenha permissões explícitas nas tabelas necessárias para criação de usuários convidados.
-- (Resolve erros: "permission denied for table organizacoes/profiles")

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT ON TABLE public.organizacoes TO service_role;
GRANT SELECT, UPDATE ON TABLE public.invitations TO service_role;
GRANT SELECT ON TABLE public.roles TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO service_role;
GRANT INSERT ON TABLE public.user_role_assignments TO service_role;
