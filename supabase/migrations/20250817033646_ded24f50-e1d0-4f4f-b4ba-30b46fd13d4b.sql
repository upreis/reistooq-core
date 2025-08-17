-- Fix critical RLS recursion error in profiles table
DROP POLICY IF EXISTS "profiles_safe_own_org_only" ON public.profiles;

-- Create secure function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id(target_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organizacao_id FROM public.profiles WHERE id = target_user_id;
$$;

-- Replace problematic policy with secure one
CREATE POLICY "profiles_safe_org_members" 
ON public.profiles 
FOR SELECT 
USING (
  organizacao_id = (
    SELECT organizacao_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create audit logs table for system events
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs
CREATE POLICY "audit_logs: admin read only" 
ON public.audit_logs 
FOR SELECT 
USING (
  organization_id = public.get_current_org_id() 
  AND has_permission('system:audit')
);

CREATE POLICY "audit_logs: system insert only" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (organization_id = public.get_current_org_id());

-- Create indexes for performance
CREATE INDEX idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
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
    public.get_current_org_id(),
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  );
END;
$$;

-- Create audit triggers for key tables
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'create',
      TG_TABLE_NAME,
      NEW.id::text,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      'update',
      TG_TABLE_NAME,
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'delete',
      TG_TABLE_NAME,
      OLD.id::text,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to important tables
CREATE TRIGGER audit_produtos_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_role_assignments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();