import { toast } from 'sonner';

export interface ImagemProcessada {
  sku: string;
  linha: number;
  arquivoOriginal: string;
  arquivoRenomeado: string;
  blob: Blob;
  sucesso: boolean;
  erro?: string;
}

export interface SKULinhaMapping {
  sku: string;
  linhas: number[]; // Array para suportar SKUs duplicados
}

export interface ProcessamentoResult {
  processadas: ImagemProcessada[];
  rejeitadas: string[];
  renomeadas: number;
  erros: string[];
}

// CLASSE PARA PROCESSAR IMAGENS INDIVIDUALMENTE POR SKU
export class ImagemSKUProcessor {
  private skuLinhasMap = new Map<string, number[]>(); // MultiMap usando Array
  
  // EXTRAIR SKU DO FILENAME COM PADRÕES ESPECÍFICOS
  private extrairSKUDoFilename(filename: string): string | null {
    const nomeArquivo = filename.split('/').pop() || filename;
    
    const padroes = [
      /^([A-Z]{2,4}-\d+)/i,           // CMD-433, FL-62, IC-22 no início
      /([A-Z]{2,4}-\d+)/i,           // Qualquer lugar no nome
      /^(\w{2,10}-\d+)/i,            // Padrão genérico XXXX-123 no início
      /(\w{2,10}-\d+)/i              // Padrão genérico em qualquer posição
    ];
    
    for (const padrao of padroes) {
      const match = nomeArquivo.match(padrao);
      if (match) {
        const sku = match[1].toUpperCase();
        console.log(`🔍 [SKU_PROCESSOR] "${nomeArquivo}" → SKU: "${sku}"`);
        return sku;
      }
    }
    
    console.warn(`⚠️ [SKU_PROCESSOR] Nenhum SKU encontrado em: "${nomeArquivo}"`);
    return null;
  }

  // CONSTRUIR MAPA SKU → LINHAS (SUPORTE A DUPLICATAS)
  public construirMapaSkuLinhas(worksheet: any): void {
    console.log('🏗️ [SKU_PROCESSOR] Construindo mapa SKU → Linhas...');
    
    this.skuLinhasMap.clear();
    
    Object.keys(worksheet).forEach(cellKey => {
      const match = cellKey.match(/^A(\d+)$/);
      if (match) {
        const linha = parseInt(match[1]);
        if (linha > 1) { // Pular cabeçalho
          const skuCell = worksheet[cellKey];
          const sku = skuCell?.v ? String(skuCell.v).trim().toUpperCase() : '';
          
          if (sku) {
            // USAR ARRAY PARA PERMITIR SKUS DUPLICADOS
            if (!this.skuLinhasMap.has(sku)) {
              this.skuLinhasMap.set(sku, []);
            }
            this.skuLinhasMap.get(sku)!.push(linha);
          }
        }
      }
    });
    
    console.log(`📊 [SKU_PROCESSOR] Mapa construído: ${this.skuLinhasMap.size} SKUs únicos`);
    
    // Log de SKUs duplicados
    this.skuLinhasMap.forEach((linhas, sku) => {
      if (linhas.length > 1) {
        console.warn(`⚠️ [SKU_PROCESSOR] SKU DUPLICADO: "${sku}" nas linhas [${linhas.join(', ')}]`);
      }
    });
  }

  // RENOMEAR ARQUIVO COM SKU
  private renomearComSKU(arquivoOriginal: string, sku: string, linha: number): string {
    const extensao = arquivoOriginal.split('.').pop()?.toLowerCase() || 'jpg';
    const arquivoRenomeado = `${sku}-L${linha}.${extensao}`;
    
    console.log(`📝 [SKU_PROCESSOR] RENOMEAÇÃO: "${arquivoOriginal}" → "${arquivoRenomeado}"`);
    return arquivoRenomeado;
  }

  // PROCESSAR IMAGEM INDIVIDUAL
  private async processarImagemIndividual(
    mediaFile: string, 
    imageBlob: Blob, 
    indice: number
  ): Promise<ImagemProcessada | null> {
    
    console.log(`🎯 [SKU_PROCESSOR] Processando imagem ${indice + 1}: ${mediaFile}`);
    
    // 1. EXTRAIR SKU DO FILENAME
    const skuExtraido = this.extrairSKUDoFilename(mediaFile);
    if (!skuExtraido) {
      console.error(`❌ [SKU_PROCESSOR] Sem SKU válido: ${mediaFile}`);
      return null;
    }
    
    // 2. BUSCAR LINHAS CORRESPONDENTES AO SKU
    const linhas = this.skuLinhasMap.get(skuExtraido);
    if (!linhas || linhas.length === 0) {
      console.error(`❌ [SKU_PROCESSOR] SKU "${skuExtraido}" não encontrado no Excel: ${mediaFile}`);
      return null;
    }
    
    // 3. ESCOLHER LINHA (primeira disponível se houver duplicatas)
    const linha = linhas[0]; // Por enquanto, usar primeira linha
    
    // 4. RENOMEAR ARQUIVO COM SKU
    const arquivoRenomeado = this.renomearComSKU(mediaFile, skuExtraido, linha);
    
    // 5. CRIAR RESULTADO
    const resultado: ImagemProcessada = {
      sku: skuExtraido,
      linha,
      arquivoOriginal: mediaFile,
      arquivoRenomeado,
      blob: imageBlob,
      sucesso: true
    };
    
    console.log(`✅ [SKU_PROCESSOR] SUCESSO: ${mediaFile} → SKU ${skuExtraido} → Linha ${linha}`);
    return resultado;
  }

  // PROCESSAR TODAS AS IMAGENS INDEPENDENTEMENTE
  public async processarImagensIndividualmente(
    zipData: any, 
    mediaFiles: string[]
  ): Promise<ProcessamentoResult> {
    
    console.log(`🚀 [SKU_PROCESSOR] Iniciando processamento individual de ${mediaFiles.length} imagens...`);
    
    const processadas: ImagemProcessada[] = [];
    const rejeitadas: string[] = [];
    const erros: string[] = [];
    let renomeadas = 0;
    
    // PROCESSAR CADA IMAGEM INDEPENDENTEMENTE
    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i];
      
      try {
        // Extrair blob da imagem
        const imageBlob = await zipData.files[mediaFile].async('blob');
        
        if (imageBlob.size === 0) {
          console.warn(`⚠️ [SKU_PROCESSOR] Arquivo vazio: ${mediaFile}`);
          rejeitadas.push(mediaFile);
          continue;
        }
        
        // Processar individualmente
        const resultado = await this.processarImagemIndividual(mediaFile, imageBlob, i);
        
        if (resultado) {
          processadas.push(resultado);
          renomeadas++;
        } else {
          rejeitadas.push(mediaFile);
        }
        
      } catch (error) {
        const mensagemErro = `Erro ao processar ${mediaFile}: ${error}`;
        console.error(`❌ [SKU_PROCESSOR] ${mensagemErro}`);
        erros.push(mensagemErro);
        rejeitadas.push(mediaFile);
      }
    }
    
    const resultado: ProcessamentoResult = {
      processadas,
      rejeitadas,
      renomeadas,
      erros
    };
    
    console.log(`🎯 [SKU_PROCESSOR] Processamento concluído:`, {
      totalImagens: mediaFiles.length,
      processadas: processadas.length,
      rejeitadas: rejeitadas.length,
      renomeadas,
      erros: erros.length
    });
    
    return resultado;
  }

  // OBTER ESTATÍSTICAS DO MAPEAMENTO
  public obterEstatisticas() {
    let totalLinhas = 0;
    let skusComDuplicatas = 0;
    
    this.skuLinhasMap.forEach((linhas, sku) => {
      totalLinhas += linhas.length;
      if (linhas.length > 1) {
        skusComDuplicatas++;
      }
    });
    
    return {
      skusUnicos: this.skuLinhasMap.size,
      totalLinhas,
      skusComDuplicatas,
      skusSemDuplicatas: this.skuLinhasMap.size - skusComDuplicatas
    };
  }
}

// HOOK PARA USAR O PROCESSOR
export const useImagemSKUProcessor = () => {
  const processor = new ImagemSKUProcessor();
  
  return {
    construirMapaSkuLinhas: processor.construirMapaSkuLinhas.bind(processor),
    processarImagensIndividualmente: processor.processarImagensIndividualmente.bind(processor),
    obterEstatisticas: processor.obterEstatisticas.bind(processor)
  };
};