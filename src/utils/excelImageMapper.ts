/**
 * Solução para extrair imagens do Excel na ordem correta
 * Baseado na solução da Manus - acessa estrutura XML interna do Excel
 */

import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export interface ImagemMapeada {
  sku: string;
  linha: number;
  nomeOriginal: string;
  nomeNovo: string;
  blob: Blob;
  url: string;
  coluna: number;
}

/**
 * Extrai imagens do Excel e as associa aos SKUs corretos
 * @param excelFile - Arquivo Excel (.xlsx)
 * @returns Array com imagens mapeadas aos SKUs corretos
 */
export async function extrairImagensOrdenadas(excelFile: File): Promise<ImagemMapeada[]> {
  console.log('🔍 [MANUS] Iniciando extração ordenada de imagens do Excel...');
  
  try {
    // 1. Ler SKUs do Excel
    const skus = await lerSKUsDoExcel(excelFile);
    console.log(`📋 [MANUS] Encontrados ${skus.length} SKUs`);
    
    // 2. Extrair e mapear imagens por posição
    const imagensMapeadas = await extrairImagensPorPosicao(excelFile, skus);
    console.log(`🖼️ [MANUS] Extraídas ${imagensMapeadas.length} imagens mapeadas`);
    
    return imagensMapeadas;
    
  } catch (error) {
    console.error('❌ [MANUS] Erro na extração:', error);
    throw error;
  }
}

/**
 * Lê os SKUs da coluna A do Excel
 */
async function lerSKUsDoExcel(excelFile: File): Promise<string[]> {
  const arrayBuffer = await excelFile.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  // Assumindo que SKU está na coluna A (índice 0) e primeira linha é header
  const skus = jsonData.slice(1).map(row => row[0]).filter(sku => sku) as string[];
  return skus;
}

/**
 * Extrai imagens e mapeia pela posição real no Excel
 */
async function extrairImagensPorPosicao(excelFile: File, skus: string[]): Promise<ImagemMapeada[]> {
  const arrayBuffer = await excelFile.arrayBuffer();
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(arrayBuffer);
  
  // 1. Encontrar arquivos de drawing e relacionamentos
  const drawingRelsFile = Object.keys(zipContent.files).find(name => 
    name.includes('xl/drawings/_rels') && name.endsWith('.xml.rels')
  );
  
  const drawingFile = Object.keys(zipContent.files).find(name => 
    name.includes('xl/drawings/') && name.endsWith('.xml') && !name.includes('_rels')
  );
  
  if (!drawingRelsFile || !drawingFile) {
    throw new Error('Arquivos de drawing não encontrados no Excel');
  }
  
  // 2. Mapear rId para nome de arquivo de imagem
  const relsContent = await zipContent.files[drawingRelsFile].async('text');
  const ridMap = extrairMapeamentoRIds(relsContent);
  console.log('🔗 [MANUS] Mapeamento rId:', ridMap);
  
  // 3. Extrair posições das imagens do XML
  const drawingContent = await zipContent.files[drawingFile].async('text');
  const posicoesImagens = extrairPosicoesDoXML(drawingContent, ridMap);
  console.log('📍 [MANUS] Posições extraídas:', posicoesImagens);
  
  // 4. Ordenar por linha e depois por coluna
  posicoesImagens.sort((a, b) => {
    if (a.linha !== b.linha) return a.linha - b.linha;
    return a.coluna - b.coluna;
  });
  
  // 5. Extrair blobs das imagens e criar mapeamento final
  const imagensMapeadas: ImagemMapeada[] = [];
  
  for (const posicao of posicoesImagens) {
    const linhaIdx = posicao.linha - 2; // -2 para ajustar ao índice da lista de SKUs (linha 2 = índice 0)
    
    if (linhaIdx >= 0 && linhaIdx < skus.length) {
      const sku = skus[linhaIdx];
      const caminhoImagem = `xl/media/${posicao.nomeArquivo}`;
      
      if (zipContent.files[caminhoImagem]) {
        const blob = await zipContent.files[caminhoImagem].async('blob');
        const extensao = posicao.nomeArquivo.split('.').pop() || 'png';
        
        imagensMapeadas.push({
          sku: sku,
          linha: posicao.linha,
          coluna: posicao.coluna,
          nomeOriginal: posicao.nomeArquivo,
          nomeNovo: `${sku}.${extensao}`,
          blob: blob,
          url: URL.createObjectURL(blob)
        });
        
        console.log(`✅ [MANUS] Linha ${posicao.linha}, Coluna ${posicao.coluna}: SKU '${sku}' -> '${posicao.nomeArquivo}'`);
      }
    }
  }
  
  return imagensMapeadas;
}

/**
 * Extrai mapeamento de rId para nome de arquivo do XML de relacionamentos
 */
function extrairMapeamentoRIds(xmlContent: string): Record<string, string> {
  const ridMap: Record<string, string> = {};
  
  // Parse simples do XML usando regex
  const relationshipRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let match;
  
  while ((match = relationshipRegex.exec(xmlContent)) !== null) {
    const [, rid, target] = match;
    if (target.includes('image')) {
      ridMap[rid] = target.split('/').pop() || ''; // Pega apenas o nome do arquivo
    }
  }
  
  return ridMap;
}

interface PosicaoImagem {
  linha: number;
  coluna: number;
  rid: string;
  nomeArquivo: string;
}

/**
 * Extrai posições das imagens do XML de drawing
 */
function extrairPosicoesDoXML(xmlContent: string, ridMap: Record<string, string>): PosicaoImagem[] {
  const posicoes: PosicaoImagem[] = [];
  
  // Regex para encontrar elementos twoCellAnchor
  const twoCellAnchorRegex = /<xdr:twoCellAnchor[^>]*>([\s\S]*?)<\/xdr:twoCellAnchor>/g;
  let match;
  
  while ((match = twoCellAnchorRegex.exec(xmlContent)) !== null) {
    const anchorContent = match[1];
    
    // Extrair posição "from" (onde a imagem começa)
    const fromMatch = /<xdr:from>([\s\S]*?)<\/xdr:from>/.exec(anchorContent);
    if (!fromMatch) continue;
    
    const fromContent = fromMatch[1];
    
    // Extrair linha e coluna
    const rowMatch = /<xdr:row>(\d+)<\/xdr:row>/.exec(fromContent);
    const colMatch = /<xdr:col>(\d+)<\/xdr:col>/.exec(fromContent);
    
    if (!rowMatch || !colMatch) continue;
    
    const linha = parseInt(rowMatch[1]) + 1; // +1 porque XML usa índice 0
    const coluna = parseInt(colMatch[1]) + 1;
    
    // Extrair rId da imagem
    const ridMatch = /r:embed="([^"]+)"/.exec(anchorContent);
    if (!ridMatch) continue;
    
    const rid = ridMatch[1];
    const nomeArquivo = ridMap[rid];
    
    if (nomeArquivo) {
      posicoes.push({
        linha,
        coluna,
        rid,
        nomeArquivo
      });
    }
  }
  
  return posicoes;
}

/**
 * Função principal para integração no sistema Lovable
 * Retorna imagens processadas com informações de coluna
 */
export async function processarExcelCorrigido(arquivo: File) {
  console.log('🚀 [MANUS] Processando Excel com correção de ordenação...');
  
  try {
    // Extrair imagens na ordem correta
    const imagensMapeadas = await extrairImagensOrdenadas(arquivo);
    
    // Agrupar por linha e determinar qual coluna (B ou C)
    const imagensPorLinha = new Map<number, ImagemMapeada[]>();
    
    for (const img of imagensMapeadas) {
      if (!imagensPorLinha.has(img.linha)) {
        imagensPorLinha.set(img.linha, []);
      }
      imagensPorLinha.get(img.linha)!.push(img);
    }
    
    // Processar e atribuir colunas
    const imagensProcessadas = imagensMapeadas.map((img, index) => {
      const imagensDaLinha = imagensPorLinha.get(img.linha) || [];
      imagensDaLinha.sort((a, b) => a.coluna - b.coluna);
      
      const posicaoNaLinha = imagensDaLinha.indexOf(img);
      const tipoColuna = posicaoNaLinha === 0 ? 'IMAGEM' : 'IMAGEM_FORNECEDOR';
      
      console.log(`📊 [MANUS] SKU ${img.sku} - Linha ${img.linha}, Coluna Excel ${img.coluna} -> ${tipoColuna}`);
      
      return {
        nome: img.nomeNovo,
        url: img.url,
        linha: img.linha,
        sku: img.sku,
        blob: img.blob,
        indice: index,
        tipoColuna: tipoColuna,
        colunaExcel: img.coluna
      };
    });
    
    console.log(`✅ [MANUS] Processamento concluído: ${imagensProcessadas.length} imagens ordenadas`);
    return imagensProcessadas;
    
  } catch (error) {
    console.error('❌ [MANUS] Erro no processamento:', error);
    throw error;
  }
}
