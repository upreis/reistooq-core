-- Corrigir políticas RLS para oauth_states para permitir fluxo OAuth do MercadoLibre

-- Primeiro, verificar se a tabela oauth_states existe, se não, criar
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state_value TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used BOOLEAN DEFAULT false
);

-- Habilitar RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can insert their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Users can read their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Users can update their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Allow service role full access to oauth_states" ON public.oauth_states;

-- Criar políticas mais permissivas para o fluxo OAuth
-- Permitir inserção para usuários autenticados (Edge Functions usam service role)
CREATE POLICY "Allow authenticated users to insert oauth states" 
ON public.oauth_states 
FOR INSERT 
TO authenticated, service_role
WITH CHECK (true);

-- Permitir leitura para usuários autenticados
CREATE POLICY "Allow authenticated users to read oauth states" 
ON public.oauth_states 
FOR SELECT 
TO authenticated, service_role
USING (
  user_id = auth.uid() 
  OR auth.role() = 'service_role'
);

-- Permitir atualização para marcar como usado
CREATE POLICY "Allow authenticated users to update oauth states" 
ON public.oauth_states 
FOR UPDATE 
TO authenticated, service_role
USING (
  user_id = auth.uid() 
  OR auth.role() = 'service_role'
);

-- Permitir deleção de estados expirados
CREATE POLICY "Allow cleanup of expired oauth states" 
ON public.oauth_states 
FOR DELETE 
TO authenticated, service_role
USING (
  expires_at < now() 
  OR auth.role() = 'service_role'
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_oauth_states_state_value ON public.oauth_states(state_value);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON public.oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON public.oauth_states(expires_at);

-- Função para limpar estados OAuth expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.oauth_states 
  WHERE expires_at < now() OR used = true;
END;
$function$;