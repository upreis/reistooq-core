-- Reativar todos os produtos da organização que estavam marcados como inativos
UPDATE produtos 
SET ativo = true 
WHERE organization_id = '9d52ba63-0de8-4d77-8b57-ed14d3189768' 
AND ativo = false;