// src/utils/excelImageExtractor.ts - VERSÃO CORRIGIDA PARA POSICIONAMENTO

import JSZip from 'jszip';
import * as XLSX from 'xlsx';

interface ImagemPosicionada {
  nome: string;
  dados: Uint8Array;
  linha: number;
  coluna: number;
  sku?: string;
}

interface ImagemProcessada {
  nome: string;
  sku: string;
  url: string;
}

// FUNÇÃO PRINCIPAL - EXTRAÇÃO ORDENADA POR LINHA
export const extrairImagensDoExcel = async (file: File): Promise<ImagemPosicionada[]> => {
  console.log('🔍 [ORDEM] Iniciando extração de imagens com ordenação sequencial...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    // 1. EXTRAIR DADOS DA PLANILHA PARA CORRELAÇÃO
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    console.log('📊 [ORDEM] Dados da planilha carregados:', dados.length, 'linhas');

    // 2. EXTRAIR TODAS AS POSIÇÕES DAS IMAGENS
    const drawingsFile = zip.file('xl/drawings/drawing1.xml');
    if (!drawingsFile) {
      console.log('❌ [ORDEM] Arquivo de desenhos não encontrado');
      return [];
    }

    const drawingsXml = await drawingsFile.async('text');
    console.log('📐 [ORDEM] Arquivo de desenhos carregado');

    // 3. LER TODAS AS IMAGENS DO ARQUIVO
    const mediaFolder = zip.folder('xl/media');
    if (!mediaFolder) {
      console.log('❌ [ORDEM] Pasta de mídia não encontrada');
      return [];
    }

    // 4. EXTRAIR POSIÇÕES E CRIAR MAPA IMAGEM → LINHA
    const imagensRaw: { filename: string; dados: Uint8Array; index: number }[] = [];
    let index = 0;
    
    for (const [filename, file] of Object.entries(mediaFolder.files)) {
      if (filename.match(/\.(png|jpg|jpeg)$/i)) {
        const imagemDados = await file.async('uint8array');
        imagensRaw.push({ filename, dados: imagemDados, index });
        index++;
      }
    }
    
    console.log(`📸 [ORDEM] ${imagensRaw.length} imagens encontradas no arquivo`);

    // 5. MAPEAR POSIÇÕES DAS IMAGENS NO XML
    const posicoesImagens = extrairTodasPosicoesImagens(drawingsXml);
    console.log(`📍 [ORDEM] ${posicoesImagens.length} posições detectadas no XML`);

    // 6. COMBINAR IMAGENS COM POSIÇÕES E ORDENAR POR LINHA
    const imagensComPosicao: Array<{
      dados: Uint8Array;
      linha: number;
      coluna: number;
      filename: string;
      index: number;
    }> = [];

    imagensRaw.forEach((img, i) => {
      const posicao = posicoesImagens[i] || { linha: i + 2, coluna: 2 }; // fallback sequencial
      
      imagensComPosicao.push({
        dados: img.dados,
        linha: posicao.linha,
        coluna: posicao.coluna,
        filename: img.filename,
        index: img.index
      });
    });

    // 7. ORDENAR POR LINHA (B2, B3, B4, ...)
    imagensComPosicao.sort((a, b) => a.linha - b.linha);
    console.log('🔢 [ORDEM] Imagens ordenadas por linha');

    // 8. PROCESSAR SEQUENCIALMENTE E NOMEAR COM SKU DA COLUNA A
    const imagensFinais: ImagemPosicionada[] = [];
    
    imagensComPosicao.forEach((img, ordemIndex) => {
      // Extrair SKU da célula A da mesma linha
      const sku = extrairSkuDaLinha(dados, img.linha);
      const nomeImagem = sku ? `${sku}.png` : `LINHA_${img.linha}.png`;
      
      imagensFinais.push({
        nome: nomeImagem,
        dados: img.dados,
        linha: img.linha,
        coluna: img.coluna,
        sku: sku
      });

      console.log(`📸 [ORDEM] ${ordemIndex + 1}. Linha ${img.linha} → SKU: ${sku || 'SEM_SKU'} → ${nomeImagem}`);
    });

    console.log(`✅ [ORDEM] ${imagensFinais.length} imagens processadas em ordem sequencial`);
    return imagensFinais;

  } catch (error) {
    console.error('❌ [ORDEM] Erro na extração:', error);
    throw error;
  }
};

// FUNÇÃO AUXILIAR - EXTRAIR TODAS AS POSIÇÕES DAS IMAGENS
const extrairTodasPosicoesImagens = (drawingsXml: string): { linha: number; coluna: number }[] => {
  try {
    console.log('🔍 [XML] Extraindo todas as posições das imagens do XML...');
    
    // Regex para encontrar posições das imagens no XML
    const positionRegex = /<xdr:from>.*?<xdr:col>(\d+)<\/xdr:col>.*?<xdr:row>(\d+)<\/xdr:row>/gs;
    const matches = [...drawingsXml.matchAll(positionRegex)];
    
    const posicoes = matches.map((match, index) => {
      const coluna = parseInt(match[1]) + 1; // +1 porque Excel é 1-indexed
      const linha = parseInt(match[2]) + 1;
      
      console.log(`📍 [XML] Imagem ${index + 1}: Linha ${linha}, Coluna ${coluna}`);
      return { linha, coluna };
    });
    
    console.log(`✅ [XML] ${posicoes.length} posições extraídas com sucesso`);
    return posicoes;
    
  } catch (error) {
    console.warn('⚠️ [XML] Erro ao extrair posições, usando fallback sequencial:', error);
    return [];
  }
};

// FUNÇÃO AUXILIAR - EXTRAIR POSIÇÃO ÚNICA (mantida para compatibilidade)
const extrairPosicaoDaImagem = (drawingsXml: string, index: number): { linha: number; coluna: number } => {
  const todasPosicoes = extrairTodasPosicoesImagens(drawingsXml);
  
  if (todasPosicoes[index]) {
    return todasPosicoes[index];
  }
  
  // Fallback: sequencial começando na linha 2 (após cabeçalho)
  return { 
    linha: index + 2,
    coluna: 2 // Coluna B
  };
};

// FUNÇÃO AUXILIAR - EXTRAIR SKU DA LINHA (COLUNA A)
const extrairSkuDaLinha = (dados: any[][], linha: number): string | null => {
  try {
    // Ajustar índice: linha 2 do Excel = dados[0], linha 3 = dados[1], etc.
    const dataIndex = linha - 2; // -2 porque linha 1 = cabeçalho
    
    if (dataIndex >= 0 && dataIndex < dados.length && dados[dataIndex]) {
      // SKU sempre na coluna A (índice 0)
      const sku = dados[dataIndex][0];
      const skuLimpo = sku ? String(sku).trim() : null;
      
      console.log(`🎯 [SKU] Linha ${linha} (dados[${dataIndex}]) → SKU: "${skuLimpo}"`);
      return skuLimpo;
    }
    
    console.warn(`⚠️ [SKU] Linha ${linha} não encontrada nos dados (índice ${dataIndex})`);
    return null;
  } catch (error) {
    console.warn('⚠️ [SKU] Erro ao extrair SKU da linha', linha, error);
    return null;
  }
};

// FUNÇÃO DE CONVERSÃO PARA DATA URL
export const converterImagensParaDataURL = async (imagens: ImagemPosicionada[]): Promise<ImagemProcessada[]> => {
  console.log('🔄 [POSIÇÃO] Convertendo imagens para Data URL...');
  
  const imagensProcessadas: ImagemProcessada[] = [];
  
  for (const imagem of imagens) {
    try {
      // Detectar tipo da imagem
      const tipoImagem = detectarTipoImagem(imagem.dados);
      
      // Converter para base64
      const base64 = uint8ArrayToBase64(imagem.dados);
      const dataUrl = `data:${tipoImagem};base64,${base64}`;
      
      imagensProcessadas.push({
        nome: imagem.nome,
        sku: imagem.sku || 'SEM_SKU',
        url: dataUrl
      });
      
      console.log(`✅ [POSIÇÃO] Convertida: ${imagem.nome} (${imagem.sku})`);
    } catch (error) {
      console.error(`❌ [POSIÇÃO] Erro ao converter ${imagem.nome}:`, error);
    }
  }
  
  console.log(`🎯 [POSIÇÃO] Total convertidas: ${imagensProcessadas.length}`);
  return imagensProcessadas;
};

// FUNÇÕES AUXILIARES
const detectarTipoImagem = (dados: Uint8Array): string => {
  const header = Array.from(dados.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  if (header.startsWith('89504e47')) return 'image/png';
  if (header.startsWith('ffd8ffe')) return 'image/jpeg';
  if (header.startsWith('47494638')) return 'image/gif';
  
  return 'image/png'; // Default
};

const uint8ArrayToBase64 = (dados: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < dados.length; i++) {
    binary += String.fromCharCode(dados[i]);
  }
  return btoa(binary);
};