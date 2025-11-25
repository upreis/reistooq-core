import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (
    file: File, 
    path?: string, 
    signal?: AbortSignal
  ): Promise<UploadResult> => {
    try {
      setUploading(true);

      // Verificar se já foi cancelado
      if (signal?.aborted) {
        throw new Error('Upload cancelado');
      }

      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Arquivo deve ser uma imagem' };
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        return { success: false, error: 'Arquivo deve ter no máximo 5MB' };
      }

      // Verificar cancelamento antes de iniciar upload
      if (signal?.aborted) {
        throw new Error('Upload cancelado');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload para o Supabase Storage com verificação de abort
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      // Verificar se foi cancelado durante upload
      if (signal?.aborted) {
        // Tentar deletar arquivo se upload completou mas foi cancelado
        if (data?.path) {
          try {
            console.log('🗑️ Removendo arquivo órfão após cancelamento:', data.path);
            const { error: deleteError } = await supabase.storage
              .from('product-images')
              .remove([data.path]);
            
            if (deleteError) {
              console.error('⚠️ Erro ao deletar arquivo órfão:', deleteError);
              // Não bloquear o fluxo, apenas logar
            } else {
              console.log('✅ Arquivo órfão removido com sucesso');
            }
          } catch (deleteErr) {
            console.error('⚠️ Falha ao deletar arquivo após cancelamento:', deleteErr);
            // Não bloquear o fluxo
          }
        }
        throw new Error('Upload cancelado');
      }

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      return { success: true, url: publicUrl };
    } catch (error: any) {
      // Distinguir erro de cancelamento
      if (signal?.aborted || error.message === 'Upload cancelado') {
        return { success: false, error: 'Upload cancelado' };
      }
      
      console.error('Upload error:', error);
      return { success: false, error: error.message || 'Erro no upload' };
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extrair path da URL
      const urlParts = url.split('/');
      const path = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from('product-images')
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading
  };
};