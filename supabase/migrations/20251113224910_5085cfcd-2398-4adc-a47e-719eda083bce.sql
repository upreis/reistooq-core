-- =====================================================
-- SECURITY LINTER FIX: Adicionar SET search_path = public
-- =====================================================

DROP FUNCTION IF EXISTS public.mask_phone(text) CASCADE;
DROP FUNCTION IF EXISTS public.mask_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.mask_cpf_cnpj(text) CASCADE;
DROP FUNCTION IF EXISTS public.mask_name(text) CASCADE;
DROP FUNCTION IF EXISTS public.encrypt_integration_secret(jsonb, text) CASCADE;
DROP FUNCTION IF EXISTS public.decrypt_integration_secret(bytea, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_historico_vendas_masked(uuid, int, int) CASCADE;
DROP FUNCTION IF EXISTS public.get_customer_secure(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.search_customers_secure(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_customer_data_access(uuid, uuid, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE FUNCTION public.mask_phone(phone text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT CASE WHEN phone IS NULL OR length(phone) < 4 THEN phone ELSE '****' || right(phone, 4) END; $$;

CREATE FUNCTION public.mask_email(email text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT CASE WHEN email IS NULL OR position('@' IN email) = 0 THEN email ELSE left(email, 2) || '****@' || split_part(email, '@', 2) END; $$;

CREATE FUNCTION public.mask_cpf_cnpj(doc text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT CASE WHEN doc IS NULL OR length(doc) < 4 THEN doc ELSE '***.' || right(doc, 4) END; $$;

CREATE FUNCTION public.mask_name(full_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT CASE WHEN full_name IS NULL OR length(full_name) < 3 THEN full_name ELSE split_part(full_name, ' ', 1) || ' ' || left(split_part(full_name, ' ', 2), 1) || '.' END; $$;

CREATE FUNCTION public.encrypt_integration_secret(p_secret_data jsonb, p_encryption_key text DEFAULT NULL)
RETURNS bytea LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_key text; v_secret_text text;
BEGIN
  v_key := COALESCE(p_encryption_key, current_setting('app.settings.encryption_key', true), 'default-fallback-key-change-in-production');
  v_secret_text := p_secret_data::text;
  RETURN public.encrypt(v_secret_text::bytea, v_key::bytea, 'aes');
END; $$;

CREATE FUNCTION public.decrypt_integration_secret(p_encrypted_data bytea, p_encryption_key text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_key text; v_decrypted_text text;
BEGIN
  IF p_encrypted_data IS NULL THEN RETURN NULL; END IF;
  v_key := COALESCE(p_encryption_key, current_setting('app.settings.encryption_key', true), 'default-fallback-key-change-in-production');
  v_decrypted_text := convert_from(public.decrypt(p_encrypted_data, v_key::bytea, 'aes'), 'UTF8');
  RETURN v_decrypted_text::jsonb;
END; $$;

CREATE FUNCTION public.get_historico_vendas_masked(p_organization_id uuid, p_limit int DEFAULT 100, p_offset int DEFAULT 0)
RETURNS TABLE (id uuid, organization_id uuid, order_id text, buyer_name text, buyer_cpf text, buyer_email text, buyer_phone text, created_at timestamptz, total_amount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT hv.id, p_organization_id as organization_id, hv.pedido_id as order_id,
    public.mask_name(hv.cliente_nome) as buyer_name, public.mask_cpf_cnpj(hv.cpf_cnpj) as buyer_cpf,
    ''::text as buyer_email, ''::text as buyer_phone,
    hv.created_at, hv.valor_total as total_amount
  FROM public.historico_vendas hv 
  WHERE hv.integration_account_id IN (
    SELECT id FROM integration_accounts WHERE organization_id = p_organization_id
  )
  ORDER BY hv.created_at DESC LIMIT p_limit OFFSET p_offset;
END; $$;

CREATE FUNCTION public.get_customer_secure(p_customer_id uuid)
RETURNS TABLE (id uuid, nome text, cpf_cnpj text, email text, telefone text, organization_id uuid, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user_id uuid; v_org_id uuid; v_has_permission boolean;
BEGIN
  v_user_id := auth.uid();
  SELECT c.organization_id INTO v_org_id FROM public.clientes c WHERE c.id = p_customer_id;
  SELECT EXISTS (SELECT 1 FROM public.user_permissions up WHERE up.user_id = v_user_id AND up.permission = 'customers:read_sensitive') INTO v_has_permission;
  PERFORM public.log_customer_data_access(p_customer_id, v_user_id, 'get_customer_secure'::text, v_has_permission);
  RETURN QUERY SELECT c.id,
    CASE WHEN v_has_permission THEN c.nome_completo ELSE public.mask_name(c.nome_completo) END as nome,
    CASE WHEN v_has_permission THEN c.cpf_cnpj ELSE public.mask_cpf_cnpj(c.cpf_cnpj) END as cpf_cnpj,
    CASE WHEN v_has_permission THEN c.email ELSE public.mask_email(c.email) END as email,
    CASE WHEN v_has_permission THEN c.telefone ELSE public.mask_phone(c.telefone) END as telefone,
    c.organization_id, c.created_at
  FROM public.clientes c WHERE c.id = p_customer_id AND c.organization_id = v_org_id;
END; $$;

CREATE FUNCTION public.search_customers_secure(p_search_term text, p_organization_id uuid)
RETURNS TABLE (id uuid, nome text, cpf_cnpj text, email text, telefone text, organization_id uuid, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user_id uuid; v_has_permission boolean;
BEGIN
  v_user_id := auth.uid();
  SELECT EXISTS (SELECT 1 FROM public.user_permissions up WHERE up.user_id = v_user_id AND up.permission = 'customers:read_sensitive') INTO v_has_permission;
  RETURN QUERY SELECT c.id,
    CASE WHEN v_has_permission THEN c.nome_completo ELSE public.mask_name(c.nome_completo) END as nome,
    CASE WHEN v_has_permission THEN c.cpf_cnpj ELSE public.mask_cpf_cnpj(c.cpf_cnpj) END as cpf_cnpj,
    CASE WHEN v_has_permission THEN c.email ELSE public.mask_email(c.email) END as email,
    CASE WHEN v_has_permission THEN c.telefone ELSE public.mask_phone(c.telefone) END as telefone,
    c.organization_id, c.created_at
  FROM public.clientes c WHERE c.organization_id = p_organization_id
    AND (c.nome_completo ILIKE '%' || p_search_term || '%' OR c.cpf_cnpj ILIKE '%' || p_search_term || '%' OR c.email ILIKE '%' || p_search_term || '%')
  ORDER BY c.created_at DESC;
END; $$;

CREATE FUNCTION public.log_customer_data_access(p_customer_id uuid, p_user_id uuid, p_action text, p_has_permission boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_data_access_log (customer_id, user_id, action, has_permission, accessed_at)
  VALUES (p_customer_id, p_user_id, p_action, p_has_permission, now());
END; $$;

CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

-- RECREATE VIEWS (apenas profiles_safe e clientes_secure)
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT id, organizacao_id,
  CASE WHEN telefone IS NULL OR length(telefone) < 4 THEN telefone ELSE '****' || right(telefone, 4) END as telefone,
  created_at, updated_at
FROM public.profiles
WHERE organizacao_id = (SELECT organizacao_id FROM public.profiles WHERE id = auth.uid());

CREATE OR REPLACE VIEW public.clientes_secure AS
SELECT id, organization_id,
  public.mask_name(nome_completo) as nome,
  public.mask_cpf_cnpj(cpf_cnpj) as cpf_cnpj,
  public.mask_email(email) as email,
  public.mask_phone(telefone) as telefone,
  created_at
FROM public.clientes
WHERE organization_id = (SELECT organizacao_id FROM public.profiles WHERE id = auth.uid());

-- PERMISSIONS
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.clientes_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_cpf_cnpj(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_name(text) TO authenticated;
REVOKE ALL ON FUNCTION public.encrypt_integration_secret(jsonb, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.decrypt_integration_secret(bytea, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_integration_secret(jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_integration_secret(bytea, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_historico_vendas_masked(uuid, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_customers_secure(text, uuid) TO authenticated;