-- Corrigir definitivamente a política RLS de upload para cotacoes-arquivos

-- Remover a política problemática
DROP POLICY IF EXISTS "Usuários podem fazer upload de arquivos de cotação" ON storage.objects;

-- Criar política correta para upload de arquivos de cotação
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

-- Também corrigir as outras políticas com problemas
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de imagens de produto" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de imagens de produtos para usuários autentica" ON storage.objects;

-- Recriar política correta para product-images
CREATE POLICY "Usuários autenticados podem fazer upload de imagens de produto"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Recriar política correta para produtos-imagens
CREATE POLICY "Permitir upload de imagens de produtos para usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'produtos-imagens' 
  AND auth.uid() IS NOT NULL
);