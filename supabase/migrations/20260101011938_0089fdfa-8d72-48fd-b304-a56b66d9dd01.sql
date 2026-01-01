-- Atualizar o email do usuário de org.reis para ecomm.reis
-- NOTA: Não é possível alterar diretamente o email em auth.users via SQL
-- Precisamos usar a API admin do Supabase

-- Por enquanto, vamos garantir que o campo fantasia da organização está correto
-- e que está em minúsculas para evitar problemas futuros
UPDATE organizacoes 
SET fantasia = LOWER(fantasia)
WHERE id = '9d52ba63-0de8-4d77-8b57-ed14d3189768' 
  AND fantasia IS NOT NULL
  AND fantasia != LOWER(fantasia);