/**
 * 🚀 SOLUÇÃO MANUS COMPLETA - Extração de Imagens do Excel
 * 
 * Extrai imagens das colunas B e C do Excel baseado na posição real XML:
 * - Coluna B: IMAGEM (imagem principal do produto)
 * - Coluna C: IMAGEM FORNECEDOR (imagem do fornecedor)
 * 
 * Nomenclatura automática:
 * - Coluna B: CMD-34.png
 * - Coluna C: CMD-34_fornecedor.png
 */

import JSZip from 'jszip';
import * as XLSX from 'xlsx';

/**
 * Extrai imagens de ambas as colunas (B e C) e as associa aos SKUs corretos
 * @param {File} excelFile - Arquivo Excel (.xlsx)
 * @returns {Promise<Object>} Objeto com imagens principais e de fornecedor mapeadas
 */
export async function extrairTodasImagensOrdenadas(excelFile) {
  console.log('🔍 Iniciando extração completa de imagens do Excel...');
  
  try {
    // 1. Ler SKUs do Excel
    const skus = await lerSKUsDoExcel(excelFile);
    console.log(`📋 Encontrados ${skus.length} SKUs`);
    
    // 2. Extrair e mapear todas as imagens por posição
    const todasImagens = await extrairTodasImagensPorPosicao(excelFile, skus);
    
    console.log(`📊 [DEBUG_TODAS_COLUNAS] Total de imagens extraídas: ${todasImagens.length}`);
    
    // Analisar distribuição por coluna
    const imagensPorColuna = todasImagens.reduce((acc, img) => {
      acc[img.coluna] = (acc[img.coluna] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log(`📊 [DEBUG_DISTRIBUICAO] Distribuição de imagens por coluna:`, imagensPorColuna);
    console.log(`📊 [DEBUG_DISTRIBUICAO] Primeiras 5 imagens:`, todasImagens.slice(0, 5).map(img => ({
      sku: img.sku,
      linha: img.linha,
      coluna: img.coluna,
      nome: img.nomeOriginal
    })));
    
    // 3. Separar por tipo (coluna B = principais, coluna C = fornecedor)
    const imagensPrincipais = todasImagens.filter(img => img.coluna === 2); // Coluna B = índice 2
    const imagensFornecedor = todasImagens.filter(img => img.coluna === 3); // Coluna C = índice 3
    
    console.log(`🖼️ Extraídas ${imagensPrincipais.length} imagens principais (coluna B = índice 2)`);
    console.log(`🏭 Extraídas ${imagensFornecedor.length} imagens de fornecedor (coluna C = índice 3)`);
    
    return {
      imagensPrincipais,
      imagensFornecedor,
      total: todasImagens.length
    };
    
  } catch (error) {
    console.error('❌ Erro na extração:', error);
    throw error;
  }
}

/**
 * Lê os SKUs da coluna A do Excel
 */
async function lerSKUsDoExcel(excelFile) {
  const arrayBuffer = await excelFile.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // SKU está na coluna A (índice 0) e primeira linha é header
  const skus = jsonData.slice(1).map(row => row[0]).filter(sku => sku);
  return skus;
}

/**
 * Extrai todas as imagens e mapeia pela posição real no Excel
 */
async function extrairTodasImagensPorPosicao(excelFile, skus) {
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
  console.log('🔗 Mapeamento rId:', ridMap);
  
  // 3. Extrair posições das imagens do XML
  const drawingContent = await zipContent.files[drawingFile].async('text');
  const posicoesImagens = extrairPosicoesDoXML(drawingContent, ridMap);
  console.log('📍 Posições extraídas:', posicoesImagens);
  
  // 4. Agrupar imagens por linha para identificar principal vs fornecedor
  const imagensPorLinha: Record<number, Array<{linha: number; coluna: number; rid: string; nomeArquivo: string}>> = {};
  
  for (const img of posicoesImagens) {
    if (!imagensPorLinha[img.linha]) imagensPorLinha[img.linha] = [];
    imagensPorLinha[img.linha].push(img);
  }
  
  console.log('📊 [DEBUG_AGRUPAMENTO] Imagens agrupadas por linha:', 
    Object.entries(imagensPorLinha).map(([linha, imgs]) => ({
      linha,
      quantidade: imgs.length
    }))
  );
  
  // 5. Extrair blobs e criar mapeamento final com tipo correto
  const todasImagensMapeadas = [];
  
  for (const [linhaStr, imagensDaLinha] of Object.entries(imagensPorLinha)) {
    const linha = parseInt(linhaStr);
    const linhaIdx = linha - 2; // -2 para ajustar ao índice da lista de SKUs
    
    if (linhaIdx >= 0 && linhaIdx < skus.length) {
      const sku = skus[linhaIdx];
      
      // Ordenar por coluna para garantir ordem correta
      imagensDaLinha.sort((a, b) => a.coluna - b.coluna);
      
      for (let i = 0; i < imagensDaLinha.length; i++) {
        const posicao = imagensDaLinha[i];
        const caminhoImagem = `xl/media/${posicao.nomeArquivo}`;
        
        if (zipContent.files[caminhoImagem]) {
          const blob = await zipContent.files[caminhoImagem].async('blob');
          
          // Determinar tipo baseado na posição dentro da linha
          // 1ª imagem = principal (coluna B)
          // 2ª imagem = fornecedor (coluna C)
          const tipoImagem = i === 0 ? 'principal' : 'fornecedor';
          const colunaReal = i === 0 ? 2 : 3; // B=2, C=3
          
          const sufixo = tipoImagem === 'fornecedor' ? '_fornecedor' : '';
          const extensao = posicao.nomeArquivo.split('.').pop();
          
          todasImagensMapeadas.push({
            sku: sku,
            linha: posicao.linha,
            coluna: colunaReal,
            tipo: tipoImagem,
            nomeOriginal: posicao.nomeArquivo,
            nomeNovo: `${sku}${sufixo}.${extensao}`,
            blob: blob,
            url: URL.createObjectURL(blob)
          });
          
          const colunaTexto = tipoImagem === 'principal' ? 'B (IMAGEM)' : 'C (IMAGEM FORNECEDOR)';
          
          console.log(`✅ Linha ${posicao.linha}, Coluna ${colunaTexto}: SKU '${sku}' -> '${posicao.nomeArquivo}' (${i + 1}ª imagem da linha)`);
        }
      }
    }
  }
  
  return todasImagensMapeadas;
}

/**
 * Extrai mapeamento de rId para nome de arquivo do XML de relacionamentos
 */
function extrairMapeamentoRIds(xmlContent) {
  const ridMap = {};
  
  const relationshipRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let match;
  
  while ((match = relationshipRegex.exec(xmlContent)) !== null) {
    const [, rid, target] = match;
    if (target.includes('image')) {
      ridMap[rid] = target.split('/').pop();
    }
  }
  
  return ridMap;
}

/**
 * Extrai posições das imagens do XML de drawing
 */
function extrairPosicoesDoXML(xmlContent, ridMap) {
  const posicoes = [];
  
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
    
    const rowRaw = parseInt(rowMatch[1]);
    const colRaw = parseInt(colMatch[1]);
    const linha = rowRaw + 1; // +1 porque XML usa índice 0
    const coluna = colRaw + 1;
    
    // Extrair rId da imagem
    const ridMatch = /r:embed="([^"]+)"/.exec(anchorContent);
    
    console.log(`🔍 [DEBUG_XML_RAW] XML bruto: row=${rowRaw}, col=${colRaw} | Convertido: linha=${linha}, coluna=${coluna} | rid=${ridMatch ? ridMatch[1] : 'N/A'}`);
    
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
 * Processa ambas as colunas de imagem
 */
export async function processarExcelCompletoCorrigido(arquivo) {
  console.log('🚀 Processando Excel completo com correção de ordenação...');
  
  try {
    // Extrair todas as imagens na ordem correta
    const { imagensPrincipais, imagensFornecedor } = await extrairTodasImagensOrdenadas(arquivo);
    
    // Converter para formato esperado pelo sistema
    const imagensPrincipaisProcessadas = imagensPrincipais.map((img, index) => ({
      nome: img.nomeNovo,
      url: img.url,
      linha: img.linha,
      coluna: img.coluna,
      sku: img.sku,
      blob: img.blob,
      tipo: 'principal',
      indice: index
    }));
    
    const imagensFornecedorProcessadas = imagensFornecedor.map((img, index) => ({
      nome: img.nomeNovo,
      url: img.url,
      linha: img.linha,
      coluna: img.coluna,
      sku: img.sku,
      blob: img.blob,
      tipo: 'fornecedor',
      indice: index
    }));
    
    console.log(`✅ Processamento concluído:`);
    console.log(`   - ${imagensPrincipaisProcessadas.length} imagens principais (coluna B)`);
    console.log(`   - ${imagensFornecedorProcessadas.length} imagens de fornecedor (coluna C)`);
    
    return {
      imagensPrincipais: imagensPrincipaisProcessadas,
      imagensFornecedor: imagensFornecedorProcessadas,
      total: imagensPrincipaisProcessadas.length + imagensFornecedorProcessadas.length
    };
    
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    throw error;
  }
}

/**
 * Função específica para extrair apenas imagens de fornecedor (coluna C)
 * NOVA ABORDAGEM: Extrai imagens pela posição XML SEM tentar agrupar por linha
 */
export async function extrairImagensFornecedorPorXML(excelFile: File) {
  console.log('🏭 [FORNECEDOR_XML] Extraindo imagens da coluna C via XML...');
  
  try {
    const arrayBuffer = await excelFile.arrayBuffer();
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    
    // Encontrar arquivos de drawing
    const drawingRelsFile = Object.keys(zipContent.files).find(name => 
      name.includes('xl/drawings/_rels') && name.endsWith('.xml.rels')
    );
    
    const drawingFile = Object.keys(zipContent.files).find(name => 
      name.includes('xl/drawings/') && name.endsWith('.xml') && !name.includes('_rels')
    );
    
    if (!drawingRelsFile || !drawingFile) {
      console.log('⚠️ [FORNECEDOR_XML] Arquivos de drawing não encontrados');
      return [];
    }
    
    // Mapear rId para nome de arquivo
    const relsContent = await zipContent.files[drawingRelsFile].async('text');
    const ridMap = extrairMapeamentoRIds(relsContent);
    
    // Extrair posições do XML
    const drawingContent = await zipContent.files[drawingFile].async('text');
    
    // Ler SKUs do Excel
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const skus = jsonData.slice(1).map((row: any) => row[0]).filter((sku: any) => sku);
    
    // Extrair TODAS as posições sem filtro
    const posicoes: Array<{linha: number; coluna: number; rid: string; nomeArquivo: string}> = [];
    
    const twoCellAnchorRegex = /<xdr:twoCellAnchor[^>]*>([\s\S]*?)<\/xdr:twoCellAnchor>/g;
    let match;
    
    while ((match = twoCellAnchorRegex.exec(drawingContent)) !== null) {
      const anchorContent = match[1];
      
      const fromMatch = /<xdr:from>([\s\S]*?)<\/xdr:from>/.exec(anchorContent);
      if (!fromMatch) continue;
      
      const fromContent = fromMatch[1];
      const rowMatch = /<xdr:row>(\d+)<\/xdr:row>/.exec(fromContent);
      const colMatch = /<xdr:col>(\d+)<\/xdr:col>/.exec(fromContent);
      
      if (!rowMatch || !colMatch) continue;
      
      const linha = parseInt(rowMatch[1]) + 1;
      const coluna = parseInt(colMatch[1]) + 1;
      
      const ridMatch = /r:embed="([^"]+)"/.exec(anchorContent);
      if (!ridMatch) continue;
      
      const rid = ridMatch[1];
      const nomeArquivo = ridMap[rid];
      
      if (nomeArquivo) {
        posicoes.push({ linha, coluna, rid, nomeArquivo });
        console.log(`🔍 [FORNECEDOR_XML] Imagem encontrada: linha=${linha}, coluna=${coluna}, arquivo=${nomeArquivo}`);
      }
    }
    
    console.log(`📊 [FORNECEDOR_XML] Total de imagens no XML: ${posicoes.length}`);
    
    // Agrupar imagens por linha
    const imagensPorLinha: Record<number, Array<{linha: number; coluna: number; rid: string; nomeArquivo: string}>> = {};
    
    for (const posicao of posicoes) {
      if (!imagensPorLinha[posicao.linha]) {
        imagensPorLinha[posicao.linha] = [];
      }
      imagensPorLinha[posicao.linha].push(posicao);
    }
    
    console.log(`📊 [FORNECEDOR_XML] Linhas com imagens:`, 
      Object.entries(imagensPorLinha).map(([linha, imgs]) => ({
        linha,
        quantidade: imgs.length
      }))
    );
    
    // Extrair apenas a SEGUNDA imagem de cada linha (fornecedor)
    const imagensColunaC = [];
    
    for (const [linhaStr, imagensDaLinha] of Object.entries(imagensPorLinha)) {
      const linha = parseInt(linhaStr);
      
      // Se houver mais de uma imagem nesta linha, a segunda é o fornecedor
      if (imagensDaLinha.length >= 2) {
        // Ordenar por coluna para garantir ordem
        imagensDaLinha.sort((a, b) => a.coluna - b.coluna);
        
        const posicaoFornecedor = imagensDaLinha[1]; // 2ª imagem = fornecedor
        const linhaIdx = linha - 2;
        
        if (linhaIdx >= 0 && linhaIdx < skus.length) {
          const sku = skus[linhaIdx];
          const caminhoImagem = `xl/media/${posicaoFornecedor.nomeArquivo}`;
          
          if (zipContent.files[caminhoImagem]) {
            const blob = await zipContent.files[caminhoImagem].async('blob');
            const extensao = posicaoFornecedor.nomeArquivo.split('.').pop();
            
            imagensColunaC.push({
              sku: sku,
              linha: linha,
              coluna: 3,
              tipo: 'fornecedor',
              nomeOriginal: posicaoFornecedor.nomeArquivo,
              nomeNovo: `${sku}_fornecedor.${extensao}`,
              blob: blob,
              url: URL.createObjectURL(blob)
            });
            
            console.log(`✅ [FORNECEDOR_XML] Linha ${linha}: SKU '${sku}' -> '${posicaoFornecedor.nomeArquivo}' (2ª imagem da linha)`);
          }
        }
      }
    }
    
    console.log(`🏭 [FORNECEDOR_XML] ${imagensColunaC.length} imagens de fornecedor extraídas`);
    return imagensColunaC;
    
  } catch (error) {
    console.error('❌ [FORNECEDOR_XML] Erro:', error);
    return [];
  }
}

// Exemplo de uso no componente React
/*
const handleFileUpload = async (file) => {
  try {
    setLoading(true);
    
    // Opção 1: Extrair todas as imagens
    const { imagensPrincipais, imagensFornecedor } = await processarExcelCompletoCorrigido(file);
    
    // Atualizar estados separados
    setImagensPrincipais(imagensPrincipais);
    setImagensFornecedor(imagensFornecedor);
    
    // Opção 2: Extrair apenas um tipo
    // const imagensFornecedor = await extrairImagensFornecedor(file);
    // setImagensFornecedor(imagensFornecedor);
    
    console.log('Imagens principais:', imagensPrincipais);
    console.log('Imagens fornecedor:', imagensFornecedor);
    
  } catch (error) {
    console.error('Erro no upload:', error);
    setError('Erro ao processar arquivo Excel');
  } finally {
    setLoading(false);
  }
};
*/
