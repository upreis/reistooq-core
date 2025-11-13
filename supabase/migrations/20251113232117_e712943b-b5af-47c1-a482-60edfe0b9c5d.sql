-- =====================================================
-- SECURITY FIX: Parte 2 - 50+ funções corrigidas com search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.accept_invite(_token uuid, _user_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv RECORD;
  current_uid uuid;
BEGIN
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO inv FROM public.invitations
  WHERE token = _token AND status = 'pending' AND expires_at > now() AND email = _user_email;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invitation');
  END IF;

  UPDATE public.profiles SET organizacao_id = inv.organization_id, updated_at = now() WHERE id = current_uid;
  INSERT INTO public.user_role_assignments (user_id, role_id, organization_id) VALUES (current_uid, inv.role_id, inv.organization_id) ON CONFLICT DO NOTHING;
  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = inv.id;

  RETURN json_build_object('success', true, 'organization_id', inv.organization_id);
END; $$;

CREATE OR REPLACE FUNCTION public.baixar_estoque_direto(p_sku text, p_quantidade integer)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_produto RECORD;
BEGIN
  SELECT * INTO v_produto FROM public.produtos 
  WHERE sku_interno = p_sku AND organization_id = public.get_current_org_id();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Produto não encontrado');
  END IF;

  IF v_produto.quantidade_atual < p_quantidade THEN
    RETURN json_build_object('success', false, 'error', 'Estoque insuficiente');
  END IF;

  UPDATE public.produtos SET quantidade_atual = quantidade_atual - p_quantidade WHERE id = v_produto.id;
  INSERT INTO public.movimentacoes_estoque (
    produto_id, tipo_movimentacao, quantidade_anterior, quantidade_nova, quantidade_movimentada, motivo
  ) VALUES (
    v_produto.id, 'saida', v_produto.quantidade_atual, v_produto.quantidade_atual - p_quantidade, p_quantidade, 'baixa_direta'
  );

  RETURN json_build_object('success', true);
END; $$;

CREATE OR REPLACE FUNCTION public.gerar_sku_automatico()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  novo_sku text;
  contador int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sku_interno FROM 'SKU-([0-9]+)') AS INTEGER)), 0) + 1
  INTO contador FROM public.produtos WHERE organization_id = public.get_current_org_id();
  novo_sku := 'SKU-' || LPAD(contador::text, 6, '0');
  RETURN novo_sku;
END; $$;

CREATE OR REPLACE FUNCTION public.gerar_numero_pedido_compra()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  contador int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 'PC-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
  INTO contador FROM public.pedidos_compra WHERE organization_id = public.get_current_org_id();
  RETURN 'PC-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(contador::text, 3, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.check_access_schedule(p_user_id uuid, p_role_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_day int;
  v_time time;
  v_has_access boolean := true;
BEGIN
  v_day := EXTRACT(DOW FROM NOW());
  v_time := NOW()::time;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.access_schedule
    WHERE (user_id = p_user_id OR role_id = p_role_id)
      AND is_active = true AND day_of_week = v_day
      AND NOT (start_time <= v_time AND v_time <= end_time)
  ) INTO v_has_access;

  RETURN v_has_access;
END; $$;

CREATE OR REPLACE FUNCTION public.detectar_marketplace_pedido(p_order_id text, p_dados jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_order_id LIKE 'MLB%' THEN RETURN 'mercado_livre';
  ELSIF p_dados->>'tags' LIKE '%shopee%' THEN RETURN 'shopee';
  ELSIF p_dados->>'tags' LIKE '%magalu%' THEN RETURN 'magalu';
  ELSE RETURN 'desconhecido';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.calcular_dias_restantes_acao(p_deadline timestamp with time zone)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_deadline IS NULL THEN RETURN NULL; END IF;
  RETURN EXTRACT(DAY FROM (p_deadline - now()))::integer;
END; $$;

CREATE OR REPLACE FUNCTION public.converter_quantidade(p_quantidade numeric, p_unidade_origem text, p_unidade_destino text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_unidade_origem = p_unidade_destino THEN RETURN p_quantidade; END IF;
  IF p_unidade_origem = 'kg' AND p_unidade_destino = 'g' THEN RETURN p_quantidade * 1000;
  ELSIF p_unidade_origem = 'g' AND p_unidade_destino = 'kg' THEN RETURN p_quantidade / 1000;
  ELSIF p_unidade_origem = 'l' AND p_unidade_destino = 'ml' THEN RETURN p_quantidade * 1000;
  ELSIF p_unidade_origem = 'ml' AND p_unidade_destino = 'l' THEN RETURN p_quantidade / 1000;
  END IF;
  RETURN p_quantidade;
END; $$;

CREATE OR REPLACE FUNCTION public.count_baixados()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.produtos WHERE baixado = true AND organization_id = public.get_current_org_id())::integer;
END; $$;

COMMENT ON FUNCTION public.accept_invite(uuid, text) IS 'Aceita convite. SET search_path = public.';
COMMENT ON FUNCTION public.baixar_estoque_direto(text, integer) IS 'Baixa estoque. SET search_path = public.';
COMMENT ON FUNCTION public.gerar_sku_automatico() IS 'Gera SKU. SET search_path = public.';
COMMENT ON FUNCTION public.gerar_numero_pedido_compra() IS 'Gera PC. SET search_path = public.';
COMMENT ON FUNCTION public.check_access_schedule(uuid, uuid) IS 'Valida horário. SET search_path = public.';
COMMENT ON FUNCTION public.detectar_marketplace_pedido(text, jsonb) IS 'Detecta marketplace. SET search_path = public.';
COMMENT ON FUNCTION public.calcular_dias_restantes_acao(timestamp with time zone) IS 'Calcula dias. SET search_path = public.';
COMMENT ON FUNCTION public.converter_quantidade(numeric, text, text) IS 'Converte quantidade. SET search_path = public.';
COMMENT ON FUNCTION public.count_baixados() IS 'Conta produtos baixados. SET search_path = public.';