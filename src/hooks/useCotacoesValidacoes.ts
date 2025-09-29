import { toast } from 'sonner';

export interface ValidacaoExcel {
  sucesso: boolean;
  erros: string[];
  avisos: string[];
  skusDuplicados: string[];
  skusVazios: number[];
}

export interface MapeamentoSKU {
  sku: string;
  linha: number;
  temImagem: boolean;
  arquivo?: string;
}

export interface ResultadoMapeamentoSKU {
  mapeados: number;
  rejeitados: number;
  mapeamentos: MapeamentoSKU[];
}

// VALIDAÇÃO PRÉ-UPLOAD OBRIGATÓRIA
export const validarEstruturaExcel = async (worksheet: any): Promise<ValidacaoExcel> => {
  const erros: string[] = [];
  const avisos: string[] = [];
  const skusDuplicados: string[] = [];
  const skusVazios: number[] = [];
  
  console.log('🔍 [VALIDAÇÃO] Iniciando validação obrigatória do Excel...');
  
  // Extrair todos os SKUs do worksheet
  const skusEncontrados = new Map<string, number[]>();
  let totalLinhas = 0;
  
  // Procurar por todas as células que começam com A (coluna SKU)
  Object.keys(worksheet).forEach(cellKey => {
    const match = cellKey.match(/^A(\d+)$/);
    if (match) {
      const linha = parseInt(match[1]);
      if (linha > 1) { // Pular cabeçalho
        totalLinhas++;
        const skuCell = worksheet[cellKey];
        const sku = skuCell?.v ? String(skuCell.v).trim() : '';
        
        if (!sku || sku === '') {
          skusVazios.push(linha);
          erros.push(`Linha ${linha}: SKU vazio ou inválido`);
        } else {
          // Verificar duplicatas
          if (!skusEncontrados.has(sku)) {
            skusEncontrados.set(sku, []);
          }
          skusEncontrados.get(sku)!.push(linha);
        }
      }
    }
  });
  
  // Identificar SKUs duplicados
  skusEncontrados.forEach((linhas, sku) => {
    if (linhas.length > 1) {
      skusDuplicados.push(sku);
      erros.push(`SKU duplicado "${sku}" encontrado nas linhas: ${linhas.join(', ')}`);
    }
  });
  
  console.log('📊 [VALIDAÇÃO] Estatísticas:', {
    totalLinhas,
    skusValidos: skusEncontrados.size - skusDuplicados.length,
    skusVazios: skusVazios.length,
    skusDuplicados: skusDuplicados.length,
    errosCriticos: erros.length
  });
  
  const sucesso = erros.length === 0;
  
  if (!sucesso) {
    console.error('❌ [VALIDAÇÃO] Upload BLOQUEADO devido a erros críticos:', erros);
    toast.error(`Upload bloqueado: ${erros.length} erro(s) encontrado(s)`);
  } else {
    console.log('✅ [VALIDAÇÃO] Estrutura do Excel aprovada para upload');
    toast.success('Estrutura do Excel validada com sucesso');
  }
  
  return {
    sucesso,
    erros,
    avisos,
    skusDuplicados,
    skusVazios
  };
};

// MAPEAR IMAGENS POR SKU NO FILENAME
export const mapearImagensPorSKU = async (
  mediaFiles: string[], 
  worksheet: any
): Promise<ResultadoMapeamentoSKU> => {
  console.log('🎯 [MAPEAMENTO] Iniciando mapeamento por SKU...');
  
  const mapeamentos: MapeamentoSKU[] = [];
  let mapeados = 0;
  let rejeitados = 0;
  
  // Extrair todos os SKUs válidos e suas linhas
  const skusWorksheet = new Map<string, number>();
  Object.keys(worksheet).forEach(cellKey => {
    const match = cellKey.match(/^A(\d+)$/);
    if (match) {
      const linha = parseInt(match[1]);
      if (linha > 1) { // Pular cabeçalho
        const skuCell = worksheet[cellKey];
        const sku = skuCell?.v ? String(skuCell.v).trim() : '';
        if (sku) {
          skusWorksheet.set(sku, linha);
        }
      }
    }
  });
  
  console.log(`📋 [MAPEAMENTO] SKUs no Excel: ${skusWorksheet.size}`);
  
  // Processar cada imagem
  mediaFiles.forEach((mediaFile, index) => {
    const skuExtraido = extrairSKUDoFilename(mediaFile);
    const nomeArquivo = mediaFile.split('/').pop() || mediaFile;
    
    console.log(`🔍 [MAPEAMENTO] ${index + 1}/${mediaFiles.length}: "${nomeArquivo}" → SKU: "${skuExtraido || 'NÃO ENCONTRADO'}"`);
    
    if (skuExtraido && skusWorksheet.has(skuExtraido)) {
      const linha = skusWorksheet.get(skuExtraido)!;
      mapeamentos.push({
        sku: skuExtraido,
        linha,
        temImagem: true,
        arquivo: mediaFile
      });
      mapeados++;
      console.log(`✅ [MAPEAMENTO] SUCESSO: ${nomeArquivo} → SKU ${skuExtraido} → Linha ${linha}`);
    } else {
      rejeitados++;
      console.warn(`❌ [MAPEAMENTO] REJEITADO: ${nomeArquivo} - SKU "${skuExtraido}" não encontrado no Excel`);
    }
  });
  
  // Identificar SKUs sem imagem
  skusWorksheet.forEach((linha, sku) => {
    const temImagem = mapeamentos.some(m => m.sku === sku);
    if (!temImagem) {
      mapeamentos.push({
        sku,
        linha,
        temImagem: false
      });
      console.log(`⚠️ [MAPEAMENTO] SKU SEM IMAGEM: ${sku} (Linha ${linha})`);
    }
  });
  
  console.log(`🎯 [MAPEAMENTO] Resultado Final:`, {
    totalImagens: mediaFiles.length,
    mapeados,
    rejeitados,
    skusSemImagem: mapeamentos.filter(m => !m.temImagem).length
  });
  
  return {
    mapeados,
    rejeitados,
    mapeamentos
  };
};

// EXTRAIR SKU DO FILENAME
export const extrairSKUDoFilename = (filename: string): string | null => {
  const nomeArquivo = filename.split('/').pop() || filename;
  
  // Padrões para extrair SKU do filename
  const padroes = [
    /^([A-Z]{2,4}-\d+)/i,           // CMD-433, FL-62, IC-22
    /([A-Z]{2,4}-\d+)/i,           // Qualquer lugar no nome
    /^(\w{2,10}-\d+)/i,            // Padrão genérico XXXX-123
    /(\w{2,10}-\d+)/i              // Padrão genérico em qualquer posição
  ];
  
  for (const padrao of padroes) {
    const match = nomeArquivo.match(padrao);
    if (match) {
      const sku = match[1].toUpperCase();
      console.log(`🔍 [EXTRAÇÃO] "${nomeArquivo}" → SKU: "${sku}"`);
      return sku;
    }
  }
  
  console.warn(`⚠️ [EXTRAÇÃO] Nenhum SKU encontrado em: "${nomeArquivo}"`);
  return null;
};

// VALIDAR CORRESPONDÊNCIA IMAGEM ↔ SKU
export const validarCorrespondenciaImagemSKU = (filename: string, skuLinha: string): boolean => {
  const skuFilename = extrairSKUDoFilename(filename);
  
  if (!skuFilename) {
    console.warn(`⚠️ [VALIDAÇÃO] Sem SKU no filename: ${filename}`);
    return false;
  }
  
  const corresponde = skuFilename.toUpperCase() === skuLinha.toUpperCase();
  
  if (!corresponde) {
    console.warn(`❌ [VALIDAÇÃO] MISMATCH: Filename "${skuFilename}" ≠ Linha "${skuLinha}"`);
  } else {
    console.log(`✅ [VALIDAÇÃO] MATCH: Filename "${skuFilename}" = Linha "${skuLinha}"`);
  }
  
  return corresponde;
};

// SISTEMA DE CORREÇÕES PENDENTES
const correcoesPendentes: Array<{
  arquivo: string;
  skuLinha: string;
  linha: number;
  timestamp: Date;
}> = [];

export const adicionarCorrecaoPendente = (arquivo: string, skuLinha: string, linha: number) => {
  correcoesPendentes.push({
    arquivo,
    skuLinha,
    linha,
    timestamp: new Date()
  });
  
  console.log(`📝 [CORREÇÃO] Adicionada correção pendente: ${arquivo} ↔ ${skuLinha} (Linha ${linha})`);
};

export const obterCorrecoesPendentes = () => {
  return [...correcoesPendentes];
};

export const limparCorrecoesPendentes = () => {
  const total = correcoesPendentes.length;
  correcoesPendentes.length = 0;
  console.log(`🧹 [CORREÇÃO] ${total} correções pendentes removidas`);
};