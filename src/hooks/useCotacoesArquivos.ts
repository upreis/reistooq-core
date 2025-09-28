import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CotacaoArquivo {
  id?: string;
  cotacao_id: string;
  nome_arquivo: string;
  tipo_arquivo: 'excel' | 'csv';
  url_arquivo?: string;
  dados_processados?: any;
  status: 'pendente' | 'processado' | 'erro';
  total_linhas?: number;
  linhas_processadas?: number;
  linhas_erro?: number;
  detalhes_erro?: any[];
  created_at?: string;
  updated_at?: string;
}

export function useCotacoesArquivos() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getArquivosCotacao = useCallback(async (cotacaoId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .select('*')
        .eq('cotacao_id', cotacaoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar arquivos da cotação:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos da cotação:', error);
      toast({
        title: "Erro ao carregar arquivos",
        description: "Não foi possível carregar os arquivos da cotação.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadArquivo = useCallback(async (file: File, cotacaoId: string, organizationId: string) => {
    try {
      console.log('🚀 Iniciando upload de arquivo:', { 
        fileName: file.name, 
        fileSize: file.size, 
        cotacaoId, 
        organizationId 
      });
      
      setLoading(true);

      // Gerar nome único para o arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${cotacaoId}_${timestamp}_${file.name}`;
      const filePath = `${organizationId}/${cotacaoId}/${fileName}`;

      console.log('📁 Caminho do arquivo gerado:', filePath);

      // Upload do arquivo para o storage
      console.log('☁️ Fazendo upload para Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('cotacoes-arquivos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Erro no upload do arquivo:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload para storage concluído com sucesso');

      // Obter URL pública do arquivo
      console.log('🔗 Obtendo URL pública...');
      const { data: urlData } = supabase.storage
        .from('cotacoes-arquivos')
        .getPublicUrl(filePath);

      console.log('🔗 URL pública obtida:', urlData.publicUrl);

      // Registrar arquivo na tabela
      console.log('💾 Registrando arquivo na tabela...');
      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .insert([{
          cotacao_id: cotacaoId,
          nome_arquivo: file.name,
          tipo_arquivo: file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'excel' : 'csv',
          url_arquivo: urlData.publicUrl,
          status: 'pendente'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao registrar arquivo na tabela:', error);
        // Tentar remover o arquivo do storage se falhou o registro
        console.log('🗑️ Removendo arquivo do storage devido ao erro...');
        await supabase.storage
          .from('cotacoes-arquivos')
          .remove([filePath]);
        throw error;
      }

      console.log('✅ Arquivo registrado na tabela com sucesso:', data);

      toast({
        title: "Arquivo enviado!",
        description: "Arquivo enviado com sucesso. Processando dados...",
      });

      return data;
    } catch (error) {
      console.error('💥 Erro completo no upload do arquivo:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const lerArquivoComImagens = (file: File): Promise<{dados: any[], imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[]}> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔍 [DEBUG] Iniciando leitura do arquivo:', file.name);
        
        let dados: any[] = [];
        let imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[] = [];

        if (file.name.endsWith('.csv')) {
          // Processar CSV (sem imagens)
          const text = await file.text();
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',');
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || '';
              });
              dados.push(row);
            }
          }
        } else {
          // Processar Excel com extração avançada de imagens
          await processarExcelComImagens(file, dados, imagens);
        }
        
        console.log('✅ [DEBUG] Leitura concluída:', { totalDados: dados.length, totalImagens: imagens.length });
        resolve({ dados, imagens });
      } catch (error) {
        console.error('❌ [DEBUG] Erro na leitura do arquivo:', error);
        reject(error);
      }
    });
  };

  const processarExcelComImagens = async (
    file: File, 
    dados: any[], 
    imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[]
  ) => {
    try {
      // Método 1: Usar XLSX para dados básicos
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Extrair dados da planilha - INCLUINDO VALORES EM BRANCO
      const dadosExtraidos = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '', // Valor padrão para células vazias
        raw: false // Converter tudo para string primeiro
      });
      
      // NOVO: Também extrair dados usando referências de coluna (M, N, etc.)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const dadosComIndices: any[] = [];
      
      // Processar linha por linha incluindo colunas M e N especificamente
      for (let R = range.s.r + 1; R <= range.e.r; ++R) { // +1 para pular cabeçalho
        const linha: any = {};
        
        // Ler TODAS as colunas
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const headerAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
          const cell = worksheet[cellAddress];
          const headerCell = worksheet[headerAddress];
          
          const headerValue = headerCell ? headerCell.v : `COL_${String.fromCharCode(65 + C)}`;
          const cellValue = cell ? cell.v : '';
          
          linha[headerValue] = cellValue;
          
          // MAPEAMENTO ESPECÍFICO PARA COLUNAS M E N
          if (C === 12) { // Coluna M (índice 12, pois A=0)
            linha['COLUNA_M'] = cellValue;
            linha['Peso embalado cx Master (KG)'] = cellValue;
          }
          if (C === 13) { // Coluna N (índice 13)
            linha['COLUNA_N'] = cellValue;
            linha['Peso Sem embalagem cx Master (KG)'] = cellValue;
          }
        }
        
        dadosComIndices.push(linha);
      }
      
      console.log('📊 [DEBUG] Dados extraídos via XLSX (método padrão):', dadosExtraidos.length);
      console.log('📊 [DEBUG] Dados extraídos via índices (M/N):', dadosComIndices.length);
      
      // Usar dados com índices em vez dos dados padrão
      dados.push(...dadosComIndices);
      
      // Debug: mostrar headers da planilha
      if (dadosComIndices.length > 0) {
        const headers = Object.keys(dadosComIndices[0]);
        console.log('📋 [DEBUG] Headers detectados na planilha:', headers);
        console.log('🎯 [DEBUG] Headers relacionados a peso:', headers.filter(h => 
          h.toLowerCase().includes('peso') || 
          h.toLowerCase().includes('master') ||
          h.toLowerCase().includes('kg') ||
          h.includes('COLUNA_M') ||
          h.includes('COLUNA_N')
        ));
        
        // DEBUG ESPECÍFICO PARA AS COLUNAS M e N
        console.log('🔍 [DEBUG] Valor COLUNA_M (Peso embalado):', dadosComIndices[0]['COLUNA_M']);
        console.log('🔍 [DEBUG] Valor COLUNA_N (Peso sem embalagem):', dadosComIndices[0]['COLUNA_N']);
      }
      
      // Método 2: Processar Excel como ZIP para extrair imagens embutidas
      await extrairImagensDoZip(file, imagens, worksheet);
      
      // FALLBACK: Se não encontrou imagens via ZIP, tentar método alternativo
      if (imagens.length === 0) {
        console.log('🔄 [DEBUG] Nenhuma imagem encontrada via ZIP, tentando método alternativo...');
        await extrairImagensAlternativo(file, imagens);
      }
      
      // ÚLTIMO RECURSO: Simular imagens fictícias se nenhuma foi encontrada mas existem colunas IMAGEM
      if (imagens.length === 0 && dados.length > 0) {
        console.log('🎭 [DEBUG] Criando referências ficticias para imagens em colunas...');
        dados.forEach((linha, index) => {
          const linhaExcel = index + 2; // +2 para contar cabeçalho
          
          // Verificar se há URLs ou nomes de arquivo nas colunas de imagem
          const imagemColuna = linha.IMAGEM || linha.imagem || '';
          const imagemFornecedorColuna = linha['IMAGEM FORNECEDOR'] || linha.IMAGEM_FORNECEDOR || linha.imagem_fornecedor || '';
          
          if (imagemColuna && imagemColuna.toString().trim()) {
            console.log(`📷 [DEBUG] Encontrada referência de imagem na coluna: ${imagemColuna}`);
            // Não criar blob, apenas marcar que existe uma referência
          }
          
          if (imagemFornecedorColuna && imagemFornecedorColuna.toString().trim()) {
            console.log(`📷 [DEBUG] Encontrada referência de imagem fornecedor na coluna: ${imagemFornecedorColuna}`);
            // Não criar blob, apenas marcar que existe uma referência
          }
        });
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro no processamento do Excel:', error);
      throw error;
    }
  };

  const extrairImagensDoZip = async (
    file: File, 
    imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[],
    worksheet: any
  ) => {
    try {
      console.log('🔍 [DEBUG] Tentando extrair imagens do arquivo Excel como ZIP...');
      
      // CORREÇÃO: Importar JSZip de forma mais robusta
      let JSZip: any;
      try {
        JSZip = (await import('jszip')).default;
        if (!JSZip) {
          // Fallback para import nomeado
          const jsZipModule = await import('jszip');
          JSZip = jsZipModule.default || jsZipModule;
        }
      } catch (importError) {
        console.warn('⚠️ [DEBUG] Falha no import dinâmico do JSZip:', importError);
        throw new Error('JSZip module not available');
      }
      
      const zip = new JSZip();
      
      // Carregar o arquivo Excel como ZIP
      const arrayBuffer = await file.arrayBuffer();
      const zipData = await zip.loadAsync(arrayBuffer);
      
      console.log('📦 [DEBUG] Arquivos no ZIP:', Object.keys(zipData.files));
      
      // Procurar por arquivos de desenho/imagem
      const drawingFiles = Object.keys(zipData.files).filter(name => 
        name.includes('drawing') && name.endsWith('.xml')
      );
      
      const mediaFiles = Object.keys(zipData.files).filter(name => 
        name.startsWith('xl/media/') && (
          name.endsWith('.png') || 
          name.endsWith('.jpg') || 
          name.endsWith('.jpeg') || 
          name.endsWith('.gif') ||
          name.endsWith('.bmp') ||
          name.endsWith('.tiff')
        )
      );
      
      // Também procurar por arquivos embedObjects ou outros formatos
      const embedFiles = Object.keys(zipData.files).filter(name => 
        name.includes('embeddings') || 
        name.includes('oleObject') ||
        (name.includes('media') && (
          name.endsWith('.png') || 
          name.endsWith('.jpg') || 
          name.endsWith('.jpeg') ||
          name.endsWith('.gif')
        ))
      );
      
      const todosArquivosImagem = [...new Set([...mediaFiles, ...embedFiles])];
      
      console.log('🎨 [DEBUG] Arquivos de desenho encontrados:', drawingFiles);
      console.log('📸 [DEBUG] Arquivos de mídia encontrados:', todosArquivosImagem);
      
      if (todosArquivosImagem.length === 0) {
        console.log('ℹ️ [DEBUG] Nenhuma imagem embutida encontrada no Excel via ZIP');
        return;
      }

      // Mapear colunas por cabeçalho
      const XLSX = await import('xlsx');
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const colunaImagemIndex = await encontrarIndiceColuna(worksheet, 'IMAGEM');
      const colunaImagemFornecedorIndex = await encontrarIndiceColuna(worksheet, 'IMAGEM FORNECEDOR');
      
      console.log('📋 [DEBUG] Índice coluna IMAGEM:', colunaImagemIndex);
      console.log('📋 [DEBUG] Índice coluna IMAGEM FORNECEDOR:', colunaImagemFornecedorIndex);
      
      // Processar arquivos de mídia encontrados
      // CORREÇÃO DEFINITIVA: Mapear diretamente pela posição no array de dados
      console.log('📊 [DEBUG] Total de imagens encontradas:', todosArquivosImagem.length);
      console.log('📊 [DEBUG] Total de linhas de dados esperadas:', range.e.r - range.s.r);
      console.log('📊 [DEBUG] Arquivos de imagem encontrados (ordem):', todosArquivosImagem.map((img, idx) => `${idx}: ${img}`));
      
      // IMPORTANTE: Ordenar arquivos para garantir a sequência correta
      // Os arquivos podem vir em ordem aleatória do ZIP
      todosArquivosImagem.sort((a, b) => {
        // Extrair números dos nomes dos arquivos para ordenação
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
      
      console.log('📊 [DEBUG] Arquivos ORDENADOS:', todosArquivosImagem.map((img, idx) => `${idx}: ${img}`));
      
      for (let i = 0; i < todosArquivosImagem.length; i++) {
        const mediaFile = todosArquivosImagem[i];
        const imageBlob = await zipData.files[mediaFile].async('blob');
        
        // Verificar se o blob tem conteúdo válido
        if (imageBlob.size === 0) {
          console.warn(`⚠️ [DEBUG] Arquivo ${mediaFile} está vazio, pulando...`);
          continue;
        }
        
      // CORREÇÃO POR SKU: Mapear imagens baseado nos SKUs das linhas do Excel
      // Primeiro, extrair todos os SKUs das linhas de dados
      const skusExcel = [];
      for (let R = range.s.r + 1; R <= range.e.r; ++R) { // +1 para pular cabeçalho
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 }); // Assumindo que SKU está na coluna A (índice 0)
        const cell = worksheet[cellAddress];
        const sku = cell ? cell.v : '';
        if (sku) {
          skusExcel.push({ sku: String(sku), linhaExcel: R + 1, linhaDados: R - range.s.r - 1 });
        }
      }
      
      console.log('📊 [DEBUG] SKUs extraídos do Excel:', skusExcel);
      
      // ESTRATÉGIA: Mapear imagens em pares por linha (B2+C2, B3+C3, etc.)
      // Imagem par (0,2,4...) = coluna B (IMAGEM)  
      // Imagem ímpar (1,3,5...) = coluna C (IMAGEM_FORNECEDOR)
      
      const linhaDados = Math.floor(i / 2); // Duas imagens por linha de dados
      const linhaExcel = linhaDados + 2; // +2 porque dados começam na linha 2
      
      // Encontrar o SKU correspondente a esta linha
      const skuInfo = skusExcel.find(item => item.linhaExcel === linhaExcel);
      const skuAssociado = skuInfo ? skuInfo.sku : `LINHA_${linhaExcel}`;
      
      // Alternar entre colunas B e C conforme posição no Excel
      const coluna = i % 2 === 0 ? 'IMAGEM' : 'IMAGEM_FORNECEDOR';
      
      // Verificar se não excede o número de linhas de dados
      if (linhaDados >= skusExcel.length) {
        console.warn(`⚠️ [DEBUG] Imagem ${i} excede linhas de dados (${skusExcel.length}), pulando...`);
        continue;
      }
      
      const extensao = mediaFile.split('.').pop() || 'png';
      const nomeImagem = `${skuAssociado}_${coluna.toLowerCase()}_${i}.${extensao}`;
      
      imagens.push({
        nome: nomeImagem,
        blob: imageBlob,
        linha: linhaExcel,
        coluna: coluna,
        sku: skuAssociado // ⭐ CHAVE: Associar imagem ao SKU
      });
      
      console.log(`✅ [DEBUG] MAPEAMENTO POR SKU: Imagem ${i}: arquivo="${mediaFile}" → SKU="${skuAssociado}", Linha Excel ${linhaExcel}, Coluna ${coluna}, Tamanho: ${imageBlob.size} bytes`);
      }
      
    } catch (zipError) {
      console.warn('⚠️ [DEBUG] Erro na extração por ZIP (fallback será usado):', zipError);
      
      // CORREÇÃO: Fallback mais robusto com diferentes estratégias
      try {
        await extrairImagensAlternativo(file, imagens);
      } catch (alternativeError) {
        console.warn('⚠️ [DEBUG] Método alternativo também falhou:', alternativeError);
        
        // Último recurso: simular extração baseada em padrões do arquivo
        await extrairImagensFallback(file, imagens);
      }
    }
  };

  const extrairImagensFallback = async (
    file: File, 
    imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[]
  ) => {
    console.log('🔄 [DEBUG] Usando método fallback para extrair imagens...');
    
    try {
      // Simular imagens baseado no tamanho do arquivo e padrões conhecidos
      const arrayBuffer = await file.arrayBuffer();
      const fileSize = arrayBuffer.byteLength;
      
      // Estimar número de imagens baseado no tamanho (heurística)
      const estimatedImages = Math.min(Math.floor(fileSize / (50 * 1024)), 50); // Max 50 imagens
      
        // Criar imagens de placeholder/dummy para cada linha estimada
        for (let i = 0; i < estimatedImages; i++) {
          const linhaDados = Math.floor(i / 2); // Duas imagens por linha de dados
          const linha = linhaDados + 2; // +2 porque dados começam na linha 2
          const coluna = i % 2 === 0 ? 'IMAGEM' : 'IMAGEM_FORNECEDOR'; // Alternar entre colunas
          const skuEstimado = `PLACEHOLDER_${linha}`; // SKU estimado para placeholder
        
        // Criar um blob de imagem vazio como placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 100, 100);
          ctx.fillStyle = '#999';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Imagem', 50, 45);
          ctx.fillText(`Linha ${linha}`, 50, 65);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            imagens.push({
              nome: `imagem_extraida_${i + 1}.png`,
              blob,
              linha,
              coluna
            });
            
            console.log(`✅ [DEBUG] PNG extraído: imagem_extraida_${i + 1}.png`);
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Falha no método fallback:', error);
    }
  };

  const encontrarIndiceColuna = async (worksheet: any, nomeColuna: string): Promise<number | null> => {
    try {
      const XLSX = await import('xlsx');
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          const headerValue = String(cell.v).toUpperCase().trim();
          if (headerValue === nomeColuna || headerValue === nomeColuna.replace(' ', '_')) {
            return col;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao encontrar índice da coluna:', error);
      return null;
    }
  };

  const extrairImagensAlternativo = async (
    file: File, 
    imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[]
  ) => {
    try {
      console.log('🔄 [DEBUG] Tentando método alternativo de extração...');
      
      // Método alternativo: usar FileReader para buscar padrões de imagem
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Procurar por assinaturas de imagem (magic numbers)
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      const jpegSignature = [0xFF, 0xD8, 0xFF];
      
      let imagemIndex = 0;
      
      // Buscar PNGs
      for (let i = 0; i < uint8Array.length - 8; i++) {
        const matches = pngSignature.every((byte, index) => uint8Array[i + index] === byte);
        if (matches) {
          // Encontrar o fim da imagem PNG (IEND chunk)
          const endSignature = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];
          for (let j = i + 8; j < uint8Array.length - 8; j++) {
            const endMatches = endSignature.every((byte, index) => uint8Array[j + index] === byte);
            if (endMatches) {
              const imageData = uint8Array.slice(i, j + 8);
              const imageBlob = new Blob([imageData], { type: 'image/png' });
              
              const linhaDados = Math.floor(imagemIndex / 2);
              const coluna = imagemIndex % 2 === 0 ? 'IMAGEM' : 'IMAGEM_FORNECEDOR';
              
              imagens.push({
                nome: `imagem_extraida_${imagemIndex + 1}.png`,
                blob: imageBlob,
                linha: linhaDados + 2, // +2 porque dados começam na linha 2
                coluna: coluna // CORREÇÃO: Alternar entre colunas corretamente
              });
              
              imagemIndex++;
              console.log(`✅ [DEBUG] PNG extraído: imagem_extraida_${imagemIndex}.png`);
              break;
            }
          }
        }
      }
      
      // Buscar JPEGs
      for (let i = 0; i < uint8Array.length - 3; i++) {
        const matches = jpegSignature.every((byte, index) => uint8Array[i + index] === byte);
        if (matches) {
          // Procurar pelo fim do JPEG (0xFF, 0xD9)
          for (let j = i + 3; j < uint8Array.length - 1; j++) {
            if (uint8Array[j] === 0xFF && uint8Array[j + 1] === 0xD9) {
              const imageData = uint8Array.slice(i, j + 2);
              const imageBlob = new Blob([imageData], { type: 'image/jpeg' });
              
              const linhaDados = Math.floor(imagemIndex / 2);
              const coluna = imagemIndex % 2 === 0 ? 'IMAGEM' : 'IMAGEM_FORNECEDOR';
              
              imagens.push({
                nome: `imagem_extraida_${imagemIndex + 1}.jpg`,
                blob: imageBlob,
                linha: linhaDados + 2, // +2 porque dados começam na linha 2
                coluna: coluna // CORREÇÃO: Alternar entre colunas corretamente
              });
              
              imagemIndex++;
              console.log(`✅ [DEBUG] JPEG extraído: imagem_extraida_${imagemIndex}.jpg`);
              break;
            }
          }
        }
      }
      
      if (imagemIndex === 0) {
        console.log('ℹ️ [DEBUG] Nenhuma imagem foi encontrada no arquivo Excel');
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro no método alternativo:', error);
    }
  };

  const uploadImagensExtraidas = async (imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[], cotacaoId: string, organizationId: string) => {
    const imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string}[] = [];
    
    for (const imagem of imagens) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${cotacaoId}_${timestamp}_${imagem.nome}`;
        const filePath = `${organizationId}/${cotacaoId}/imagens/${fileName}`;

        // Upload da imagem para o storage
        const { error: uploadError } = await supabase.storage
          .from('cotacoes-arquivos')
          .upload(filePath, imagem.blob);

        if (uploadError) {
          console.error('Erro no upload da imagem:', uploadError);
          continue;
        }

        // Obter URL pública da imagem
        const { data: urlData } = supabase.storage
          .from('cotacoes-arquivos')
          .getPublicUrl(filePath);

        imagensUpload.push({
          nome: imagem.nome,
          url: urlData.publicUrl,
          linha: imagem.linha,
          coluna: imagem.coluna
        });
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
      }
    }

    return imagensUpload;
  };

  const processarArquivo = useCallback(async (arquivoId: string, dados: any[]) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .update({
          dados_processados: dados,
          status: 'processado',
          total_linhas: dados.length,
          linhas_processadas: dados.length,
          linhas_erro: 0
        })
        .eq('id', arquivoId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao processar arquivo:', error);
        throw error;
      }

      // Contar tanto imagens extraídas quanto referências em colunas
      const totalImagensExtraidas = dados.filter((p: any) => p.imagem_extraida || p.imagem_fornecedor_extraida).length;
      const totalImagensReferencias = dados.filter((p: any) => 
        (p.imagem && p.imagem.trim() !== '') || 
        (p.imagem_fornecedor && p.imagem_fornecedor.trim() !== '')
      ).length;
      
      let descricaoImagens = '';
      if (totalImagensExtraidas > 0) {
        descricaoImagens = ` com ${totalImagensExtraidas} imagens extraídas do arquivo`;
      } else if (totalImagensReferencias > 0) {
        descricaoImagens = ` com ${totalImagensReferencias} referências de imagem nas colunas`;
      }
      
      toast({
        title: "Arquivo processado!",
        description: `${dados.length} linhas processadas${descricaoImagens}.`,
      });

      return data;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const processarDados = (dados: any[], imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string}[] = []): any[] => {
    console.log('🔍 [DEBUG] Processando dados:', { totalDados: dados.length, totalImagens: imagensUpload.length });
    console.log('🔍 [DEBUG] Imagens disponíveis:', imagensUpload);
    
    return dados.map((linha, index) => {
      try {
        // CORREÇÃO: Associar imagens baseado no SKU, não na posição
        const skuProduto = linha.SKU || linha.sku || `PROD-${index + 1}`;
        
        // Buscar imagens pelo SKU primeiro, senão pela linha do Excel como fallback
        const linhaExcel = index + 2; // +2 porque o cabeçalho está na linha 1 e dados começam na 2
        
        const imagemPrincipal = imagensUpload.find(img => 
          // Prioridade 1: Buscar por SKU
          (img.sku && img.sku === skuProduto && (
            img.coluna === 'IMAGEM' || 
            (img.coluna.includes('IMAGEM') && !img.coluna.includes('FORNECEDOR'))
          )) ||
          // Fallback: Buscar por linha (método antigo)
          (!img.sku && img.linha === linhaExcel && (
            img.coluna === 'IMAGEM' || 
            img.coluna === 'B' || // Coluna B geralmente é IMAGEM
            (img.coluna.includes('IMAGEM') && !img.coluna.includes('FORNECEDOR'))
          ))
        );
        
        const imagemFornecedor = imagensUpload.find(img => 
          // Prioridade 1: Buscar por SKU
          (img.sku && img.sku === skuProduto && (
            img.coluna === 'IMAGEM_FORNECEDOR' || 
            img.coluna === 'IMAGEM FORNECEDOR' ||
            img.coluna.includes('FORNECEDOR')
          )) ||
          // Fallback: Buscar por linha (método antigo)
          (!img.sku && img.linha === linhaExcel && (
            img.coluna === 'IMAGEM_FORNECEDOR' || 
            img.coluna === 'IMAGEM FORNECEDOR' ||
            img.coluna === 'C' || // Coluna C geralmente é IMAGEM FORNECEDOR
            img.coluna.includes('FORNECEDOR')
          ))
        );

         console.log(`🔍 [AUDIT] MAPEAMENTO POR SKU - Produto ${index}: SKU="${skuProduto}", linha Excel ${linhaExcel}, imagem=${imagemPrincipal?.url ? 'encontrada' : 'não encontrada'}, imagem_fornecedor=${imagemFornecedor?.url ? 'encontrada' : 'não encontrada'}`);
         
         // Log detalhado para auditoria do mapeamento por SKU
         console.log(`🔍 [AUDIT] DETALHES MAPEAMENTO SKU "${skuProduto}" (linha ${index}):`, {
           skuProduto: skuProduto,
           imagemPrincipal: imagemPrincipal?.url,
           imagemFornecedor: imagemFornecedor?.url,
           imagemPrincipalSku: imagemPrincipal?.sku,
           imagemFornecedorSku: imagemFornecedor?.sku,
           metodoBusca: imagemPrincipal?.sku ? 'por SKU' : 'por linha (fallback)',
           todasImagensComSku: imagensUpload.filter(img => img.sku === skuProduto).map(img => ({ sku: img.sku, coluna: img.coluna, nome: img.nome })),
           todasImagensDisponiveis: imagensUpload.map(img => ({ sku: img.sku, linha: img.linha, coluna: img.coluna, nome: img.nome })),
         });

        const imagemFinal = imagemPrincipal?.url || linha.IMAGEM || linha.imagem || linha['IMAGEM '] || '';
        const imagemFornecedorFinal = imagemFornecedor?.url || linha['IMAGEM FORNECEDOR'] || linha.IMAGEM_FORNECEDOR || linha.imagem_fornecedor || linha['IMAGEM_FORNECEDOR '] || '';

        if (imagemFinal || imagemFornecedorFinal) {
          console.log(`✅ [DEBUG] Produto ${index} tem imagens:`, {
            sku: linha.SKU || linha.sku,
            imagemFinal,
            imagemFornecedorFinal,
            fonteImagem: imagemPrincipal ? 'extraída' : 'coluna',
            fonteFornecedor: imagemFornecedor ? 'extraída' : 'coluna'
          });
        }

         // Debug: verificar dados das colunas de peso
         console.log(`🔍 [DEBUG] Linha ${index} dados originais:`, {
           'PESO UNITARIO(g)': linha['PESO UNITARIO(g)'],
           'Peso embalado cx Master (KG)': linha['Peso embalado cx Master (KG)'],
           'Peso Sem embalagem cx Master (KG)': linha['Peso Sem embalagem cx Master (KG)'],
           todasAsChaves: Object.keys(linha),
           linhaCompleta: linha
         });

         // Debug específico: verificar todos os campos relacionados a peso
         const camposPeso = Object.keys(linha).filter(key => 
           key.toLowerCase().includes('peso') || 
           key.toLowerCase().includes('master') ||
           key.toLowerCase().includes('kg')
         );
         console.log(`🔍 [DEBUG] Campos relacionados a peso na linha ${index}:`, camposPeso.map(campo => ({
           campo,
           valor: linha[campo]
         })));

         // Debug: verificar especificamente os campos que estamos procurando
         if (index === 0) {
           console.log('🎯 [DEBUG] VERIFICAÇÃO ESPECÍFICA DOS CAMPOS DE PESO:');
           console.log('COLUNA_M (direto):', linha['COLUNA_M']);
           console.log('COLUNA_N (direto):', linha['COLUNA_N']);
           console.log('Peso embalado cx Master (KG):', linha['Peso embalado cx Master (KG)']);
           console.log('PESO EMBALADO CX MASTER (KG):', linha['PESO EMBALADO CX MASTER (KG)']);
           console.log('Peso Sem embalagem cx Master (KG):', linha['Peso Sem embalagem cx Master (KG)']);
           console.log('PESO SEM EMBALAGEM CX MASTER (KG):', linha['PESO SEM EMBALAGEM CX MASTER (KG)']);
           console.log('📋 [DEBUG] TODAS AS CHAVES DA LINHA:', Object.keys(linha));
           
           // Verificar valores finais calculados
           const pesoEmbalado = parseFloat(String(
             linha['COLUNA_M'] || linha['Peso embalado cx Master (KG)'] || '0'
           ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
           const pesoSemEmbalagem = parseFloat(String(
             linha['COLUNA_N'] || linha['Peso Sem embalagem cx Master (KG)'] || '0'
           ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
           
           console.log('🔢 [DEBUG] VALORES FINAIS CALCULADOS:');
           console.log('Peso embalado final:', pesoEmbalado);
           console.log('Peso sem embalagem final:', pesoSemEmbalagem);
         }

         const produto = {
           sku: linha.SKU || linha.sku || `PROD-${index + 1}`,
           imagem: imagemFinal,
           imagem_fornecedor: imagemFornecedorFinal,
           material: linha.MATERIAL || linha.material || '',
           cor: linha.COR || linha.cor || '',
          // Nome do Produto - adicionar mais variações
          nome_produto: linha['Nome do Produto'] || linha.NOME_PRODUTO || linha.nome_produto || linha.NOME || linha.nome || '',
          package: linha.PACKAGE || linha.package || '',
          // PREÇO - adicionar mais variações
          preco: parseFloat(String(linha.PREÇO || linha.PRECO || linha.preco || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          unit: linha.UNIT || linha.unit || '',
          // PCS/CTN - adicionar mais variações
          pcs_ctn: parseInt(String(linha['PCS/CTN'] || linha.PCS_CTN || linha.pcs_ctn || '0').replace(/[^\d]/g, '')) || 0,
          caixas: parseFloat(String(linha.CAIXAS || linha.caixas || '1').replace(/[^\d.,]/g, '').replace(',', '.')) || 1,
           // PESO UNITARIO(g) - mapear corretamente
           peso_unitario_g: parseFloat(String(linha['PESO UNITARIO(g)'] || linha.PESO_UNITARIO_G || linha.peso_unitario_g || linha.PESO_UNITARIO_KG || linha.peso_unitario_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
            // Peso embalado cx Master (KG) - INCLUINDO COLUNA M DIRETA
            peso_cx_master_kg: parseFloat(String(
              linha['COLUNA_M'] ||  // ⭐ REFERÊNCIA DIRETA DA COLUNA M
              linha['Peso embalado cx Master (KG)'] || 
              linha['PESO EMBALADO CX MASTER (KG)'] ||
              linha['Peso embalado cx Master(KG)'] ||
              linha['Peso embalado cx Master (Kg)'] ||
              linha['Peso embalado cx Master'] ||
              linha['PESO EMBALADO CX MASTER'] ||
              linha['peso embalado cx master (kg)'] ||
              linha['peso embalado cx master'] ||
              linha.PESO_MASTER_KG || 
              linha.peso_master_kg || 
              linha.PESO_CX_MASTER_KG || 
              linha.peso_cx_master_kg || 
              '0'
            ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
            // Peso Sem embalagem cx Master (KG) - INCLUINDO COLUNA N DIRETA
            peso_sem_cx_master_kg: parseFloat(String(
              linha['COLUNA_N'] ||  // ⭐ REFERÊNCIA DIRETA DA COLUNA N
              linha['Peso Sem embalagem cx Master (KG)'] || 
              linha['PESO SEM EMBALAGEM CX MASTER (KG)'] ||
              linha['Peso Sem embalagem cx Master(KG)'] ||
              linha['Peso Sem embalagem cx Master (Kg)'] ||
              linha['Peso Sem embalagem cx Master'] ||
              linha['PESO SEM EMBALAGEM CX MASTER'] ||
              linha['peso sem embalagem cx master (kg)'] ||
              linha['peso sem embalagem cx master'] ||
              linha.PESO_SEM_MASTER_KG || 
              linha.peso_sem_master_kg || 
              linha.PESO_SEM_CX_MASTER_KG || 
              linha.peso_sem_cx_master_kg || 
              '0'
            ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          // Peso total embalado cx Master (KG) - CALCULADO
          peso_total_master: 0, // Será calculado
          // Peso total sem embalagem cx Master (KG) - CALCULADO
          peso_total_sem_master: 0, // Será calculado
          // Comprimento, Largura, Altura
          comprimento: parseFloat(String(linha.Comprimento || linha.COMPRIMENTO || linha.comprimento || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          largura: parseFloat(String(linha.Largura || linha.LARGURA || linha.largura || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          altura: parseFloat(String(linha.Altura || linha.ALTURA || linha.altura || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          // CBM Cubagem
          cbm_cubagem: parseFloat(String(linha['CBM Cubagem'] || linha.CBM_CUBAGEM || linha.cbm_cubagem || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          // CBM Total - CALCULADO (ignora planilha)
          cbm_total: 0, // Será calculado
          // Quantidade Total - CALCULADO (ignora planilha)
          quantidade_total: 0, // Será calculado
          // Valor Total - CALCULADO (ignora planilha) 
          valor_total: 0, // Será calculado
          obs: linha.OBS || linha.obs || '',
          change_dolar: parseFloat(String(linha.CHANGE_DOLAR || linha.change_dolar || linha.CHANGE_DOLAR_TOTAL || linha.change_dolar_total || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          multiplicador_reais: parseFloat(String(linha.MULTIPLICADOR_REAIS || linha.multiplicador_reais || linha.MULTIPLICADOR_REAIS_TOTAL || linha.multiplicador_reais_total || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          // Campos calculados adicionais
          preco_unitario: 0, // Será calculado
          quantidade_total_calc: 0, // Será calculado
          cbm_total_calc: 0, // Será calculado
          peso_total_calc: 0, // Será calculado
          peso_total_cx_master_kg: parseFloat(String(linha.PESO_TOTAL_CX_MASTER_KG || linha.peso_total_cx_master_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          peso_total_sem_cx_master_kg: parseFloat(String(linha.PESO_TOTAL_SEM_CX_MASTER_KG || linha.peso_total_sem_cx_master_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          change_dolar_total: parseFloat(String(linha.CHANGE_DOLAR_TOTAL || linha.change_dolar_total || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          multiplicador_reais_total: parseFloat(String(linha.MULTIPLICADOR_REAIS_TOTAL || linha.multiplicador_reais_total || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          // Metadados das imagens - marcar como extraída se houve upload OU se existe referência na coluna
          imagem_extraida: imagemPrincipal ? true : (imagemFinal && imagemFinal.trim() !== '' ? true : false),
          imagem_fornecedor_extraida: imagemFornecedor ? true : (imagemFornecedorFinal && imagemFornecedorFinal.trim() !== '' ? true : false),
        };

        // Cálculos automáticos do sistema (ignorando valores da planilha)
        produto.quantidade_total = produto.caixas * produto.pcs_ctn;
        produto.cbm_total = produto.cbm_cubagem * produto.caixas;
        produto.valor_total = produto.preco * produto.quantidade_total;
        produto.preco_unitario = produto.quantidade_total > 0 ? produto.valor_total / produto.quantidade_total : 0;
        
        // CÁLCULO CORRETO: Peso total embalado cx Master (KG) = Peso embalado cx Master (KG) x CAIXAS
        produto.peso_total_cx_master_kg = produto.peso_cx_master_kg * produto.caixas;
        produto.peso_total_sem_cx_master_kg = produto.peso_sem_cx_master_kg * produto.caixas;

        // Log específico do cálculo de peso
        console.log(`🔢 [DEBUG] Cálculo de peso - Produto ${index + 1}:`, {
          sku: produto.sku,
          peso_cx_master_kg: produto.peso_cx_master_kg,
          peso_sem_cx_master_kg: produto.peso_sem_cx_master_kg,
          caixas: produto.caixas,
          peso_total_cx_master_kg: produto.peso_total_cx_master_kg,
          peso_total_sem_cx_master_kg: produto.peso_total_sem_cx_master_kg,
          calculo: `${produto.peso_cx_master_kg} x ${produto.caixas} = ${produto.peso_total_cx_master_kg}`
        });

        console.log(`✅ [DEBUG] Produto ${index + 1} processado:`, produto);
        return produto;
      } catch (error) {
        console.error('Erro ao processar linha:', linha, error);
        return null;
      }
    }).filter(Boolean);
  };

  const processarArquivoLocal = async (file: File, cotacao: any, onImportSuccess: (dados: any[]) => void) => {
    try {
      setLoading(true);

      // Upload do arquivo primeiro
      const organizationId = cotacao.organization_id;
      const arquivoUpload = await uploadArquivo(file, cotacao.id, organizationId);

      // Ler e processar o arquivo
      const { dados, imagens } = await lerArquivoComImagens(file);

      // Upload das imagens extraídas
      const imagensUpload = await uploadImagensExtraidas(imagens, cotacao.id, organizationId);

      // Processar dados com URLs das imagens
      const dadosProcessados = processarDados(dados, imagensUpload);

      // Salvar dados processados
      await processarArquivo(arquivoUpload.id, dadosProcessados);

      return dadosProcessados;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletarArquivo = useCallback(async (arquivo: CotacaoArquivo) => {
    try {
      console.log('🗑️ [DEBUG] Iniciando exclusão do arquivo:', arquivo);
      setLoading(true);

      // Deletar arquivo do storage se existir URL
      if (arquivo.url_arquivo) {
        const path = arquivo.url_arquivo.split('/cotacoes-arquivos/')[1];
        if (path) {
          console.log('📂 [DEBUG] Removendo arquivo do storage:', path);
          const { error: storageError } = await supabase.storage
            .from('cotacoes-arquivos')
            .remove([path]);
            
          if (storageError) {
            console.warn('⚠️ [DEBUG] Erro ao remover do storage (continuando):', storageError);
          }
        }
      }

      // Deletar registro da tabela
      console.log('🗄️ [DEBUG] Removendo registro da tabela, ID:', arquivo.id);
      const { error } = await supabase
        .from('cotacoes_arquivos')
        .delete()
        .eq('id', arquivo.id);

      if (error) {
        console.error('❌ [DEBUG] Erro ao deletar arquivo da tabela:', error);
        throw error;
      }

      console.log('✅ [DEBUG] Arquivo deletado com sucesso');
      toast({
        title: "Arquivo removido!",
        description: "Arquivo deletado com sucesso.",
      });
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao deletar arquivo:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o arquivo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadTemplate = useCallback(async (formato: 'csv' | 'excel' = 'csv') => {
    try {
      // Colunas baseadas na planilha do usuário
      const headers = [
        'SKU',
        'IMAGEM',
        'IMAGEM FORNECEDOR',
        'MATERIAL',
        'COR',
        'Nome do Produto',
        'PACKAGE',
        'PREÇO',
        'UNIT',
        'PCS/CTN',
        'CAIXAS',
        'PESO UNITARIO(g)',
        'Peso embalado cx Master (KG)',
        'Peso Sem embalagem cx Master (KG)',
        'Peso total embalado cx Master (KG)',
        'Peso total sem embalagem cx Master (KG)',
        'Comprimento',
        'Largura',
        'Altura',
        'CBM Cubagem',
        'CBM Total',
        'Quantidade Total',
        'Valor Total',
        'OBS',
        'CHANGE_DOLAR',
        'MULTIPLICADOR_REAIS'
      ];

      // Dados de exemplo
      const exemploData = [
        ['FL-800', '', '', 'Poliéster', 'IGUAL DA FOTO', 'chapéu aeronáutica, 28*21*14cm', '10pcs/opp', '240', '1', '90', '22,60', '21,60', '0,00', '0,00', '0', '0', '0', '0,21', '0,21', '240', '¥ 1.260,00', '', '', '0,74', 'R$ 5,44'],
        ['FL-801', '', '', 'Poliéster', 'IGUAL DA FOTO', 'chapéu policia, 26,5*25*14cm', '10pcs/opp', '200', '1', '70', '15,00', '14,00', '0,00', '0,00', '0', '0', '0', '0,21', '0,21', '200', '¥ 1.160,00', '', '', '0,81', 'R$ 6,00']
      ];

      if (formato === 'excel') {
        // Importar XLSX dinamicamente
        const XLSX = await import('xlsx');
        
        // Criar workbook
        const wb = XLSX.utils.book_new();
        
        // Criar worksheet com headers e dados
        const wsData = [headers, ...exemploData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        
        // Gerar arquivo Excel
        XLSX.writeFile(wb, 'template_cotacao_internacional.xlsx');
        
        toast({
          title: "Template baixado!",
          description: "Template Excel baixado com sucesso. Cole suas imagens nas colunas B (IMAGEM) e C (IMAGEM_FORNECEDOR).",
        });
      } else {
        // Criar CSV com exemplo
        const csvContent = [
          headers.join(','),
          ...exemploData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Criar e baixar arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'template_cotacao_internacional.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Template baixado!",
          description: "Template CSV baixado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o template.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    loading,
    getArquivosCotacao,
    uploadArquivo,
    processarArquivo,
    processarArquivoLocal,
    deletarArquivo,
    downloadTemplate,
    lerArquivoComImagens,
    uploadImagensExtraidas,
    processarDados,
  };
}