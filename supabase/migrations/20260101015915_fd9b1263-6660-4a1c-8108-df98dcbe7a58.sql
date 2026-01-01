
-- Adicionar campo para rastrear primeiro login
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_login_at timestamp with time zone DEFAULT NULL;

-- Adicionar campo accepted_user_id ao invitations se não existir
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS accepted_user_id uuid DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.first_login_at IS 'Timestamp do primeiro login do usuário';
COMMENT ON COLUMN public.invitations.accepted_user_id IS 'ID do usuário criado a partir deste convite';

-- Criar função para registrar primeiro login automaticamente
CREATE OR REPLACE FUNCTION public.record_first_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o usuário está fazendo login e first_login_at é null, registrar
  IF NEW.last_sign_in_at IS NOT NULL AND OLD.last_sign_in_at IS NULL THEN
    UPDATE public.profiles 
    SET first_login_at = NEW.last_sign_in_at
    WHERE id = NEW.id AND first_login_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Nota: O trigger em auth.users precisa ser criado via Dashboard pois 
-- não podemos criar triggers em schemas do Supabase via migrations
