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
    
    // 3. Separar por tipo (coluna B = principais, coluna C = fornecedor)
    const imagensPrincipais = todasImagens.filter(img => img.coluna === 2); // Coluna B = índice 2
    const imagensFornecedor = todasImagens.filter(img => img.coluna === 3); // Coluna C = índice 3
    
    console.log(`🖼️ Extraídas ${imagensPrincipais.length} imagens principais (coluna B)`);
    console.log(`🏭 Extraídas ${imagensFornecedor.length} imagens de fornecedor (coluna C)`);
    
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
  
  // 4. Ordenar por linha e mapear com SKUs
  posicoesImagens.sort((a, b) => a.linha - b.linha);
  
  // 5. Extrair blobs das imagens e criar mapeamento final
  const todasImagensMapeadas = [];
  
  for (const posicao of posicoesImagens) {
    const linhaIdx = posicao.linha - 2; // -2 para ajustar ao índice da lista de SKUs
    
    if (linhaIdx >= 0 && linhaIdx < skus.length) {
      const sku = skus[linhaIdx];
      const caminhoImagem = `xl/media/${posicao.nomeArquivo}`;
      
      if (zipContent.files[caminhoImagem]) {
        const blob = await zipContent.files[caminhoImagem].async('blob');
        
        // Determinar tipo da imagem baseado na coluna
        const tipoImagem = posicao.coluna === 2 ? 'principal' : 
                          posicao.coluna === 3 ? 'fornecedor' : 'outro';
        
        const sufixo = tipoImagem === 'fornecedor' ? '_fornecedor' : '';
        const extensao = posicao.nomeArquivo.split('.').pop();
        
        todasImagensMapeadas.push({
          sku: sku,
          linha: posicao.linha,
          coluna: posicao.coluna,
          tipo: tipoImagem,
          nomeOriginal: posicao.nomeArquivo,
          nomeNovo: `${sku}${sufixo}.${extensao}`,
          blob: blob,
          url: URL.createObjectURL(blob)
        });
        
        const colunaTexto = posicao.coluna === 2 ? 'B (IMAGEM)' : 
                           posicao.coluna === 3 ? 'C (IMAGEM FORNECEDOR)' : 
                           `${posicao.coluna}`;
        
        console.log(`✅ Linha ${posicao.linha}, Coluna ${colunaTexto}: SKU '${sku}' -> '${posicao.nomeArquivo}'`);
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
 */
export async function extrairImagensFornecedor(excelFile) {
  console.log('🏭 Extraindo apenas imagens de fornecedor (coluna C)...');
  
  const { imagensFornecedor } = await extrairTodasImagensOrdenadas(excelFile);
  return imagensFornecedor;
}

/**
 * Função específica para extrair apenas imagens principais (coluna B)
 */
export async function extrairImagensPrincipais(excelFile) {
  console.log('🖼️ Extraindo apenas imagens principais (coluna B)...');
  
  const { imagensPrincipais } = await extrairTodasImagensOrdenadas(excelFile);
  return imagensPrincipais;
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
