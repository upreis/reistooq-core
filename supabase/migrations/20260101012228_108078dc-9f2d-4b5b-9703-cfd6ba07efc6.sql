-- Corrigir o profile do usuário reis para usar a organização correta
UPDATE profiles 
SET 
  organizacao_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768',
  username = 'reis'
WHERE id = '27b58291-38d7-46c3-8e59-7e7680e44789';

-- Remover a organização fantasma que foi criada por erro
DELETE FROM organizacoes 
WHERE id = 'c3e8ec9a-2e94-42ac-b17d-8e4a0c7bb81c' 
  AND nome = 'org.reis@interno.local';