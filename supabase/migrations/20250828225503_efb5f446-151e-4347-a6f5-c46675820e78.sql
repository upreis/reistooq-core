-- Temporariamente modificar a função de auditoria para permitir NULL organization_id
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text, 
  p_resource_type text, 
  p_resource_id text DEFAULT NULL::text, 
  p_old_values jsonb DEFAULT NULL::jsonb, 
  p_new_values jsonb DEFAULT NULL::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(public.get_current_org_id(), '00000000-0000-0000-0000-000000000000'::uuid), -- Use UUID zero se null
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  );
END;
$$;