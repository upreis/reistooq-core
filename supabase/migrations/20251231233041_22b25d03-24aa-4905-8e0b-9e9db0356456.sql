-- Ensure invited user profile exists for the latest invite (lojasterrabrasil@gmail.com)
INSERT INTO public.profiles (id, nome_completo, nome_exibicao, organizacao_id, created_at, updated_at)
VALUES (
  'ee31d5d8-9c1a-4f6e-90ca-7c6375fc27e8',
  'lojasterrabrasil@gmail.com',
  'lojasterrabrasil',
  '9d52ba63-0de8-4d77-8b57-ed14d3189768',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET organizacao_id = EXCLUDED.organizacao_id,
    updated_at = now();