/**
 * 🖼️ UTILIDADES PARA MANIPULAÇÃO DE IMAGENS
 * Garante URLs seguras (HTTPS) e tratamento de erros
 */

/**
 * Converte URLs HTTP para HTTPS para evitar Mixed Content warnings
 * @param url - URL original da imagem
 * @returns URL segura com HTTPS
 */
export const ensureHttps = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // Se a URL já é HTTPS, retorna como está
  if (url.startsWith('https://')) return url;
  
  // Se é HTTP, converte para HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // Se é URL relativa ou data URL, retorna como está
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  
  // Default: assume HTTPS
  return `https://${url}`;
};

/**
 * Sanitiza URL de imagem do Mercado Livre
 * @param url - URL original
 * @returns URL segura e otimizada
 */
export const sanitizeMlImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // Garantir HTTPS
  let sanitized = ensureHttps(url);
  if (!sanitized) return null;
  
  // Remover parâmetros desnecessários que podem causar problemas
  try {
    const urlObj = new URL(sanitized);
    
    // Para URLs do ML Static, manter apenas os parâmetros essenciais
    if (urlObj.hostname.includes('mlstatic.com')) {
      // Remove parâmetros de cache que podem estar desatualizados
      urlObj.searchParams.delete('v');
      sanitized = urlObj.toString();
    }
    
    return sanitized;
  } catch {
    // Se não for URL válida, retorna sanitizado básico
    return sanitized;
  }
};

/**
 * Gera URL de fallback SVG inline para quando imagem falha
 * @param width - Largura do placeholder
 * @param height - Altura do placeholder
 * @param text - Texto a exibir
 * @returns Data URL SVG
 */
export const createImagePlaceholder = (
  width: number = 48,
  height: number = 48,
  text: string = 'Sem imagem'
): string => {
  return `data:image/svg+xml,%3Csvg xmlns="https://www.w3.org/2000/svg" width="${width}" height="${height}"%3E%3Crect width="${width}" height="${height}" fill="%23f0f0f0"/%3E%3Ctext x="${width/2}" y="${height/2}" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="12"%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};

/**
 * Props para componente de imagem segura
 */
export interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  fallbackText?: string;
  sanitize?: boolean;
}

/**
 * Hook para gerenciar carregamento de imagem com fallback
 */
export const useSecureImage = (url: string | null | undefined, sanitize: boolean = true) => {
  const [imgSrc, setImgSrc] = React.useState<string | null>(null);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
    
    if (!url) {
      setImgSrc(null);
      return;
    }

    const processedUrl = sanitize ? sanitizeMlImageUrl(url) : ensureHttps(url);
    setImgSrc(processedUrl);
  }, [url, sanitize]);

  const handleError = React.useCallback(() => {
    setHasError(true);
  }, []);

  return { imgSrc, hasError, handleError };
};

// Re-export React for the hook
import React from 'react';
