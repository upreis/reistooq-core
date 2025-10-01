/**
 * @deprecated Este arquivo é mantido apenas para compatibilidade retroativa.
 * Use @/utils/manusImageExtractor (solução Manus completa) para novos desenvolvimentos.
 * 
 * A solução Manus completa extrai imagens das colunas B e C usando coordenadas XML reais,
 * garantindo mapeamento correto entre imagens e SKUs.
 */

import { processarExcelCompletoCorrigido } from './manusImageExtractor';

export interface ImagemPosicionada {
  nome: string;
  dados: Uint8Array;
  linha: number;
  coluna: number;
  tipoColuna: 'IMAGEM' | 'IMAGEM_FORNECEDOR';
  sku?: string;
}

export interface ImagemProcessada {
  sku: string;
  nome: string;
  dataUrl: string;
  url?: string; // Alias para compatibilidade
  linha: number;
  coluna: number;
  tipoColuna: 'IMAGEM' | 'IMAGEM_FORNECEDOR';
}

/**
 * @deprecated Use processarExcelCompletoCorrigido de @/utils/manusImageExtractor
 * Mantido para compatibilidade retroativa - redireciona para solução Manus completa
 */
export const extrairImagensDoExcel = async (file: File): Promise<ImagemPosicionada[]> => {
  console.warn('⚠️ [DEPRECATED] extrairImagensDoExcel: Use processarExcelCompletoCorrigido da solução Manus');
  console.log('🔄 [COMPAT] Redirecionando para solução Manus completa...');
  
  try {
    const resultado = await processarExcelCompletoCorrigido(file);
    
    if (!resultado) {
      return [];
    }
    
    const { imagensPrincipais, imagensFornecedor } = resultado;
    
    // Converter formato para compatibilidade
    const imagensCompativeis: ImagemPosicionada[] = [];
    
    // Processar imagens principais (coluna B)
    if (imagensPrincipais) {
      for (const img of imagensPrincipais) {
        const arrayBuffer = await img.blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        imagensCompativeis.push({
          nome: img.nome,
          dados: uint8Array,
          linha: img.linha,
          coluna: 2, // Coluna B
          tipoColuna: 'IMAGEM',
          sku: img.sku
        });
      }
    }
    
    // Processar imagens de fornecedor (coluna C)
    if (imagensFornecedor) {
      for (const img of imagensFornecedor) {
        const arrayBuffer = await img.blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        imagensCompativeis.push({
          nome: img.nome,
          dados: uint8Array,
          linha: img.linha,
          coluna: 3, // Coluna C
          tipoColuna: 'IMAGEM_FORNECEDOR',
          sku: img.sku
        });
      }
    }
    
    console.log(`✅ [COMPAT] ${imagensCompativeis.length} imagens convertidas (${imagensPrincipais?.length || 0} principais + ${imagensFornecedor?.length || 0} fornecedor)`);
    return imagensCompativeis;
    
  } catch (error) {
    console.error('❌ [COMPAT] Erro ao processar via solução Manus:', error);
    throw error;
  }
};

/**
 * @deprecated Mantido para compatibilidade retroativa
 */
export const converterImagensParaDataURL = async (imagens: ImagemPosicionada[]): Promise<ImagemProcessada[]> => {
  console.warn('⚠️ [DEPRECATED] converterImagensParaDataURL: Use processarExcelCompletoCorrigido diretamente');
  
  const imagensProcessadas: ImagemProcessada[] = [];
  
  for (const img of imagens) {
    try {
      // Detectar tipo de imagem
      const tipo = detectarTipoImagem(img.dados);
      
      // Converter para base64
      const base64 = uint8ArrayToBase64(img.dados);
      const dataUrl = `data:${tipo};base64,${base64}`;
      
      imagensProcessadas.push({
        sku: img.sku || `LINHA-${img.linha}`,
        nome: img.nome,
        dataUrl: dataUrl,
        url: dataUrl, // Alias para compatibilidade
        linha: img.linha,
        coluna: img.coluna,
        tipoColuna: img.tipoColuna
      });
      
    } catch (error) {
      console.error(`❌ [COMPAT] Erro ao converter imagem ${img.nome}:`, error);
    }
  }
  
  return imagensProcessadas;
};

function detectarTipoImagem(dados: Uint8Array): string {
  if (dados[0] === 0x89 && dados[1] === 0x50 && dados[2] === 0x4E && dados[3] === 0x47) {
    return 'image/png';
  } else if (dados[0] === 0xFF && dados[1] === 0xD8 && dados[2] === 0xFF) {
    return 'image/jpeg';
  } else if (dados[0] === 0x47 && dados[1] === 0x49 && dados[2] === 0x46) {
    return 'image/gif';
  }
  return 'image/png'; // Fallback
}

function uint8ArrayToBase64(dados: Uint8Array): string {
  let binary = '';
  const len = dados.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(dados[i]);
  }
  return btoa(binary);
}
