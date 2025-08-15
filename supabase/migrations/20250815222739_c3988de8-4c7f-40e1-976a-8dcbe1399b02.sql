-- Fix security vulnerability in profiles table
-- Add stricter RLS policies to prevent unauthorized access to personal data

-- First, drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "profiles: admin manage same org" ON public.profiles;
DROP POLICY IF EXISTS "profiles: self insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: self update" ON public.profiles;

-- Create new stricter policies

-- Users can only view their own profile
CREATE POLICY "profiles_select_own_only" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Admins with users:read permission can view profiles in their organization
CREATE POLICY "profiles_select_admin_org" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  organizacao_id = public.get_current_org_id() 
  AND public.has_permission('users:read'::text)
  AND id != auth.uid()  -- Explicit separation from self-access
);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own_only" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "profiles_update_own_only" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins with users:manage permission can update profiles in their organization
CREATE POLICY "profiles_update_admin_org" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  organizacao_id = public.get_current_org_id() 
  AND public.has_permission('users:manage'::text)
  AND id != auth.uid()  -- Explicit separation from self-access
)
WITH CHECK (
  organizacao_id = public.get_current_org_id() 
  AND public.has_permission('users:manage'::text)
  AND id != auth.uid()
);

-- Add DELETE policy - only admins with users:delete permission can delete profiles
CREATE POLICY "profiles_delete_admin_only" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (
  organizacao_id = public.get_current_org_id() 
  AND public.has_permission('users:delete'::text)
  AND id != auth.uid()  -- Users cannot delete their own profile via this policy
);

-- Create a secure function to mask sensitive data when accessed by non-admins
CREATE OR REPLACE FUNCTION public.get_profile_safe(profile_id uuid)
RETURNS TABLE(
  id uuid,
  nome_completo text,
  nome_exibicao text,
  cargo text,
  departamento text,
  organizacao_id uuid,
  avatar_url text,
  created_at timestamp with time zone
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.nome_completo 
      ELSE public.mask_name(p.nome_completo) 
    END,
    p.nome_exibicao,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.cargo 
      ELSE NULL 
    END,
    CASE 
      WHEN p.id = auth.uid() OR public.has_permission('users:read') 
      THEN p.departamento 
      ELSE NULL 
    END,
    p.organizacao_id,
    p.avatar_url,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.organizacao_id = public.get_current_org_id();
$$;