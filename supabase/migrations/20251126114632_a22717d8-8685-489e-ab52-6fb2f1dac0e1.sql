-- Criar tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  preference_key text NOT NULL,
  preference_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraint: um usuário só pode ter uma preferência de cada tipo
  UNIQUE(user_id, organization_id, preference_key)
);

-- Index para busca rápida
CREATE INDEX idx_user_preferences_user_org ON public.user_preferences(user_id, organization_id);
CREATE INDEX idx_user_preferences_key ON public.user_preferences(preference_key);

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler suas próprias preferências
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (user_id = auth.uid() AND organization_id = get_current_org_id());

-- Usuários podem inserir suas próprias preferências
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = get_current_org_id());

-- Usuários podem atualizar suas próprias preferências
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (user_id = auth.uid() AND organization_id = get_current_org_id())
  WITH CHECK (user_id = auth.uid() AND organization_id = get_current_org_id());

-- Usuários podem deletar suas próprias preferências
CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences
  FOR DELETE
  USING (user_id = auth.uid() AND organization_id = get_current_org_id());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();