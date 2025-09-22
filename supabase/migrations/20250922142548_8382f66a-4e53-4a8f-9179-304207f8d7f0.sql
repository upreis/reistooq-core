-- ===================================================================
-- CORREÇÃO SEGURA: Adicionar search_path às Funções
-- ===================================================================
-- Esta correção melhora a segurança definindo explicitamente o search_path
-- das funções sem alterar seu comportamento

-- Corrigir funções que lidam com autenticação/permissões
ALTER FUNCTION public.can_view_sensitive_customer_data() SET search_path = public, auth;
ALTER FUNCTION public.has_permission(text) SET search_path = public, auth;
ALTER FUNCTION public.get_user_permissions() SET search_path = public, auth;

-- Corrigir funções de mascaramento de dados
ALTER FUNCTION public.mask_cpf_cnpj(text) SET search_path = public;
ALTER FUNCTION public.mask_email(text) SET search_path = public;
ALTER FUNCTION public.mask_customer_phone(text) SET search_path = public;
ALTER FUNCTION public.mask_customer_address(text) SET search_path = public;
ALTER FUNCTION public.mask_customer_cep(text) SET search_path = public;