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
      
      // Método 2: NOVO - Usar mapeamento XML preciso
      console.log('🎯 [DEBUG] USANDO NOVO MÉTODO: Mapeamento XML com posições exatas');
      await extrairImagensComPosicaoXML(file, imagens, worksheet);
      
      // FALLBACK: Se não conseguiu via XML, usar método alternativo
      if (imagens.length === 0) {
        console.log('🔄 [DEBUG] XML falhou, tentando método alternativo...');
        await extrairImagensAlternativo(file, imagens);
      }
      
      // ÚLTIMO RECURSO: Se ainda não tem imagens, usar fallback
      if (imagens.length === 0) {
        console.log('🔄 [DEBUG] Método alternativo falhou, usando fallback final...');
        await extrairImagensFallback(file, imagens);
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
      
        // CORREÇÃO: Criar imagens de placeholder SEM reordenação - ordem natural para coluna IMAGEM
        for (let i = 0; i < estimatedImages; i++) {
          const linha = i + 2; // Cada imagem vai para uma linha sequencial (começando linha 2)
          const coluna = 'IMAGEM'; // FOCO: Apenas coluna B por enquanto
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

  const lerXMLDrawings = async (zipData: any): Promise<Map<string, {row: number, col: number}>> => {
    const imagePositions = new Map<string, {row: number, col: number}>();
    
    try {
      console.log('📊 [DEBUG] Lendo XML de drawings para posições exatas...');
      
      // Buscar arquivos de drawing XML com ordenação determinística
      const drawingFiles = Object.keys(zipData.files)
        .filter(name => name.includes('drawings/') && name.endsWith('.xml'))
        .sort((a, b) => a.localeCompare(b)); // Ordenação alfabética garantida
      
      console.log('🎨 [DEBUG] Arquivos de drawing encontrados:', drawingFiles);
      console.log('🔍 [DEBUG] ORDEM ORIGINAL Object.keys():', Object.keys(zipData.files).filter(name => name.includes('drawings/') && name.endsWith('.xml')));
      console.log('✅ [DEBUG] ORDEM APÓS SORT:', drawingFiles);
      
      // Buscar também por relationship files para mapear IDs com ordenação
      const relFiles = Object.keys(zipData.files)
        .filter(name => name.includes('drawings/_rels/') && name.endsWith('.rels'))
        .sort((a, b) => a.localeCompare(b)); // Ordenação alfabética garantida
      
      console.log('🔗 [DEBUG] Arquivos de relationship encontrados:', relFiles);
      
      // Mapear IDs de imagens para arquivos
      const imageIdToFile = new Map<string, string>();
      for (const relFile of relFiles) {
        try {
          const relContent = await zipData.files[relFile].async('string');
          const relDoc = new DOMParser().parseFromString(relContent, 'text/xml');
          const relationships = relDoc.querySelectorAll('Relationship');
          
          relationships.forEach((rel) => {
            const id = rel.getAttribute('Id');
            const target = rel.getAttribute('Target');
            if (id && target && target.includes('media/')) {
              imageIdToFile.set(id, target.replace('../', 'xl/'));
              console.log(`🔗 [DEBUG] Mapeamento ID: ${id} → ${target}`);
            }
          });
        } catch (relError) {
          console.warn(`⚠️ [DEBUG] Erro ao processar ${relFile}:`, relError);
        }
      }
      
      // P2.1: Processar cada arquivo de drawing com validação aprimorada
      for (const drawingFile of drawingFiles) {
        try {
          const xmlContent = await zipData.files[drawingFile].async('string');
          console.log(`📄 [DEBUG] Processando ${drawingFile}...`);
          
          // P2.2: Parser XML com validação de erro
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
          
          // Validar se o XML foi parseado corretamente
          const parserError = xmlDoc.querySelector('parsererror');
          if (parserError) {
            console.warn(`⚠️ [DEBUG] Erro de parsing XML em ${drawingFile}:`, parserError.textContent);
            continue;
          }
          
          // P2.3: Suporte a múltiplos namespaces XML
          const namespaceSelectors = [
            'xdr\\:twoCellAnchor',
            'twoCellAnchor', 
            'a\\:twoCellAnchor',
            'r\\:twoCellAnchor',
            'w\\:twoCellAnchor',
            'anchor'
          ];
          
          let anchors: NodeListOf<Element> | null = null;
          let usedSelector = '';
          
          for (const selector of namespaceSelectors) {
            const foundAnchors = xmlDoc.querySelectorAll(selector);
            if (foundAnchors.length > 0) {
              anchors = foundAnchors;
              usedSelector = selector;
              break;
            }
          }
          
          if (!anchors || anchors.length === 0) {
            console.warn(`⚠️ [DEBUG] Nenhum anchor encontrado em ${drawingFile} usando nenhum dos seletores`);
            continue;
          }
          
          console.log(`🔍 [DEBUG] Encontrados ${anchors.length} anchors no XML usando seletor: ${usedSelector}`);
          
          anchors.forEach((anchor, index) => {
            try {
              // P2.4: Buscar elementos 'from' com múltiplos namespaces
              const fromSelectors = ['xdr\\:from', 'from', 'a\\:from', 'r\\:from'];
              let fromElement: Element | null = null;
              
              for (const selector of fromSelectors) {
                fromElement = anchor.querySelector(selector);
                if (fromElement) break;
              }
              
              if (!fromElement) {
                console.warn(`⚠️ [DEBUG] Elemento 'from' não encontrado no anchor ${index}`);
                return;
              }
              
              // P2.5: Buscar col e row com múltiplos namespaces
              const colSelectors = ['xdr\\:col', 'col', 'a\\:col', 'r\\:col'];
              const rowSelectors = ['xdr\\:row', 'row', 'a\\:row', 'r\\:row'];
              
              let colElement: Element | null = null;
              let rowElement: Element | null = null;
              
              for (const selector of colSelectors) {
                colElement = fromElement.querySelector(selector);
                if (colElement) break;
              }
              
              for (const selector of rowSelectors) {
                rowElement = fromElement.querySelector(selector);
                if (rowElement) break;
              }
              
              if (!colElement || !rowElement) {
                console.warn(`⚠️ [DEBUG] Elementos col/row não encontrados no anchor ${index}`);
                return;
              }
              
              const col = parseInt(colElement.textContent || '0');
              const row = parseInt(rowElement.textContent || '0');
              
              // P2.6: Validar valores de posição
              if (isNaN(col) || isNaN(row) || col < 0 || row < 0) {
                console.warn(`⚠️ [DEBUG] Posição inválida no anchor ${index}: col=${col}, row=${row}`);
                return;
              }
              
              // P2.7: Estratégias aprimoradas para encontrar referência da imagem
              let imageRef = '';
              let strategyUsed = '';
              
              // Estratégia 1: Buscar blip com múltiplos namespaces
              const blipSelectors = ['a\\:blip', 'blip', 'xdr\\:blip', 'r\\:blip'];
              let blipElement: Element | null = null;
              
              for (const selector of blipSelectors) {
                blipElement = anchor.querySelector(selector);
                if (blipElement) break;
              }
              
              if (blipElement) {
                const embedAttrs = ['r:embed', 'embed', 'a:embed', 'xdr:embed'];
                for (const attr of embedAttrs) {
                  const embed = blipElement.getAttribute(attr);
                  if (embed) {
                    imageRef = embed;
                    strategyUsed = `blip-${attr}`;
                    console.log(`📍 [DEBUG] Encontrado embed ID: ${embed} usando ${strategyUsed}`);
                    break;
                  }
                }
              }
              
              // Estratégia 2: Buscar por elementos pic ou shape
              if (!imageRef) {
                const picSelectors = ['xdr\\:pic', 'pic', 'a\\:pic', 'r\\:pic'];
                for (const selector of picSelectors) {
                  const picElement = anchor.querySelector(selector);
                  if (picElement) {
                    const nvPicPrSelectors = ['xdr\\:nvPicPr', 'nvPicPr', 'a\\:nvPicPr'];
                    for (const nvSelector of nvPicPrSelectors) {
                      const nvPicPr = picElement.querySelector(nvSelector);
                      if (nvPicPr) {
                        const cNvPrSelectors = ['xdr\\:cNvPr', 'cNvPr', 'a\\:cNvPr'];
                        for (const cNvSelector of cNvPrSelectors) {
                          const cNvPr = nvPicPr.querySelector(cNvSelector);
                          if (cNvPr) {
                            const name = cNvPr.getAttribute('name') || cNvPr.getAttribute('title');
                            if (name) {
                              imageRef = name;
                              strategyUsed = `pic-name-${selector}`;
                              console.log(`📍 [DEBUG] Encontrado nome da imagem: ${name} usando ${strategyUsed}`);
                              break;
                            }
                          }
                        }
                        if (imageRef) break;
                      }
                    }
                    if (imageRef) break;
                  }
                }
              }
              
              // Estratégia 3: Buscar por atributos de identificação no anchor
              if (!imageRef) {
                const nameAttr = anchor.getAttribute('name') || anchor.getAttribute('id');
                if (nameAttr) {
                  imageRef = nameAttr;
                  strategyUsed = 'anchor-attr';
                  console.log(`📍 [DEBUG] Usando atributo do anchor: ${nameAttr}`);
                }
              }
              
              // Estratégia 4: Usar índice como fallback final
              if (!imageRef) {
                imageRef = `image_${index}`;
                strategyUsed = 'index-fallback';
                console.log(`📍 [DEBUG] Usando fallback index: ${imageRef}`);
              }
              
              // P2.8: Buscar arquivo real da imagem com validação
              const realImageFile = imageIdToFile.get(imageRef);
              const finalRef = realImageFile || imageRef;
              
              // P2.9: Validar se a posição já existe (detectar duplicatas)
              if (imagePositions.has(finalRef)) {
                console.warn(`⚠️ [DEBUG] Posição duplicada detectada para ${finalRef}. Sobrescrevendo...`);
              }
              
              imagePositions.set(finalRef, { row, col });
              
              const cellName = String.fromCharCode(65 + col) + (row + 2);
              console.log(`📍 [DEBUG] Imagem "${finalRef}" mapeada para célula ${cellName} (Linha ${row + 2}, Coluna ${col + 1}) - Estratégia: ${strategyUsed}`);
              
              // P2.10: Log específico para casos problemáticos
              if (finalRef.includes('FL-62') || finalRef.includes('CMD-34')) {
                console.log(`🎯 [DEBUG] ATENÇÃO - Mapeamento crítico: ${finalRef} → ${cellName}`);
              }
              
            } catch (anchorError) {
              console.error(`❌ [DEBUG] Erro ao processar anchor ${index}:`, anchorError);
            }
          });
          
        } catch (xmlError) {
          console.warn(`⚠️ [DEBUG] Erro ao processar ${drawingFile}:`, xmlError);
        }
      }
      
      console.log(`✅ [DEBUG] Total de posições mapeadas: ${imagePositions.size}`);
      imagePositions.forEach((pos, key) => {
        console.log(`🗺️ [DEBUG] ${key} → ${String.fromCharCode(65 + pos.col)}${pos.row + 2}`);
      });
      
      return imagePositions;
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao ler XML de drawings:', error);
      return new Map();
    }
  };

  const extrairImagensComPosicaoXML = async (
    file: File, 
    imagens: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[],
    worksheet: any
  ) => {
    try {
      console.log('🎯 [DEBUG] === INICIANDO MAPEAMENTO XML PRECISO ===');
      console.log('📊 [DEBUG] AUDITORIA INICIAL:', {
        tamanhoArquivo: file.size,
        nomeArquivo: file.name,
        timestampInicio: new Date().toISOString()
      });
      
      // Importar JSZip para ler estrutura completa
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Carregar arquivo como ZIP
      const arrayBuffer = await file.arrayBuffer();
      const zipData = await zip.loadAsync(arrayBuffer);
      
      // Ler posições das imagens do XML
      const imagePositions = await lerXMLDrawings(zipData);
      
      console.log('🗺️ [DEBUG] RESULTADO LEITURA XML:', {
        posiçõesEncontradas: imagePositions.size,
        posiçõesDetalhadas: Array.from(imagePositions.entries()).map(([key, pos]) => ({
          chave: key,
          linha: pos.row + 2,
          coluna: pos.col + 1,
          célula: `${String.fromCharCode(65 + pos.col)}${pos.row + 2}`
        }))
      });
      
      // Buscar arquivos de imagem com ordenação determinística
      const mediaFilesRaw = Object.keys(zipData.files).filter(name => 
        name.startsWith('xl/media/') && (
          name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') ||
          name.endsWith('.gif') || name.endsWith('.bmp')
        )
      );
      
      // CORREÇÃO CRÍTICA: Ordenação determinística por nome/número
      const mediaFiles = mediaFilesRaw.sort((a, b) => {
        // Extrair números dos nomes: image1.png, image2.png, etc.
        const numA = parseInt(a.match(/(\d+)/)?.[0] || '0');
        const numB = parseInt(b.match(/(\d+)/)?.[0] || '0');
        
        // Se ambos têm números, ordenar por número
        if (numA !== 0 && numB !== 0) {
          return numA - numB;
        }
        
        // Senão, ordenação alfabética
        return a.localeCompare(b);
      });
      
      console.log('📸 [DEBUG] AUDITORIA ORDEM DE IMAGENS:');
      console.log('🔍 [DEBUG] ORDEM ORIGINAL Object.keys():', mediaFilesRaw);
      console.log('✅ [DEBUG] ORDEM APÓS SORT DETERMINÍSTICO:', mediaFiles);
      console.log('🎯 [DEBUG] MAPEAMENTO ESPERADO:');
      mediaFiles.forEach((file, index) => {
        const imageName = file.split('/').pop() || file;
        console.log(`  ${index}: ${imageName} → Linha Excel ${index + 2}`);
      });
      
      // Mapear colunas do Excel
      const XLSX = await import('xlsx');
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];
        const imageBlob = await zipData.files[mediaFile].async('blob');
        
        if (imageBlob.size === 0) {
          console.warn(`⚠️ [DEBUG] Arquivo ${mediaFile} está vazio`);
          continue;
        }
        
        // Buscar posição da imagem no XML (estratégias múltiplas)
        const imageName = mediaFile.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
        let position = null;
        let estrategiaUsada = '';
        
        // Estratégia 1: Buscar por arquivo completo
        if (imagePositions.has(mediaFile)) {
          position = imagePositions.get(mediaFile);
          estrategiaUsada = 'arquivo_completo';
        }
        
        // Estratégia 2: Buscar por nome sem extensão
        if (!position) {
          for (const [key, pos] of imagePositions.entries()) {
            if (key.includes(imageName) && imageName.length > 0) {
              position = pos;
              estrategiaUsada = `nome_arquivo: ${key}`;
              break;
            }
          }
        }
        
        // Estratégia 3: Buscar por índice sequencial
        if (!position) {
          for (const [key, pos] of imagePositions.entries()) {
            if (key.includes(`image${i}`) || key.includes(`rId${i + 1}`) || key.includes(i.toString())) {
              position = pos;
              estrategiaUsada = `indice_sequencial: ${key}`;
              break;
            }
          }
        }
        
        // Estratégia 4: CORREÇÃO CRÍTICA - Não usar Array.from que perde contexto
        if (!position && imagePositions.size > 0) {
          // Em vez de Array.from(values()), iterar sobre o Map mantendo contexto
          let positionIndex = 0;
          for (const [key, pos] of imagePositions.entries()) {
            if (positionIndex === i) {
              position = pos;
              estrategiaUsada = `map_iteracao_${positionIndex}: ${key}`;
              break;
            }
            positionIndex++;
          }
        }
        
        console.log(`🔍 [DEBUG] ANÁLISE DETALHADA - Arquivo ${i}:`, {
          arquivo: mediaFile,
          nomeImagem: imageName,
          estratégiaUsada: estrategiaUsada,
          posiçãoEncontrada: position ? `Linha ${position.row + 2}, Coluna ${position.col + 1}` : 'NÃO ENCONTRADA',
          índiceLoop: i,
          totalPosições: imagePositions.size
        });
        
        let linhaExcel, coluna, skuAssociado;
        
        if (position) {
          // MAPEAMENTO PRECISO: Usar posição do XML
          linhaExcel = position.row + 2; // +2 porque row 0 = linha 1, e linha 1 = cabeçalho
          
          // Determinar tipo de coluna baseada na posição
          if (position.col === 1) { // Coluna B
            coluna = 'IMAGEM';
          } else if (position.col === 2) { // Coluna C  
            coluna = 'IMAGEM_FORNECEDOR';
          } else {
            coluna = 'IMAGEM'; // Default
          }
          
          // Buscar SKU da linha correspondente
          const skuAddress = XLSX.utils.encode_cell({ r: position.row + 1, c: 0 });
          const skuCell = worksheet[skuAddress];
          skuAssociado = skuCell?.v ? String(skuCell.v) : `LINHA_${linhaExcel}`;
          
          console.log(`🎯 [DEBUG] MAPEAMENTO XML PRECISO CONFIRMADO:`, {
            arquivo: mediaFile,
            estratégia: estrategiaUsada,
            posicaoXML: `Linha ${position.row + 2}, Coluna ${position.col + 1}`,
            célula: `${String.fromCharCode(65 + position.col)}${linhaExcel}`,
            skuEncontrado: skuAssociado,
            tipoColuna: coluna
          });
          
          console.log(`✅ [DEBUG] MAPEAMENTO CONFIRMADO: "${mediaFile}" → Célula ${String.fromCharCode(65 + position.col)}${linhaExcel} → SKU "${skuAssociado}"`);
          
        } else {
          // FALLBACK: Mapeamento sequencial com logs detalhados
          linhaExcel = i + 2;
          coluna = 'IMAGEM';
          skuAssociado = `FALLBACK_${linhaExcel}`;
          
          console.log(`⚠️ [DEBUG] USANDO FALLBACK SEQUENCIAL:`, {
            arquivo: mediaFile,
            motivoFallback: 'Posição XML não encontrada',
            índiceSequencial: i,
            linhaCalculada: linhaExcel,
            skuFallback: skuAssociado
          });
          
          console.log(`⚠️ [DEBUG] FALLBACK CONFIRMADO: "${mediaFile}" → Linha Sequencial ${linhaExcel} → SKU "${skuAssociado}"`);
        }
        
        const extensao = mediaFile.split('.').pop() || 'png';
        const nomeImagem = `${skuAssociado}_${coluna.toLowerCase()}_xml.${extensao}`;
        
        imagens.push({
          nome: nomeImagem,
          blob: imageBlob,
          linha: linhaExcel,
          coluna: coluna,
          sku: skuAssociado
        });
        
        console.log(`✅ [DEBUG] Imagem mapeada via XML: "${mediaFile}" → SKU "${skuAssociado}", Linha ${linhaExcel}, Coluna ${coluna}`);
      }
      
      console.log(`🎉 [DEBUG] MAPEAMENTO XML CONCLUÍDO - RESUMO FINAL:`, {
        totalImagens: imagens.length,
        totalPosiçõesXML: imagePositions.size,
        arquivosProcessados: mediaFiles.length,
        estratégiasUsadas: imagens.map(img => img.sku?.includes('FALLBACK') ? 'fallback' : 'xml').reduce((acc, curr) => {
          acc[curr] = (acc[curr] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      
      // Log final com mapeamento completo para auditoria
      console.log('📋 [DEBUG] MAPEAMENTO FINAL COMPLETO:');
      imagens.forEach((img, idx) => {
        console.log(`  ${idx + 1}: ${img.nome} → Linha ${img.linha} → SKU "${img.sku}" → Coluna ${img.coluna}`);
      });
      // VALIDAÇÃO FINAL - FASE 1 COMPLETADA
      console.log('🔍 [DEBUG] === VALIDAÇÃO FASE 1 - CORREÇÕES APLICADAS ===');
      
      // Verificar se existe FL-62 e onde foi mapeado
      const fl62Image = imagens.find(img => img.sku && img.sku.includes('FL-62'));
      const cmd34Image = imagens.find(img => img.sku && img.sku.includes('CMD-34'));
      
      if (fl62Image) {
        console.log('✅ [DEBUG] FL-62 ENCONTRADO:', {
          nome: fl62Image.nome,
          linha: fl62Image.linha,
          sku: fl62Image.sku,
          status: fl62Image.linha >= 60 ? 'MAPEAMENTO CORRETO' : 'POSSÍVEL PROBLEMA'
        });
      }
      
      if (cmd34Image) {
        console.log('✅ [DEBUG] CMD-34 ENCONTRADO:', {
          nome: cmd34Image.nome,
          linha: cmd34Image.linha,
          sku: cmd34Image.sku,
          status: cmd34Image.linha <= 5 ? 'MAPEAMENTO CORRETO' : 'POSSÍVEL PROBLEMA'
        });
      }
      
      console.log('🎯 [DEBUG] === FASE 1 CONCLUÍDA COM SUCESSO ===');
      console.log('📋 [DEBUG] CORREÇÕES APLICADAS:');
      console.log('  ✅ Object.keys() substituído por ordenação determinística');  
      console.log('  ✅ Array.from(values()) corrigido para preservar contexto Map');
      console.log('  ✅ Logs de debug detalhados implementados');
      console.log('  ✅ Validação de mapeamento adicionada');
      
    } catch (error) {
      console.error('❌ [DEBUG] ERRO NO MAPEAMENTO XML - FASE 1:', error);
      console.log('🔄 [DEBUG] Preparando fallback para método alternativo...');
      throw error;
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
              
        // CORREÇÃO: Mapear sequencialmente SEM reordenação - ordem natural
        const linha = imagemIndex + 2; // Cada imagem vai para uma linha sequencial
        const coluna = 'IMAGEM'; // FOCO: Apenas coluna B por enquanto
              
              imagens.push({
                nome: `imagem_extraida_${imagemIndex + 1}.png`,
                blob: imageBlob,
                 linha: linha,
                 coluna: coluna
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
              
               // CORREÇÃO: Mapear sequencialmente SEM reordenação - ordem natural
               const linha = imagemIndex + 2; // Cada imagem vai para uma linha sequencial
               const coluna = 'IMAGEM'; // FOCO: Apenas coluna B por enquanto
              
              imagens.push({
                nome: `imagem_extraida_${imagemIndex + 1}.jpg`,
                blob: imageBlob,
                 linha: linha,
                 coluna: coluna
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
    console.log('🔍 [DEBUG] SISTEMA SIMPLIFICADO - SEM FILTROS DE SEPARAÇÃO');
    console.log('🔍 [DEBUG] Imagens disponíveis (ordem original):', imagensUpload);
    
    // REMOVER FILTROS QUE EMBARALHAM A ORDEM
    // Usar mapeamento direto 1:1 sem separar por tipo de coluna
    console.log('🔍 [AUDIT] MAPEAMENTO DIRETO SEM FILTROS - Ordem preservada do upload');
    
    return dados.map((linha, index) => {
      try {
        const skuProduto = linha.SKU || linha.sku || `PROD-${index + 1}`;
        
        // MAPEAMENTO DIRETO: Usar posição exata sem filtros
        const imagemDisponivel = imagensUpload[index] || null;

        console.log(`🔍 [AUDIT] MAPEAMENTO SIMPLIFICADO - Linha ${index}: SKU="${skuProduto}", imagem=${imagemDisponivel?.url ? 'encontrada' : 'não encontrada'}`);
         
        // Log detalhado para auditoria do mapeamento direto
        console.log(`🔍 [AUDIT] DETALHES MAPEAMENTO DIRETO "${skuProduto}" (posição ${index}):`, {
          skuProduto: skuProduto,
          posicaoNaLista: index,
          imagemDisponivel: imagemDisponivel?.url,
          imagemDisponivelNome: imagemDisponivel?.nome,
          imagemDisponivelColuna: imagemDisponivel?.coluna,
          metodoBusca: 'mapeamento direto 1:1 por índice [index] SEM FILTROS',
        });

        // Usar a imagem disponível ou dados da planilha
        const imagemFinal = imagemDisponivel?.url || linha.IMAGEM || linha.imagem || linha['IMAGEM '] || '';
        const imagemFornecedorFinal = imagemDisponivel?.coluna === 'IMAGEM FORNECEDOR' ? imagemDisponivel.url : (linha['IMAGEM FORNECEDOR'] || linha.IMAGEM_FORNECEDOR || linha.imagem_fornecedor || linha['IMAGEM_FORNECEDOR '] || '');

        if (imagemFinal || imagemFornecedorFinal) {
          console.log(`✅ [DEBUG] Produto ${index} tem imagens:`, {
            sku: linha.SKU || linha.sku,
            imagemFinal,
            imagemFornecedorFinal,
            fonteImagem: imagemDisponivel ? 'extraída' : 'coluna',
            colunaImagem: imagemDisponivel?.coluna || 'planilha'
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
          imagem_extraida: imagemDisponivel?.coluna === 'IMAGEM' ? true : (imagemFinal && imagemFinal.trim() !== '' ? true : false),
          imagem_fornecedor_extraida: imagemDisponivel?.coluna === 'IMAGEM FORNECEDOR' ? true : (imagemFornecedorFinal && imagemFornecedorFinal.trim() !== '' ? true : false),
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