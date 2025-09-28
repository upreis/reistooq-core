-- Verificar e corrigir políticas RLS para cotacoes-arquivos

-- Primeiro, vamos limpar as políticas existentes
DROP POLICY IF EXISTS "Usuários podem fazer upload de arquivos de cotação" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver arquivos de cotação da organização" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar arquivos de cotação da organização" ON storage.objects;

-- Recriar as políticas com verificações mais robustas
CREATE POLICY "Users can upload quote files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.organizacao_id IS NOT NULL
    AND p.organizacao_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can view quote files from their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.organizacao_id IS NOT NULL
    AND p.organizacao_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete quote files from their organization"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cotacoes-arquivos' 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.organizacao_id IS NOT NULL
    AND p.organizacao_id::text = (storage.foldername(name))[1]
  )
);

-- Garantir que o bucket existe e tem as configurações corretas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cotacoes-arquivos', 
  'cotacoes-arquivos', 
  false, 
  52428800, -- 50MB
  ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;