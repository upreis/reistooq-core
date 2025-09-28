-- Corrigir a política RLS usando a estrutura correta da tabela profiles

-- Remover política existente
DROP POLICY IF EXISTS "Usuários podem fazer upload de arquivos de cotação" ON storage.objects;

-- Recriar com a estrutura correta (organizacao_id, não organization_id)
CREATE POLICY "Usuários podem fazer upload de arquivos de cotação"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] IN (
    SELECT organizacao_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);