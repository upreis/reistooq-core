
-- ============================================================
-- LIMPEZA DE USUÁRIOS ÓRFÃOS
-- Exclui user_role_assignments e profiles de usuários órfãos
-- Os usuários em auth.users precisam ser excluídos via Dashboard
-- ============================================================

-- Lista de user_ids órfãos a serem excluídos
-- (exceto josenildo c3785644-... e lojas d95bd6f1-...)

DO $$
DECLARE
  orphan_ids uuid[] := ARRAY[
    '0d3ca4ed-e8b2-4fc9-8245-5f347ee4c108',
    '2131ae7e-fee1-497f-85f4-53f1c1db5b3a',
    '26dfab9c-ddb7-444c-9f9b-9989b19efc4b',
    '27b58291-38d7-46c3-8e59-7e7680e44789',
    '2b2ed68c-1dae-44e6-b99b-079984549d64',
    '54db778c-c867-4bde-8b99-b1780b40d450',
    '5b17dca4-8fa1-4fd0-be3b-7c6da6981609',
    '831ba4af-bb5c-40d2-bc01-04a7c0b3d60f',
    '8607407f-fd66-48e9-ac22-39ca13a00c3c',
    '89661967-8d16-462b-ad31-917fbbfec184',
    '9eb57bc1-a350-40e6-83ce-92f0bffe646b',
    'a8b498fd-8867-4282-b993-248c613e44f8',
    'b3b23546-9f6e-4402-8c8d-c590047d2ca8',
    'd8a4be84-f254-40c6-9ddb-efc3d0228773',
    'ee31d5d8-9c1a-4f6e-90ca-7c6375fc27e8',
    'f6d033fd-4a99-4c6a-9f18-361d17b8cc9a'
  ]::uuid[];
  deleted_roles int;
  deleted_profiles int;
BEGIN
  -- 1. Excluir role assignments
  DELETE FROM user_role_assignments 
  WHERE user_id = ANY(orphan_ids);
  GET DIAGNOSTICS deleted_roles = ROW_COUNT;
  RAISE NOTICE 'Deleted % role assignments', deleted_roles;

  -- 2. Excluir profiles
  DELETE FROM profiles 
  WHERE id = ANY(orphan_ids);
  GET DIAGNOSTICS deleted_profiles = ROW_COUNT;
  RAISE NOTICE 'Deleted % profiles', deleted_profiles;
END $$;

-- Também corrigir o usuário lojas que tem role em org errada
-- Remover a atribuição de role na org errada (f0890a4d-...)
DELETE FROM user_role_assignments 
WHERE user_id = 'd95bd6f1-4345-4acf-94e6-6b10c73e6488'
  AND organization_id != '9d52ba63-0de8-4d77-8b57-ed14d3189768';
