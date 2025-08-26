-- Create secure RPCs to check and fix orphaned historico_vendas records per organization
-- Uses SECURITY DEFINER and get_current_org_id() to scope changes safely

-- 1) Orphaned stats for current org
CREATE OR REPLACE FUNCTION public.hv_orphaned_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH org_orphans AS (
    SELECT hv.id
    FROM historico_vendas hv
    LEFT JOIN pedidos p
      ON (p.id = hv.pedido_id OR p.numero = hv.numero_pedido)
    LEFT JOIN integration_accounts ia
      ON ia.id = p.integration_account_id
    WHERE hv.status = 'baixado'
      AND hv.integration_account_id IS NULL
      AND ia.organization_id = get_current_org_id()
  ),
  org_total AS (
    SELECT hv.id
    FROM historico_vendas hv
    LEFT JOIN pedidos p
      ON (p.id = hv.pedido_id OR p.numero = hv.numero_pedido)
    LEFT JOIN integration_accounts ia
      ON ia.id = COALESCE(hv.integration_account_id, p.integration_account_id)
    WHERE hv.status = 'baixado'
      AND ia.organization_id = get_current_org_id()
  )
  SELECT jsonb_build_object(
    'orphanedCount', (SELECT count(*) FROM org_orphans),
    'total', (SELECT count(*) FROM org_total)
  );
$$;

GRANT EXECUTE ON FUNCTION public.hv_orphaned_stats() TO authenticated;

-- 2) Fix orphans for current org with optional default account
CREATE OR REPLACE FUNCTION public.hv_fix_orphans(default_account_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_default uuid;
  v_updated integer := 0;
BEGIN
  v_org := get_current_org_id();
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Missing organization context';
  END IF;

  -- Determine default account if not provided
  IF default_account_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM integration_accounts ia
      WHERE ia.id = default_account_id AND ia.organization_id = v_org AND ia.is_active
    ) THEN
      RAISE EXCEPTION 'Default account not found in current organization';
    END IF;
    v_default := default_account_id;
  ELSE
    SELECT ia.id INTO v_default
    FROM integration_accounts ia
    WHERE ia.organization_id = v_org AND ia.is_active
    ORDER BY ia.created_at ASC
    LIMIT 1;
  END IF;

  -- Update only records that can be associated to this org via pedidos
  WITH candidates AS (
    SELECT hv.id, COALESCE(p.integration_account_id, v_default) AS new_account
    FROM historico_vendas hv
    JOIN pedidos p
      ON (p.id = hv.pedido_id OR p.numero = hv.numero_pedido)
    LEFT JOIN integration_accounts ia
      ON ia.id = p.integration_account_id
    WHERE hv.integration_account_id IS NULL
      AND (ia.organization_id = v_org OR p.integration_account_id IS NULL)
  )
  UPDATE historico_vendas hv
  SET integration_account_id = c.new_account,
      updated_at = now()
  FROM candidates c
  JOIN integration_accounts ia2 ON ia2.id = c.new_account AND ia2.organization_id = v_org
  WHERE hv.id = c.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hv_fix_orphans(uuid) TO authenticated;