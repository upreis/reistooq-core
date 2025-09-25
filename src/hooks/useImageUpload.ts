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

  const uploadImage = async (file: File, path?: string): Promise<UploadResult> => {
    try {
      setUploading(true);

      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Arquivo deve ser uma imagem' };
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        return { success: false, error: 'Arquivo deve ter no máximo 5MB' };
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

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