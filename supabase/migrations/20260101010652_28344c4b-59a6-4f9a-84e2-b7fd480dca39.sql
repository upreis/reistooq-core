-- Inserir o perfil faltante do usuário criado
INSERT INTO public.profiles (id, username, organizacao_id, nome_exibicao, created_at, updated_at)
VALUES (
  '27b58291-38d7-46c3-8e59-7e7680e44789',
  'reis',
  '9d52ba63-0de8-4d77-8b57-ed14d3189768',
  'reis',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir inserção via service role (para edge functions)
-- Verificar se a política já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Service role can manage profiles'
  ) THEN
    CREATE POLICY "Service role can manage profiles"
      ON public.profiles
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;