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

// FUNÇÃO PRINCIPAL - EXTRAÇÃO SEQUENCIAL LINHA POR LINHA
export const extrairImagensDoExcel = async (file: File): Promise<ImagemPosicionada[]> => {
  console.log('🔍 [SEQUENCIAL] Iniciando extração sequencial linha por linha...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    // 1. EXTRAIR DADOS DA PLANILHA PARA DETERMINAR RANGE
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // 2. DETERMINAR ÚLTIMA LINHA COM DADOS
    const ultimaLinhaComDados = determinarUltimaLinhaComDados(dados);
    console.log(`📊 [SEQUENCIAL] Dados: ${dados.length} linhas, última com dados: ${ultimaLinhaComDados}`);

    // 3. EXTRAIR IMAGENS E SUAS POSIÇÕES
    const mediaFolder = zip.folder('xl/media');
    if (!mediaFolder) {
      console.log('❌ [SEQUENCIAL] Pasta de mídia não encontrada');
      return [];
    }

    const drawingsFile = zip.file('xl/drawings/drawing1.xml');
    if (!drawingsFile) {
      console.log('❌ [SEQUENCIAL] Arquivo de desenhos não encontrado');
      return [];
    }

    const drawingsXml = await drawingsFile.async('text');
    
    // 4. COLETAR TODAS AS IMAGENS E ORDENAR POR NOME DE ARQUIVO
    const imagensRaw: { filename: string; dados: Uint8Array; ordem: number }[] = [];
    
    const files = Object.entries(mediaFolder.files)
      .filter(([filename]) => filename.match(/\.(png|jpg|jpeg)$/i))
      .sort(([a], [b]) => a.localeCompare(b)); // Ordenar por nome do arquivo
    
    for (let i = 0; i < files.length; i++) {
      const [filename, file] = files[i];
      const imagemDados = await file.async('uint8array');
      imagensRaw.push({ filename, dados: imagemDados, ordem: i });
    }
    
    console.log(`📸 [SEQUENCIAL] ${imagensRaw.length} imagens encontradas`);

    // 5. DETECTAR IMAGENS DUPLICADAS COMPARANDO DADOS BINÁRIOS
    const hashesImagens = new Map<string, number[]>(); // hash -> array de índices
    
    for (let i = 0; i < imagensRaw.length; i++) {
      const hash = gerarHashImagem(imagensRaw[i].dados);
      if (!hashesImagens.has(hash)) {
        hashesImagens.set(hash, []);
      }
      hashesImagens.get(hash)!.push(i);
    }

    // 6. PROCESSAR SEQUENCIALMENTE DA LINHA 2 ATÉ A ÚLTIMA
    const imagensFinais: ImagemPosicionada[] = [];
    const imagensUtilizadas = new Set<number>(); // Índices de imagens já utilizadas
    
    for (let linha = 2; linha <= ultimaLinhaComDados; linha++) {
      const indiceImagem = linha - 2; // Linha 2 = imagem índice 0
      const sku = extrairSkuDaLinha(dados, linha);
      
      if (indiceImagem < imagensRaw.length && !imagensUtilizadas.has(indiceImagem)) {
        const imagem = imagensRaw[indiceImagem];
        const hash = gerarHashImagem(imagem.dados);
        const indicesDuplicados = hashesImagens.get(hash) || [];
        
        // Se a imagem é duplicada, pular esta linha
        if (indicesDuplicados.length > 1) {
          console.log(`⚠️ [SEQUENCIAL] Linha ${linha} → SKU: ${sku || 'SEM_SKU'} → Imagem duplicada detectada, pulando...`);
          continue;
        }
        
        const nomeImagem = sku ? `${sku}.png` : `LINHA_${linha}.png`;
        
        imagensFinais.push({
          nome: nomeImagem,
          dados: imagem.dados,
          linha: linha,
          coluna: 2,
          sku: sku
        });

        imagensUtilizadas.add(indiceImagem);
        console.log(`📸 [SEQUENCIAL] Linha ${linha} → SKU: ${sku || 'SEM_SKU'} → ${nomeImagem}`);
      } else if (indiceImagem < imagensRaw.length && imagensUtilizadas.has(indiceImagem)) {
        console.log(`⚠️ [SEQUENCIAL] Linha ${linha} → SKU: ${sku || 'SEM_SKU'} → Imagem já utilizada, pulando...`);
      } else {
        console.log(`⚠️ [SEQUENCIAL] Linha ${linha} → SKU: ${sku || 'SEM_SKU'} → Sem imagem correspondente`);
      }
    }

    console.log(`✅ [SEQUENCIAL] ${imagensFinais.length} imagens processadas sequencialmente`);
    return imagensFinais;

  } catch (error) {
    console.error('❌ [SEQUENCIAL] Erro na extração:', error);
    throw error;
  }
};

// FUNÇÃO AUXILIAR - DETERMINAR ÚLTIMA LINHA COM DADOS
const determinarUltimaLinhaComDados = (dados: any[][]): number => {
  // Procura a última linha que contém pelo menos um valor não vazio
  for (let i = dados.length - 1; i >= 0; i--) {
    const linha = dados[i];
    if (linha && linha.some(celula => celula !== null && celula !== undefined && String(celula).trim() !== '')) {
      return i + 2; // +2 porque: índice 0 = linha 1 do Excel, +1 para linha real
    }
  }
  
  // Se não encontrar dados, assume pelo menos a linha 2 (primeira linha após cabeçalho)
  return 2;
};

// FUNÇÃO AUXILIAR - EXTRAIR POSIÇÃO ÚNICA (removida - não mais necessária)
// A nova abordagem sequencial não depende mais do mapeamento XML de posições

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

// FUNÇÃO PARA GERAR HASH SIMPLES DE UMA IMAGEM
const gerarHashImagem = (dados: Uint8Array): string => {
  // Gera um hash simples baseado no tamanho e primeiros/últimos bytes
  const tamanho = dados.length;
  const inicio = dados.slice(0, Math.min(100, tamanho));
  const fim = dados.slice(Math.max(0, tamanho - 100));
  
  let hash = tamanho.toString();
  for (let i = 0; i < inicio.length; i++) {
    hash += inicio[i].toString(16);
  }
  for (let i = 0; i < fim.length; i++) {
    hash += fim[i].toString(16);
  }
  
  return hash;
};