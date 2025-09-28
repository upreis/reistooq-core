-- Corrigir as políticas RLS para o bucket cotacoes-arquivos

-- Remover políticas existentes problemáticas
DROP POLICY IF EXISTS "Usuários podem fazer upload de arquivos de cotação" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de imagens de produto" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de imagens de produtos para usuários autentica" ON storage.objects;

-- Criar política correta para upload de arquivos de cotação
CREATE POLICY "Usuários podem fazer upload de arquivos de cotação"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] IN (
    SELECT organizacao_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Criar política correta para upload de imagens de produtos
CREATE POLICY "Usuários autenticados podem fazer upload de imagens de produto"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Criar política correta para upload de imagens na pasta produtos-imagens
CREATE POLICY "Permitir upload de imagens de produtos para usuários autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'produtos-imagens' 
  AND auth.uid() IS NOT NULL
);