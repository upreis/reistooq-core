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

// FUNÇÃO PRINCIPAL - CORRELACIONA IMAGENS POR POSIÇÃO
export const extrairImagensDoExcel = async (file: File): Promise<ImagemPosicionada[]> => {
  console.log('🔍 [POSIÇÃO] Iniciando extração de imagens por posicionamento...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    // 1. EXTRAIR DADOS DA PLANILHA PARA CORRELAÇÃO
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    console.log('📊 [POSIÇÃO] Dados da planilha carregados:', dados.length, 'linhas');

    // 2. EXTRAIR IMAGENS E SUAS POSIÇÕES
    const imagensComPosicao: ImagemPosicionada[] = [];
    
    // Ler arquivo de desenhos (onde ficam as posições)
    const drawingsFile = zip.file('xl/drawings/drawing1.xml');
    if (!drawingsFile) {
      console.log('❌ [POSIÇÃO] Arquivo de desenhos não encontrado');
      return [];
    }

    const drawingsXml = await drawingsFile.async('text');
    console.log('📐 [POSIÇÃO] Arquivo de desenhos carregado');

    // Ler pasta de imagens
    const mediaFolder = zip.folder('xl/media');
    if (!mediaFolder) {
      console.log('❌ [POSIÇÃO] Pasta de mídia não encontrada');
      return [];
    }

    // 3. PROCESSAR CADA IMAGEM
    let imagemIndex = 0;
    for (const [filename, file] of Object.entries(mediaFolder.files)) {
      if (filename.match(/\.(png|jpg|jpeg)$/i)) {
        const imagemDados = await file.async('uint8array');
        
        // EXTRAIR POSIÇÃO DA IMAGEM DO XML
        const posicao = extrairPosicaoDaImagem(drawingsXml, imagemIndex);
        
        // CORRELACIONAR COM SKU DA LINHA
        const sku = extrairSkuDaLinha(dados, posicao.linha);
        
        imagensComPosicao.push({
          nome: `${sku || 'SEM_SKU'}_${imagemIndex + 1}.png`,
          dados: imagemDados,
          linha: posicao.linha,
          coluna: posicao.coluna,
          sku: sku
        });

        console.log(`📸 [POSIÇÃO] Imagem ${imagemIndex + 1}: Linha ${posicao.linha}, SKU: ${sku}`);
        imagemIndex++;
      }
    }

    console.log(`✅ [POSIÇÃO] Total de imagens processadas: ${imagensComPosicao.length}`);
    return imagensComPosicao;

  } catch (error) {
    console.error('❌ [POSIÇÃO] Erro na extração:', error);
    throw error;
  }
};

// FUNÇÃO AUXILIAR - EXTRAIR POSIÇÃO DA IMAGEM
const extrairPosicaoDaImagem = (drawingsXml: string, index: number): { linha: number; coluna: number } => {
  try {
    // Regex para encontrar posições das imagens no XML
    const positionRegex = /<xdr:from>.*?<xdr:col>(\d+)<\/xdr:col>.*?<xdr:row>(\d+)<\/xdr:row>/gs;
    const matches = [...drawingsXml.matchAll(positionRegex)];
    
    if (matches[index]) {
      const coluna = parseInt(matches[index][1]) + 1; // +1 porque Excel é 1-indexed
      const linha = parseInt(matches[index][2]) + 1;
      return { linha, coluna };
    }
    
    // Fallback: distribuir sequencialmente
    return { 
      linha: Math.floor(index / 2) + 2, // +2 para pular cabeçalho
      coluna: (index % 2) + 2 // Alternar entre colunas 2 e 3
    };
  } catch (error) {
    console.warn('⚠️ [POSIÇÃO] Erro ao extrair posição, usando fallback:', error);
    return { 
      linha: Math.floor(index / 2) + 2,
      coluna: (index % 2) + 2
    };
  }
};

// FUNÇÃO AUXILIAR - EXTRAIR SKU DA LINHA
const extrairSkuDaLinha = (dados: any[][], linha: number): string | null => {
  try {
    if (linha < dados.length && dados[linha]) {
      // Assumindo que SKU está na coluna 1 (índice 0)
      const sku = dados[linha][0];
      return sku ? String(sku).trim() : null;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ [POSIÇÃO] Erro ao extrair SKU da linha', linha, error);
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