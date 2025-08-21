-- Criar organizações para usuários que não têm
INSERT INTO public.organizacoes (id, nome, plano, ativo)
SELECT 
  gen_random_uuid() as id,
  COALESCE('Organização de ' || SPLIT_PART(au.email, '@', 1), 'Organização Individual') as nome,
  'basico' as plano,
  true as ativo
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.organizacao_id IS NULL OR p.organizacao_id NOT IN (SELECT id FROM public.organizacoes)
ON CONFLICT DO NOTHING;

-- Atualizar profiles para referenciar as organizações criadas
UPDATE public.profiles p
SET organizacao_id = o.id
FROM auth.users au, public.organizacoes o
WHERE p.id = au.id 
  AND p.organizacao_id IS NULL
  AND o.nome = COALESCE('Organização de ' || SPLIT_PART(au.email, '@', 1), 'Organização Individual');