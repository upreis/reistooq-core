-- Mover todos os produtos para a organização do usuário atual
UPDATE produtos 
SET organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768'
WHERE ativo = true;