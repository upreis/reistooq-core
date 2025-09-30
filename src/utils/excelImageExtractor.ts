// src/utils/excelImageExtractor.ts - VERSÃO COM MAPEAMENTO PRECISO DE RELACIONAMENTOS

import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { ImagemProcessada } from '@/hooks/useImagemSKUProcessor';

interface ImagemPosicionada {
  nome: string;
  dados: Uint8Array;
  linha: number;
  coluna: number;
  tipoColuna: 'IMAGEM' | 'IMAGEM_FORNECEDOR'; // Nova propriedade para identificar tipo
  sku?: string;
}

// Usar interface centralizada do useImagemSKUProcessor

interface PosicaoImagem {
  linha: number;
  coluna: number;
  nomeArquivo: string;
  rId?: string;
}

// FUNÇÃO PRINCIPAL - EXTRAÇÃO POR POSICIONAMENTO XML COM MAPEAMENTO PRECISO
export const extrairImagensDoExcel = async (file: File): Promise<ImagemPosicionada[]> => {
  console.log('🔍 [XML] Iniciando extração por posicionamento XML com mapeamento preciso...');
  console.log('📁 [XML] Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
  
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
    console.log(`📊 [XML] Dados: ${dados.length} linhas, última com dados: ${ultimaLinhaComDados}`);

    // 3. EXTRAIR IMAGENS DA PASTA MEDIA
    const mediaFolder = zip.folder('xl/media');
    if (!mediaFolder) {
      console.log('❌ [XML] Pasta de mídia não encontrada');
      return [];
    }

    const drawingsFile = zip.file('xl/drawings/drawing1.xml');
    if (!drawingsFile) {
      console.log('❌ [XML] Arquivo de desenhos não encontrado');
      return [];
    }

    // 4. EXTRAIR MAPEAMENTO DE RELACIONAMENTOS (MELHORIA IMPLEMENTADA)
    const mapeamentoRels = await extrairMapeamentoRelacionamentos(zip);
    
    // 5. EXTRAIR XML DE DRAWINGS
    const drawingsXml = await drawingsFile.async('text');
    
    // 6. EXTRAIR IMAGENS E INDEXAR POR NOME
    const imagensDisponiveis = new Map<string, Uint8Array>();
    
    for (const [filename, file] of Object.entries(mediaFolder.files)) {
      if (filename.match(/\.(png|jpg|jpeg)$/i)) {
        const imagemDados = await file.async('uint8array');
        // Usar apenas o nome do arquivo (sem path completo)
        const nomeArquivoLimpo = filename.split('/').pop() || filename;
        imagensDisponiveis.set(nomeArquivoLimpo, imagemDados);
        console.log(`📁 [MEDIA] Arquivo encontrado: "${filename}" → key: "${nomeArquivoLimpo}"`);
      }
    }
    
    console.log(`📸 [XML] ${imagensDisponiveis.size} imagens encontradas: ${Array.from(imagensDisponiveis.keys()).join(', ')}`);

    // 7. PROCESSAR XML PARA EXTRAIR POSIÇÕES DAS IMAGENS COM MAPEAMENTO PRECISO
    const posicoesImagens = extrairPosicoesDoXML(drawingsXml, mapeamentoRels, imagensDisponiveis);
    console.log(`🎯 [XML] ${posicoesImagens.length} posições de imagens encontradas no XML`);

    // 8. MAPEAR IMAGENS POR POSIÇÃO REAL
    const imagensFinais: ImagemPosicionada[] = [];
    
    console.log(`🔍 [DEBUG_COLUNA] Processando ${posicoesImagens.length} posições de imagens...`);
    
    for (const posicao of posicoesImagens) {
      const { linha, coluna, nomeArquivo, rId } = posicao;
      
      console.log(`🔍 [DEBUG_COLUNA] Posição: linha=${linha}, coluna=${coluna}, arquivo=${nomeArquivo}`);
      
      // Verifica se a linha está dentro do range de dados
      if (linha < 2 || linha > ultimaLinhaComDados) {
        console.log(`⚠️ [XML] Imagem na linha ${linha} fora do range de dados (2-${ultimaLinhaComDados})`);
        continue;
      }
      
      // Determinar tipo de coluna baseado na posição (coluna após +1: 2=B, 3=C)
      const tipoColuna = coluna === 2 ? 'IMAGEM' : coluna === 3 ? 'IMAGEM_FORNECEDOR' : 'IMAGEM';
      console.log(`🎯 [DEBUG_COLUNA] Coluna ${coluna} → Tipo: ${tipoColuna}`);
      
      // Extrai SKU da linha correspondente
      const sku = extrairSkuDaLinha(dados, linha);
      if (!sku) {
        console.log(`⚠️ [XML] Linha ${linha}: sem SKU, pulando imagem ${nomeArquivo}`);
        continue;
      }
      
      // DEBUG: Verificar se a imagem existe (com debug adicional)
      console.log(`🔍 [XML] Procurando imagem: "${nomeArquivo}" nas disponíveis: [${Array.from(imagensDisponiveis.keys()).join(', ')}]`);
      
      let dadosImagem = imagensDisponiveis.get(nomeArquivo);
      
      // FALLBACK: Se não encontrar com o nome exato, tentar diferentes variações
      if (!dadosImagem) {
        console.log(`⚠️ [XML] Imagem "${nomeArquivo}" não encontrada, tentando fallbacks...`);
        
        // Tentar sem extensão
        const nomeBase = nomeArquivo.replace(/\.[^.]+$/, '');
        for (const [key, value] of imagensDisponiveis.entries()) {
          if (key.includes(nomeBase) || nomeBase.includes(key.replace(/\.[^.]+$/, ''))) {
            console.log(`🎯 [XML] FALLBACK: Usando "${key}" para "${nomeArquivo}"`);
            dadosImagem = value;
            break;
          }
        }
      }
      
      if (!dadosImagem) {
        console.log(`❌ [XML] Imagem ${nomeArquivo} não encontrada na pasta media`);
        continue;
      }
      
      const sufixo = tipoColuna === 'IMAGEM_FORNECEDOR' ? '-fornecedor' : '';
      const nomeImagem = `${sku}${sufixo}.png`;
      
      imagensFinais.push({
        nome: nomeImagem,
        dados: dadosImagem,
        linha: linha,
        coluna: coluna,
        tipoColuna: tipoColuna,
        sku: sku
      });

      console.log(`📸 [XML] ✅ Linha ${linha}, Coluna ${coluna} (${tipoColuna}), rId: ${rId} → SKU: ${sku} → ${nomeImagem}`);
    }

    console.log(`✅ [XML] ${imagensFinais.length} imagens processadas por posicionamento XML preciso`);
    return imagensFinais;

  } catch (error) {
    console.error('❌ [XML] Erro na extração:', error);
    throw error;
  }
};

// NOVA FUNÇÃO - EXTRAIR MAPEAMENTO DE RELACIONAMENTOS (MELHORIA IMPLEMENTADA)
const extrairMapeamentoRelacionamentos = async (zip: any): Promise<Map<string, string>> => {
  console.log('🔗 [RELS] Extraindo mapeamento de relacionamentos...');
  
  const mapeamento = new Map<string, string>();
  
  try {
    const relsFile = zip.file('xl/_rels/drawings/drawing1.xml.rels');
    if (!relsFile) {
      console.log('⚠️ [RELS] Arquivo drawing1.xml.rels não encontrado, usando fallback sequencial');
      return mapeamento;
    }
    
    const relsContent = await relsFile.async('text');
    
    console.log('📄 [RELS] Conteúdo do arquivo drawing1.xml.rels:');
    console.log(relsContent.substring(0, 500) + '...');
    
    // Padrão que captura os relacionamentos: <Relationship Id="rId1" Type="..." Target="../media/image1.png"/>
    const padraoRel = /<Relationship\s+Id="([^"]+)"\s+Type="[^"]*"\s+Target="\.\.\/media\/([^"]+)"/g;
    
    let match;
    while ((match = padraoRel.exec(relsContent)) !== null) {
      const rId = match[1]; // ex: "rId1"
      const nomeArquivo = match[2]; // ex: "image1.png"
      
      mapeamento.set(rId, nomeArquivo);
      console.log(`🔗 [RELS] Mapeamento: ${rId} → ${nomeArquivo}`);
    }
    
    console.log(`✅ [RELS] ${mapeamento.size} relacionamentos mapeados`);
    
  } catch (error) {
    console.error('❌ [RELS] Erro ao extrair relacionamentos:', error);
  }
  
  return mapeamento;
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

// FUNÇÃO AUXILIAR - EXTRAIR POSIÇÕES DO XML COM MAPEAMENTO PRECISO (MELHORADA)
const extrairPosicoesDoXML = (xmlContent: string, mapeamentoRels: Map<string, string>, imagensDisponiveis?: Map<string, Uint8Array>): PosicaoImagem[] => {
  console.log('🔍 [XML] Iniciando parse do XML de drawings com mapeamento preciso...');
  
  const posicoes: PosicaoImagem[] = [];
  
  try {
    // Parse básico do XML para encontrar elementos xdr:twoCellAnchor
    const twoCellAnchorRegex = /<xdr:twoCellAnchor[^>]*>([\s\S]*?)<\/xdr:twoCellAnchor>/g;
    let match;
    let indiceSequencial = 0; // Para fallback quando não há mapeamento
    
    while ((match = twoCellAnchorRegex.exec(xmlContent)) !== null) {
      const anchorContent = match[1];
      
      // Extrair posição "from" (onde a imagem começa)
      const fromMatch = /<xdr:from>([\s\S]*?)<\/xdr:from>/.exec(anchorContent);
      if (!fromMatch) continue;
      
      const fromContent = fromMatch[1];
      
      // Extrair coluna e linha
      const colMatch = /<xdr:col>(\d+)<\/xdr:col>/.exec(fromContent);
      const rowMatch = /<xdr:row>(\d+)<\/xdr:row>/.exec(fromContent);
      
      if (!colMatch || !rowMatch) continue;
      
      const coluna = parseInt(colMatch[1]) + 1; // +1 porque XML usa índice 0
      const linha = parseInt(rowMatch[1]) + 1;  // +1 porque XML usa índice 0
      
      // MELHORIA: Extrair rId do XML e usar mapeamento preciso
      const embedMatch = /<a:blip\s+r:embed="([^"]+)"/.exec(anchorContent);
      let nomeArquivo = '';
      let rId = '';
      
      if (embedMatch && mapeamentoRels.size > 0) {
        // MÉTODO PRECISO: Usar mapeamento de relacionamentos
        rId = embedMatch[1];
        const arquivoMapeado = mapeamentoRels.get(rId);
        
        if (arquivoMapeado) {
          nomeArquivo = arquivoMapeado;
          console.log(`🎯 [XML] Mapeamento preciso: ${rId} → ${nomeArquivo}`);
        } else {
          console.log(`⚠️ [XML] rId ${rId} não encontrado no mapeamento, tentando fallbacks...`);
          // Tentar variações do rId
          const variacoes = [`image${rId.replace('rId', '')}.png`, `image${indiceSequencial + 1}.png`, `image${indiceSequencial + 1}.jpg`];
          
          let encontrado = false;
          for (const variacao of variacoes) {
            if (imagensDisponiveis?.has(variacao)) {
              nomeArquivo = variacao;
              console.log(`🎯 [XML] FALLBACK encontrado: ${variacao}`);
              encontrado = true;
              break;
            }
          }
          
          if (!encontrado) {
            nomeArquivo = `image${indiceSequencial + 1}.png`;
            console.log(`⚠️ [XML] Usando fallback final: ${nomeArquivo}`);
          }
        }
      } else {
        // FALLBACK: Usar ordem sequencial (método anterior)
        nomeArquivo = `image${indiceSequencial + 1}.png`;
        console.log(`⚠️ [XML] Usando fallback sequencial: ${nomeArquivo}`);
      }
      
      posicoes.push({
        linha,
        coluna,
        nomeArquivo,
        rId
      });
      
      console.log(`🎯 [XML] Encontrada imagem na linha ${linha}, coluna ${coluna} → ${nomeArquivo} (rId: ${rId})`);
      indiceSequencial++;
    }
    
    console.log(`✅ [XML] Total de ${posicoes.length} posições extraídas do XML`);
    return posicoes;
    
  } catch (error) {
    console.error('❌ [XML] Erro ao processar XML:', error);
    return [];
  }
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
        url: dataUrl,
        tipoColuna: imagem.tipoColuna
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
  const header = Array.from(dados.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log(`🔍 [MIME] Header detectado: ${header}`);
  
  if (header.startsWith('89504e47')) {
    console.log('🖼️ [MIME] Detectado: PNG');
    return 'image/png';
  }
  if (header.startsWith('ffd8ff')) { // Corrigido: JPEG pode ter diferentes variações
    console.log('🖼️ [MIME] Detectado: JPEG');
    return 'image/jpeg';
  }
  if (header.startsWith('47494638')) {
    console.log('🖼️ [MIME] Detectado: GIF');
    return 'image/gif';
  }
  
  console.log('🖼️ [MIME] Usando default: PNG');
  return 'image/png'; // Default
};

const uint8ArrayToBase64 = (dados: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < dados.length; i++) {
    binary += String.fromCharCode(dados[i]);
  }
  return btoa(binary);
};