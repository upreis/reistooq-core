-- Security Hardening: Fix Function Search Path Issues
-- This addresses the "Function Search Path Mutable" warnings

-- Fix hv_insert function
DROP FUNCTION IF EXISTS public.hv_insert(jsonb);
CREATE OR REPLACE FUNCTION public.hv_insert(p_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO public.historico_vendas (
    id_unico, numero_pedido, sku_produto, quantidade, valor_unitario, valor_total,
    data_pedido, status, cliente_nome, cliente_documento, nome_completo, cpf_cnpj,
    email, telefone, empresa, endereco_rua, endereco_numero, endereco_bairro,
    endereco_cidade, endereco_uf, endereco_cep, titulo_produto, descricao,
    codigo_barras, ncm, observacoes, origem, numero_ecommerce, numero_venda,
    situacao, metodo_pagamento, status_pagamento, tipo_pagamento, valor_frete,
    valor_desconto, data_prevista, codigo_rastreamento, url_rastreamento,
    status_envio, shipping_method, shipping_mode, delivery_type, tipo_entrega,
    metodo_envio_combinado, modo_envio_combinado, tipo_metodo_envio,
    tipo_logistico, logistic_mode_principal, substatus_estado_atual,
    substatus_detail, status_baixa, status_mapeamento, sku_kit, sku_estoque,
    quantidade_kit, qtd_kit, quantidade_itens, quantidade_total, total_itens,
    valor_liquido_vendedor, taxa_marketplace, desconto_cupom, custo_envio_seller,
    valor_pago, frete_pago_cliente, receita_flex_bonus, pack_id, pickup_id,
    pack_status, pack_status_detail, obs, obs_interna, tags, skus_produtos,
    meta, raw, integration_account_id, created_by
  ) VALUES (
    p_data->>'id_unico', p_data->>'numero_pedido', p_data->>'sku_produto',
    COALESCE((p_data->>'quantidade')::integer, 0),
    COALESCE((p_data->>'valor_unitario')::numeric, 0),
    COALESCE((p_data->>'valor_total')::numeric, 0),
    COALESCE((p_data->>'data_pedido')::date, CURRENT_DATE),
    COALESCE(p_data->>'status', 'concluida'),
    p_data->>'cliente_nome', p_data->>'cliente_documento', p_data->>'nome_completo',
    p_data->>'cpf_cnpj', p_data->>'email', p_data->>'telefone', p_data->>'empresa',
    p_data->>'endereco_rua', p_data->>'endereco_numero', p_data->>'endereco_bairro',
    p_data->>'endereco_cidade', p_data->>'endereco_uf', p_data->>'endereco_cep',
    p_data->>'titulo_produto', p_data->>'descricao', p_data->>'codigo_barras',
    p_data->>'ncm', p_data->>'observacoes', p_data->>'origem',
    p_data->>'numero_ecommerce', p_data->>'numero_venda', p_data->>'situacao',
    p_data->>'metodo_pagamento', p_data->>'status_pagamento', p_data->>'tipo_pagamento',
    COALESCE((p_data->>'valor_frete')::numeric, 0),
    COALESCE((p_data->>'valor_desconto')::numeric, 0),
    (p_data->>'data_prevista')::date, p_data->>'codigo_rastreamento',
    p_data->>'url_rastreamento', p_data->>'status_envio', p_data->>'shipping_method',
    p_data->>'shipping_mode', p_data->>'delivery_type', p_data->>'tipo_entrega',
    p_data->>'metodo_envio_combinado', p_data->>'modo_envio_combinado',
    p_data->>'tipo_metodo_envio', p_data->>'tipo_logistico',
    p_data->>'logistic_mode_principal', p_data->>'substatus_estado_atual',
    p_data->>'substatus_detail', p_data->>'status_baixa', p_data->>'status_mapeamento',
    p_data->>'sku_kit', p_data->>'sku_estoque',
    COALESCE((p_data->>'quantidade_kit')::integer, 0),
    COALESCE((p_data->>'qtd_kit')::integer, 0),
    COALESCE((p_data->>'quantidade_itens')::integer, 0),
    COALESCE((p_data->>'quantidade_total')::integer, 0),
    COALESCE((p_data->>'total_itens')::integer, 0),
    COALESCE((p_data->>'valor_liquido_vendedor')::numeric, 0),
    COALESCE((p_data->>'taxa_marketplace')::numeric, 0),
    COALESCE((p_data->>'desconto_cupom')::numeric, 0),
    COALESCE((p_data->>'custo_envio_seller')::numeric, 0),
    COALESCE((p_data->>'valor_pago')::numeric, 0),
    COALESCE((p_data->>'frete_pago_cliente')::numeric, 0),
    COALESCE((p_data->>'receita_flex_bonus')::numeric, 0),
    p_data->>'pack_id', p_data->>'pickup_id', p_data->>'pack_status',
    p_data->>'pack_status_detail', p_data->>'obs', p_data->>'obs_interna',
    CASE WHEN p_data->'tags' IS NOT NULL THEN 
      ARRAY(SELECT jsonb_array_elements_text(p_data->'tags'))
    ELSE NULL END,
    p_data->>'skus_produtos',
    COALESCE(p_data->'meta', '{}'::jsonb),
    p_data->'raw',
    COALESCE((p_data->>'integration_account_id')::uuid, NULL),
    auth.uid()
  );
  
  v_result := json_build_object('success', true, 'message', 'Histórico salvo com sucesso');
  RETURN v_result;
EXCEPTION 
  WHEN OTHERS THEN
    v_result := json_build_object('success', false, 'error', SQLERRM);
    RETURN v_result;
END;
$$;

-- Fix other security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.mask_phone(phone_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF phone_number IS NULL OR length(phone_number) < 8 THEN
    RETURN phone_number;
  END IF;
  
  -- Mask middle digits: +55(11)9****-4567 or (11)9****-4567
  IF phone_number ~ '^\+?[0-9]+\([0-9]{2}\)[0-9]' THEN
    RETURN regexp_replace(phone_number, '(\+?[0-9]*\([0-9]{2}\)[0-9])[0-9]+([0-9]{4})$', '\1****-\2');
  END IF;
  
  -- Mask middle digits for simple format: 11987654321 -> 119****4321
  IF length(phone_number) >= 10 THEN
    RETURN left(phone_number, 3) || '****' || right(phone_number, 4);
  END IF;
  
  RETURN '****' || right(phone_number, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email_address text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  local_part text;
  domain_part text;
  at_position integer;
BEGIN
  IF email_address IS NULL OR email_address = '' THEN
    RETURN email_address;
  END IF;
  
  at_position := position('@' in email_address);
  
  IF at_position = 0 THEN
    RETURN email_address; -- Not a valid email format
  END IF;
  
  local_part := left(email_address, at_position - 1);
  domain_part := substring(email_address from at_position);
  
  -- Mask local part: show first 2 chars + *** + last char before @
  IF length(local_part) <= 3 THEN
    RETURN left(local_part, 1) || '***' || domain_part;
  ELSE
    RETURN left(local_part, 2) || '***' || right(local_part, 1) || domain_part;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_name(full_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  name_parts text[];
  masked_name text := '';
  i integer;
BEGIN
  IF full_name IS NULL OR full_name = '' THEN
    RETURN full_name;
  END IF;
  
  -- Split name into parts
  name_parts := string_to_array(trim(full_name), ' ');
  
  -- If only one name, mask middle characters
  IF array_length(name_parts, 1) = 1 THEN
    IF length(name_parts[1]) <= 3 THEN
      RETURN left(name_parts[1], 1) || '***';
    ELSE
      RETURN left(name_parts[1], 1) || '***' || right(name_parts[1], 1);
    END IF;
  END IF;
  
  -- Show first name + mask middle names + show last name
  FOR i IN 1..array_length(name_parts, 1) LOOP
    IF i = 1 THEN
      -- First name: show completely
      masked_name := name_parts[i];
    ELSIF i = array_length(name_parts, 1) THEN
      -- Last name: show completely
      masked_name := masked_name || ' ' || name_parts[i];
    ELSE
      -- Middle names: mask
      masked_name := masked_name || ' ' || left(name_parts[i], 1) || '***';
    END IF;
  END LOOP;
  
  RETURN masked_name;
END;
$$;

-- Enhanced security for customer data access
CREATE OR REPLACE FUNCTION public.mask_cpf_cnpj(document text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF document IS NULL OR document = '' THEN
    RETURN document;
  END IF;
  
  -- Remove formatting
  document := regexp_replace(document, '[^0-9]', '', 'g');
  
  -- CPF: 123.456.789-01 -> 123.***.**9-01
  IF length(document) = 11 THEN
    RETURN left(document, 3) || '.***.***-' || right(document, 2);
  END IF;
  
  -- CNPJ: 12.345.678/0001-01 -> 12.***.***/**01-01
  IF length(document) = 14 THEN
    RETURN left(document, 2) || '.***.***/**' || substring(document, 11, 2) || '-' || right(document, 2);
  END IF;
  
  -- Unknown format, mask middle
  IF length(document) > 4 THEN
    RETURN left(document, 2) || '***' || right(document, 2);
  END IF;
  
  RETURN '***';
END;
$$;

-- Add comprehensive audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    get_current_org_id(),
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    inet(COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', '127.0.0.1')),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown'),
    COALESCE(current_setting('request.headers', true)::json->>'x-session-id', 'unknown')
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Log errors silently, don't fail the main operation
    NULL;
END;
$$;