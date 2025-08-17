-- Corrigir políticas RLS para oauth_states para permitir fluxo OAuth do MercadoLibre
-- A tabela já existe com: id, user_id, code_verifier, created_at, expires_at

-- Adicionar colunas que faltam se não existirem
ALTER TABLE public.oauth_states 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'mercadolivre';

ALTER TABLE public.oauth_states 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE;

ALTER TABLE public.oauth_states 
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT false;

ALTER TABLE public.oauth_states 
ADD COLUMN IF NOT EXISTS state_value TEXT;

-- Criar índice único para state_value se não existir
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_states_state_value_unique ON public.oauth_states(state_value) WHERE state_value IS NOT NULL;

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can insert their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Users can read their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Users can update their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Allow service role full access to oauth_states" ON public.oauth_states;
DROP POLICY IF EXISTS "Allow authenticated users to insert oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Allow authenticated users to read oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Allow authenticated users to update oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Allow cleanup of expired oauth states" ON public.oauth_states;

-- Criar políticas permissivas para o fluxo OAuth
-- Permitir inserção para service_role (Edge Functions) e usuários autenticados
CREATE POLICY "OAuth states insert policy" 
ON public.oauth_states 
FOR INSERT 
TO authenticated, service_role
WITH CHECK (
  auth.role() = 'service_role' OR user_id = auth.uid()
);

-- Permitir leitura para service_role e próprio usuário
CREATE POLICY "OAuth states select policy" 
ON public.oauth_states 
FOR SELECT 
TO authenticated, service_role
USING (
  auth.role() = 'service_role' OR user_id = auth.uid()
);

-- Permitir atualização para service_role e próprio usuário
CREATE POLICY "OAuth states update policy" 
ON public.oauth_states 
FOR UPDATE 
TO authenticated, service_role
USING (
  auth.role() = 'service_role' OR user_id = auth.uid()
);

-- Permitir deleção para service_role e estados expirados
CREATE POLICY "OAuth states delete policy" 
ON public.oauth_states 
FOR DELETE 
TO authenticated, service_role
USING (
  auth.role() = 'service_role' OR 
  (user_id = auth.uid() AND expires_at < now())
);

-- Criar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON public.oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON public.oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_provider ON public.oauth_states(provider);