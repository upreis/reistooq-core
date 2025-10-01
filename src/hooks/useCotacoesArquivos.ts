import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  validarEstruturaExcel, 
  mapearImagensPorSKU, 
  extrairSKUDoFilename,
  validarCorrespondenciaImagemSKU,
  adicionarCorrecaoPendente
} from './useCotacoesValidacoes';
import { useImagemSKUProcessor } from './useImagemSKUProcessor';
import { processarExcelCompletoCorrigido, extrairImagensFornecedorPorXML } from '@/utils/manusImageExtractor';
import { diagnosticarImportacaoExcel, testarMapeamentoCampos, validarTiposDados, diagnosticarProdutoMapeado } from '@/utils/diagnosticoExcel';
import { mapearDadosExcel, extrairValorExcel } from '@/utils/excelMapping';

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

// FUNÇÃO PARA EXTRAIR SKU DO NOME DA IMAGEM
const extrairSKUDoNome = (nomeImagem: string): string | null => {
  if (!nomeImagem) return null;
  
  // Remover extensão do arquivo
  const nomeSemExtensao = nomeImagem.replace(/\.(jpg|jpeg|png|gif|bmp|webp)$/i, '');
  
  // Padrões de SKU suportados
  const padroes = [
    /^(CMD-\d+)/i,           // CMD-16.jpg, CMD-34.jpg
    /^(FL-\d+)/i,            // FL-803.jpg
    /^([A-Z]{2,4}-\d+)/i,    // Padrão geral: XX-123, XXX-456, XXXX-789
    /^([A-Z]+\d+)/i,         // SKU123, PROD456
  ];
  
  for (const padrao of padroes) {
    const match = nomeSemExtensao.match(padrao);
    if (match) {
      const sku = match[1].toUpperCase();
      console.log(`🎯 [SKU_EXTRACT] Nome: ${nomeImagem} → SKU: ${sku}`);
      return sku;
    }
  }
  
  console.log(`⚠️ [SKU_EXTRACT] Não foi possível extrair SKU de: ${nomeImagem}`);
  return null;
};

// FUNÇÃO PARA DETECTAR POSIÇÃO REAL DA IMAGEM NO EXCEL (via ExcelJS)
const detectarPosicaoImagemReal = (worksheet: any, imagemIndex: number) => {
  try {
    // MÉTODO 1: Usar worksheet.getImages() do ExcelJS (se disponível)
    if (worksheet.getImages && typeof worksheet.getImages === 'function') {
      const images = worksheet.getImages();
      if (images && images[imagemIndex]) {
        const img = images[imagemIndex];
        
        // ExcelJS fornece informações de posição da imagem
        // range.tl = top-left corner da imagem
        const linha = img.range?.tl?.row || (imagemIndex + 2);
        const col = img.range?.tl?.col || 1; // 0=A, 1=B, 2=C
        const tipoColuna = col === 1 ? 'IMAGEM' : col === 2 ? 'IMAGEM_FORNECEDOR' : 'IMAGEM';
        const coluna = col === 1 ? 'B' : col === 2 ? 'C' : 'B';
        
        console.log(`📍 [POSITION] Imagem ${imagemIndex + 1} detectada: linha=${linha}, coluna=${coluna} (${tipoColuna})`);
        return { linha, coluna, tipoColuna };
      }
    }
  } catch (error) {
    console.warn('⚠️ [POSITION] Erro ao detectar posição via ExcelJS:', error);
  }
  
  // FALLBACK: Usar ordem sequencial (uma imagem por linha)
  const linhaFallback = imagemIndex + 2; // +2 porque linha 1 = header
  console.log(`📍 [POSITION] Fallback: Imagem ${imagemIndex + 1} → linha ${linhaFallback}`);
  return { linha: linhaFallback, coluna: 'B', tipoColuna: 'IMAGEM' };
};

export function useCotacoesArquivos() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const skuProcessor = useImagemSKUProcessor();

  const getArquivosCotacao = useCallback(async (cotacaoId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .select('*')
        .eq('cotacao_id', cotacaoId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos da cotação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os arquivos da cotação",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadArquivo = useCallback(async (
    cotacaoId: string,
    file: File,
    organizationId: string
  ): Promise<CotacaoArquivo | null> => {
    try {
      setLoading(true);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${cotacaoId}_${timestamp}_${file.name}`;
      const filePath = `${organizationId}/${cotacaoId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cotacoes-arquivos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('cotacoes-arquivos')
        .getPublicUrl(filePath);

      const arquivoData: Omit<CotacaoArquivo, 'id'> = {
        cotacao_id: cotacaoId,
        nome_arquivo: file.name,
        tipo_arquivo: file.name.endsWith('.csv') ? 'csv' as const : 'excel' as const,
        url_arquivo: urlData.publicUrl,
        status: 'pendente'
      };

      const { data, error } = await supabase
        .from('cotacoes_arquivos')
        .insert(arquivoData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso",
      });

      return data as CotacaoArquivo;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload do arquivo",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deletarArquivo = useCallback(async (arquivo: string | CotacaoArquivo, filePath?: string) => {
    try {
      setLoading(true);

      const arquivoId = typeof arquivo === 'string' ? arquivo : arquivo.id;
      if (!arquivoId) {
        throw new Error('ID do arquivo não encontrado');
      }

      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('cotacoes-arquivos')
          .remove([filePath]);

        if (deleteError) {
          console.error('Erro ao deletar arquivo do storage:', deleteError);
        }
      }

      const { error } = await supabase
        .from('cotacoes_arquivos')
        .delete()
        .eq('id', arquivoId);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Arquivo deletado com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o arquivo",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadTemplate = useCallback((formato?: 'csv' | 'excel') => {
    const headers = [
      'SKU', 'Material', 'Cor', 'Nome do Produto', 'Package', 'Preço', 'Unid.', 
      'PCS/CTN', 'Caixas', 'Peso Unit. (g)', 'Peso Emb. Master (KG)', 
      'Peso S/ Emb. Master (KG)', 'Peso Total Emb. (KG)', 'Peso Total S/ Emb. (KG)',
      'Comp. (cm)', 'Larg. (cm)', 'Alt. (cm)', 'CBM Cubagem', 'CBM Total', 
      'Qtd. Total', 'Valor Total', 'Obs.'
    ];

    const csvContent = headers.join(',') + '\n' + 
      'CMD-001,Plástico,Azul,Produto Exemplo,Caixa 12un,10.50,pc,12,5,250,1.2,10.8,6.0,54.0,15.0,10.0,8.0,0.0012,0.006,60,630.00,Produto de exemplo para cotação';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_cotacao_completo.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const lerArquivoComImagens = useCallback(async (
    file: File
  ) => {
    try {
      console.log('🎯 [SKU_SYSTEM] Iniciando processamento completo com extração de imagens');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Verificar se é arquivo ZIP (com imagens) ou Excel simples
      let zip: any = null;
      let mediaFiles: string[] = [];
      
      try {
        const JSZip = (await import('jszip')).default;
        zip = await JSZip.loadAsync(arrayBuffer);
        mediaFiles = Object.keys(zip.files).filter(filename => 
          /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename) && !filename.startsWith('__MACOSX/')
        );
        console.log(`📁 [SKU_SYSTEM] Arquivo ZIP detectado: ${mediaFiles.length} imagens encontradas`);
      } catch (error) {
        console.log('📄 [SKU_SYSTEM] Arquivo Excel simples detectado (sem ZIP)');
      }
      
      // ============================================================
      // ✅ SOLUÇÃO DUPLA: EXTRAIR IMAGENS DAS COLUNAS B E C SEPARADAMENTE
      // ============================================================
      console.log('🚀 [MANUS] Usando extração separada para colunas B e C...');
      
      let imagensEmbutidas: any[] = [];
      
      try {
        // ✅ PASSO 1: Extrair imagens principais (coluna B)
        const resultadoPrincipais = await processarExcelCompletoCorrigido(file);
        
        if (resultadoPrincipais && resultadoPrincipais.imagensPrincipais) {
          console.log(`✅ [MANUS_B] ${resultadoPrincipais.imagensPrincipais.length} imagens principais (coluna B)`);
          
          resultadoPrincipais.imagensPrincipais.forEach((img: any) => {
            imagensEmbutidas.push({
              nome: img.nome,
              blob: img.blob,
              linha: img.linha,
              coluna: 'B',
              sku: img.sku,
              tipoColuna: 'IMAGEM'
            });
            console.log(`  📸 [B] ${img.nome} | SKU: ${img.sku} | Linha: ${img.linha}`);
          });
        }
        
        // ✅ PASSO 2: Extrair imagens de fornecedor (coluna C) com função separada
        const imagensFornecedor = await extrairImagensFornecedorPorXML(file);
        
        if (imagensFornecedor && imagensFornecedor.length > 0) {
          console.log(`✅ [MANUS_C] ${imagensFornecedor.length} imagens de fornecedor (coluna C)`);
          
          imagensFornecedor.forEach((img: any) => {
            const imagemData = {
              nome: img.nomeNovo,
              blob: img.blob,
              linha: img.linha,
              coluna: 'C',
              sku: img.sku,
              tipoColuna: 'IMAGEM_FORNECEDOR',
              url: img.url
            };
            imagensEmbutidas.push(imagemData);
            console.log(`  🏭 [C] ${img.nomeNovo} | SKU: ${img.sku} | Linha: ${img.linha}`);
          });
        } else {
          console.log(`⚠️ [MANUS_C] Nenhuma imagem de fornecedor encontrada na coluna C`);
        }
        
        console.log(`✅ [MANUS] Total: ${imagensEmbutidas.length} imagens processadas`);
        console.log(`🔍 [DEBUG_FINAL] Distribuição:`, 
          imagensEmbutidas.reduce((acc, img) => {
            acc[img.tipoColuna] = (acc[img.tipoColuna] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        );
        
      } catch (error) {
        console.error('❌ [MANUS] Erro ao processar imagens:', error);
        console.log('💡 [MANUS] Certifique-se de que o Excel contém imagens nas colunas B/C');
      }
      
      // Processar dados do Excel
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);
      
      const dados: any[] = [];
      
      if (worksheet) {
        
        // CONSTRUIR MAPA SKU → LINHAS se houver imagens
        if (imagensEmbutidas.length > 0 || mediaFiles.length > 0) {
          console.log('🗺️ [SKU_SYSTEM] Construindo mapa SKU → Linhas para processamento de imagens');
          skuProcessor.construirMapaSkuLinhas(worksheet);
        }
        
        const headers: string[] = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          // Extrair valor simples de objetos complexos do ExcelJS (igual fazemos com dados)
          let cellValue: any = cell.value;
          
          if (cellValue && typeof cellValue === 'object' && !Array.isArray(cellValue) && !(cellValue instanceof Date)) {
            if ('value' in cellValue) {
              cellValue = (cellValue as any).value;
            } else if ('richText' in cellValue) {
              cellValue = (cellValue as any).richText.map((t: any) => t.text).join('');
            } else if ('result' in cellValue) {
              cellValue = (cellValue as any).result;
            } else if ('text' in cellValue) {
              cellValue = (cellValue as any).text;
            }
          }
          
          headers[colNumber - 1] = cellValue?.toString() || `Coluna${colNumber}`;
        });
        
        console.log('📋 [HEADERS] Headers extraídos:', headers);
        console.log('📋 [HEADERS] Total de colunas:', headers.length);
        console.log('📋 [HEADERS] LISTA COMPLETA:', JSON.stringify(headers, null, 2));

        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          const rowData: any = {};
          
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              // CORREÇÃO CRÍTICA: Extrair valor simples de TODOS os tipos de objetos do ExcelJS
              let cellValue: any = cell.value;
              
              // DEBUG: Log detalhado da primeira linha - TODAS as colunas
              if (rowNumber === 2) {
                console.log(`🔍 [CELL_DEBUG] Linha ${rowNumber}, Col ${colNumber}, Header: "${header}", Valor bruto:`, cell.value, 'Tipo:', typeof cell.value);
              }
              
              // ✅ CORREÇÃO: Tratar objetos com _type (formato ExcelJS especial)
              if (cellValue && typeof cellValue === 'object' && !Array.isArray(cellValue) && !(cellValue instanceof Date)) {
                // 1. Objetos com _type e value (problema principal!)
                if ('_type' in cellValue && 'value' in cellValue) {
                  cellValue = (cellValue as any).value;
                  console.log(`🔧 [FIX_TYPE] Extraído _type.value para "${header}":`, cellValue);
                }
                // 2. Objetos com apenas 'value'
                else if ('value' in cellValue) {
                  cellValue = (cellValue as any).value;
                }
                // 3. RichText
                else if ('richText' in cellValue) {
                  cellValue = (cellValue as any).richText.map((t: any) => t.text).join('');
                }
                // 4. Fórmulas
                else if ('result' in cellValue) {
                  cellValue = (cellValue as any).result;
                }
                // 5. Texto simples
                else if ('text' in cellValue) {
                  cellValue = (cellValue as any).text;
                }
              }
              
              // ✅ Converter strings vazias para null
              if (cellValue === '' || cellValue === undefined) {
                cellValue = null;
              }
              
              rowData[header] = cellValue;
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            dados.push(rowData);
          }
        }
        
        // ✅ DIAGNÓSTICO COMPLETO: Analisar dados extraídos
        if (dados.length > 0) {
          diagnosticarImportacaoExcel(dados);
          const dadoMapeadoTeste = testarMapeamentoCampos(dados[0]);
          const errosValidacao = validarTiposDados(dadoMapeadoTeste);
          
          if (errosValidacao.length > 0) {
            console.warn('⚠️ Erros de validação encontrados:', errosValidacao);
          }
        }
      }
      
      console.log('✅ [SKU_SYSTEM] Dados do Excel extraídos:', dados.length);
      
      // SISTEMA SIMPLIFICADO - USAR APENAS UM MÉTODO POR VEZ
      console.log('🎯 [UNIFICADO] Sistema simplificado de processamento de imagens');
      
      let imagens: any[] = [];
      
      // PRIORIDADE 1: Processar imagens embutidas do Excel (SOLUÇÃO MANUS)
      if (imagensEmbutidas.length > 0) {
        console.log('🥇 [UNIFICADO] Usando imagens da solução Manus (coordenadas XML)');
        
        // ✅ CORREÇÃO CRÍTICA: NÃO sobrescrever o SKU que veio da solução Manus!
        // A solução Manus já mapeou corretamente o SKU pela posição XML real.
        const imagensComSku = imagensEmbutidas.map(img => {
          // ✅ USAR O SKU QUE JÁ VEIO DA SOLUÇÃO MANUS (img.sku)
          // ✅ EXTRAIR valores de possíveis objetos ExcelJS
          const skuCorreto = extrairValorExcel(img.sku); // Este SKU foi extraído pela posição XML real!
          const sufixo = img.tipoColuna === 'IMAGEM_FORNECEDOR' ? '-fornecedor' : '';
          
          console.log(`🔍 [MANUS_MAP] Imagem: linha=${img.linha}, coluna=${img.coluna}, tipoColuna=${img.tipoColuna}, SKU=${skuCorreto}`);
          
          return {
            nome: `${skuCorreto}${sufixo}-embutida.jpg`,
            url: img.blob ? URL.createObjectURL(img.blob) : '',
            linha: extrairValorExcel(img.linha),
            coluna: extrairValorExcel(img.coluna),
            sku: skuCorreto, // ✅ SKU correto da solução Manus
            tipoColuna: extrairValorExcel(img.tipoColuna)
          };
        });
        
        imagens = imagensComSku;
        console.log(`✅ [MANUS] ${imagens.length} imagens corretamente mapeadas pela solução Manus`);
      }
      // PRIORIDADE 2: Processar ZIP por SKU
      else if (zip && mediaFiles.length > 0) {
        console.log('🥈 [UNIFICADO] Processando ZIP por SKU');
        const resultado = await skuProcessor.processarImagensIndividualmente(zip, mediaFiles);
        
        imagens = resultado.imagensProcessadas.map(img => ({
          nome: extrairValorExcel(img.arquivoOriginal || img.nome || 'imagem'),
          url: img.blob ? URL.createObjectURL(img.blob) : '',
          linha: extrairValorExcel(img.linha) || 2,
          coluna: 'IMAGEM',
          sku: extrairValorExcel(img.sku)
        }));
        
        console.log(`✅ [UNIFICADO] ${imagens.length} imagens ZIP processadas`);
      }
      
      return { dados, imagens };
      
    } catch (error) {
      console.error('❌ [SKU_SYSTEM] ERRO no processamento:', error);
      throw error;
    }
  }, [skuProcessor]);

  const uploadImagensExtraidas = useCallback(async (
    imagensExtraidas: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string, tipoColuna?: string}[],
    cotacaoId: string,
    organizationId: string
  ) => {
    try {
      setLoading(true);
      console.log(`🔄 [UPLOAD] Iniciando upload de ${imagensExtraidas.length} imagens...`);
      
      if (imagensExtraidas.length === 0) {
        throw new Error('Nenhuma imagem foi encontrada para upload');
      }

      const imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string, tipoColuna?: string}[] = [];
      
      for (const [index, imagem] of imagensExtraidas.entries()) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `${cotacaoId}_${timestamp}_${imagem.nome}`;
          const filePath = `${organizationId}/${cotacaoId}/imagens/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('cotacoes-arquivos')
            .upload(filePath, imagem.blob);

          if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('cotacoes-arquivos')
            .getPublicUrl(filePath);

          imagensUpload.push({
            nome: extrairValorExcel(imagem.nome),
            url: extrairValorExcel(urlData.publicUrl),
            linha: extrairValorExcel(imagem.linha),
            coluna: extrairValorExcel(imagem.coluna),
            sku: extrairValorExcel(imagem.sku),
            tipoColuna: extrairValorExcel(imagem.tipoColuna)
          });

          console.log(`✅ [UPLOAD] Imagem ${index + 1}/${imagensExtraidas.length} enviada: ${imagem.nome}`);
        } catch (error) {
          console.error('Erro ao fazer upload da imagem:', error);
        }
      }

      return imagensUpload;
    } catch (error) {
      console.error('Erro geral no upload das imagens:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const processarDados = useCallback((dados: any[], imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string, tipoColuna?: string}[] = []): any[] => {
    console.log('🔄 [HÍBRIDO] Sistema híbrido - Processamento completo de dados com imagens');
    console.log('📊 [HÍBRIDO] Dados recebidos:', dados.length);
    console.log('🖼️ [HÍBRIDO] Imagens para associação:', imagensUpload.length);
    
    return dados.map((linha, index) => {
      // 🔍 DEBUG: Log detalhado da primeira linha
      if (index === 0) {
        console.log('\n🔍 ==================== DIAGNÓSTICO DETALHADO DA PRIMEIRA LINHA ====================');
        console.log('📋 Chaves disponíveis no Excel:', Object.keys(linha));
        console.log('📊 Valores da primeira linha:');
        Object.keys(linha).forEach(key => {
          const valor = linha[key];
          const valorExtraido = extrairValorExcel(valor);
          console.log(`   "${key}": ${JSON.stringify(valor)} → Extraído: ${JSON.stringify(valorExtraido)}`);
        });
        console.log('==================================================================================\n');
      }
      
      // ✅ SOLUÇÃO HÍBRIDA: Mapeamento robusto de todas as colunas
      const produtoMapeado = {
        // ===== DADOS BÁSICOS ===== (NOMES DO SISTEMA ANTIGO)
        sku: extrairValorExcel(linha.SKU || linha.sku) || `PROD-${index + 1}`,
        
        // MATERIAL
        material: extrairValorExcel(linha.MATERIAL || linha.material) || '',
        
        // COR
        cor: extrairValorExcel(linha.COR || linha.cor) || '',
        
        // NOME DO PRODUTO - usar nome_produto (sistema antigo)
        nome_produto: extrairValorExcel(
          linha['Nome do Produto'] || 
          linha.NOME_PRODUTO || 
          linha.nome_produto || 
          linha.NOME || 
          linha.nome
        ) || '',
        
        // PACKAGE - usar nome package (sistema antigo)
        package: extrairValorExcel(linha.PACKAGE || linha.package || linha.Package) || '',
        
        // PREÇO - usar nome preco (sistema antigo)
        preco: parseFloat(String(
          extrairValorExcel(
            linha.PREÇO || 
            linha.PRECO || 
            linha.preco || 
            linha.Preço
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // UNIDADE - usar nome unit (sistema antigo)
        unit: extrairValorExcel(linha.UNIT || linha.unit) || '',
        
        // PCS/CTN
        pcs_ctn: parseInt(String(
          extrairValorExcel(
            linha['PCS/CTN'] || 
            linha.PCS_CTN || 
            linha.pcs_ctn
          ) || '0'
        ).replace(/[^\d]/g, '')) || 0,
        
        // CAIXAS - usar nome caixas (sistema antigo)
        caixas: parseFloat(String(
          extrairValorExcel(linha.CAIXAS || linha.caixas) || '1'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 1,
        
        // ===== PESOS ===== (NOMES DO SISTEMA ANTIGO)
        
        // PESO UNITÁRIO
        peso_unitario_g: parseFloat(String(
          extrairValorExcel(
            linha['PESO UNITARIO(g)'] || 
            linha.PESO_UNITARIO_G || 
            linha.peso_unitario_g || 
            linha.PESO_UNITARIO_KG || 
            linha.peso_unitario_kg
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // PESO EMBALADO MASTER - usar nome peso_cx_master_kg (sistema antigo)
        peso_cx_master_kg: parseFloat(String(
          extrairValorExcel(
            linha['COLUNA_M'] ||
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
            linha.peso_cx_master_kg
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // PESO SEM EMBALAGEM MASTER - usar nome peso_sem_cx_master_kg (sistema antigo)
        peso_sem_cx_master_kg: parseFloat(String(
          extrairValorExcel(
            linha['COLUNA_N'] ||
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
            linha.peso_sem_cx_master_kg
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // ===== DIMENSÕES ===== (NOMES DO SISTEMA ANTIGO)
        
        // COMPRIMENTO - usar nome comprimento (sistema antigo)
        comprimento: parseFloat(String(
          extrairValorExcel(
            linha.Comprimento || 
            linha.COMPRIMENTO || 
            linha.comprimento
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // LARGURA - usar nome largura (sistema antigo)
        largura: parseFloat(String(
          extrairValorExcel(
            linha.Largura || 
            linha.LARGURA || 
            linha.largura
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // ALTURA - usar nome altura (sistema antigo)
        altura: parseFloat(String(
          extrairValorExcel(
            linha.Altura || 
            linha.ALTURA || 
            linha.altura
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // CBM CUBAGEM - usar nome cbm_cubagem (sistema antigo)
        cbm_cubagem: parseFloat(String(
          extrairValorExcel(
            linha['CBM Cubagem'] || 
            linha.CBM_CUBAGEM || 
            linha.cbm_cubagem
          ) || '0'
        ).replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        
        // ===== CÁLCULOS AUTOMÁTICOS =====
        peso_total_cx_master_kg: 0,
        peso_total_sem_cx_master_kg: 0,
        quantidade_total: 0,
        cbm_total: 0,
        valor_total: 0,
        
        // ===== IMAGENS (Associadas pela lógica posterior) =====
        imagem: '',
        imagem_fornecedor: '',
        
        // ===== OUTROS CAMPOS =====
        obs: extrairValorExcel(
          linha.OBS || 
          linha.obs || 
          linha.Obs
        ) || ''
      };
      
      // ✅ CÁLCULOS AUTOMÁTICOS (Sistema Antigo)
      produtoMapeado.quantidade_total = produtoMapeado.caixas * produtoMapeado.pcs_ctn;
      produtoMapeado.cbm_total = produtoMapeado.cbm_cubagem * produtoMapeado.caixas;
      produtoMapeado.valor_total = produtoMapeado.preco * produtoMapeado.quantidade_total;
      produtoMapeado.peso_total_cx_master_kg = produtoMapeado.peso_cx_master_kg * produtoMapeado.caixas;
      produtoMapeado.peso_total_sem_cx_master_kg = produtoMapeado.peso_sem_cx_master_kg * produtoMapeado.caixas;
      
      // ✅ ALIASES para compatibilidade total com componente (AMBOS os nomes)
      const produtoComAliases = {
        ...produtoMapeado,
        preco_unitario: produtoMapeado.preco,
        unidade_medida: produtoMapeado.unit,
        comprimento_cm: produtoMapeado.comprimento,
        largura_cm: produtoMapeado.largura,
        altura_cm: produtoMapeado.altura,
        cbm_unitario: produtoMapeado.cbm_cubagem,
        nome: produtoMapeado.nome_produto
      };
      
      // 🔍 LOGS: Primeiras 3 linhas
      if (index < 3) {
        console.log(`\n📋 ========== PRODUTO ${index + 1} MAPEADO ==========`);
        console.log(`✅ SKU: "${produtoMapeado.sku}"`);
        console.log(`✅ Material: "${produtoMapeado.material}"`);
        console.log(`✅ Cor: "${produtoMapeado.cor}"`);
        console.log(`✅ Nome: "${produtoMapeado.nome_produto}"`);
        console.log(`✅ Preço: ${produtoMapeado.preco}`);
        console.log(`✅ Dimensões: ${produtoMapeado.comprimento}x${produtoMapeado.largura}x${produtoMapeado.altura}`);
        console.log(`========================================================\n`);
      }
      
      // Auditoria simplificada
      if (index === 0) {
        console.log(`📊 [ASSOCIAÇÃO] Processando ${dados.length} produtos com ${imagensUpload.length} imagens`);
      }
      
      // ====== PRIORIDADE 1: ASSOCIAÇÃO POR NOME DE ARQUIVO ======
      const imagensPorNome = imagensUpload.filter(img => {
        if (!img.nome) return false;
        
        // Extrair SKU do nome do arquivo
        const skuFromName = extrairSKUDoNome(img.nome);
        const skuProduto = produtoMapeado.sku.toUpperCase().trim();
        
        if (skuFromName) {
          const match = skuFromName === skuProduto || 
                       skuFromName.replace(/[-_]/g, '') === skuProduto.replace(/[-_]/g, '');
          
          if (match) {
            console.log(`🎯 MATCH PERFEITO POR NOME: ${img.nome} → SKU ${skuProduto}`);
            return true;
          }
        }
        return false;
      });
      
      // Se encontrou por nome, usar essa associação e pular o resto
      if (imagensPorNome.length > 0) {
        console.log(`🔍 [DEBUG_NOME] Encontradas ${imagensPorNome.length} imagens por nome para SKU ${produtoMapeado.sku}`);
        imagensPorNome.forEach(img => {
          const tipo = img.tipoColuna || img.coluna;
          // ✅ CORREÇÃO: Extrair valor de objetos ExcelJS
          const urlLimpa = extrairValorExcel(img.url);
          console.log(`🔍 [DEBUG_ASSOC] Associando por NOME: SKU=${produtoMapeado.sku}, tipo=${tipo}, url=${urlLimpa?.substring(0, 50)}...`);
          
          if (tipo === 'IMAGEM' || tipo === 'B') {
            produtoMapeado.imagem = urlLimpa;
            console.log(`   ✅ Atribuído a 'imagem'`);
          } else if (tipo === 'IMAGEM_FORNECEDOR' || tipo === 'C') {
            produtoMapeado.imagem_fornecedor = urlLimpa;
            console.log(`   ✅ Atribuído a 'imagem_fornecedor'`);
          } else {
            console.log(`   ⚠️ Tipo não reconhecido: ${tipo}`);
          }
        });
        console.log(`✅ [NOME] Produto ${produtoMapeado.sku}: imagem=${!!produtoMapeado.imagem}, imagem_fornecedor=${!!produtoMapeado.imagem_fornecedor}`);
        
        
        return produtoMapeado;
      }
      
      // ====== PRIORIDADE 2: ASSOCIAÇÃO POR SKU (FLEXÍVEL) ======
      const imagensPorSku = imagensUpload.filter(img => {
        if (!img.sku || !produtoMapeado.sku) return false;
        
        const skuImagem = img.sku.toUpperCase().trim();
        const skuProduto = produtoMapeado.sku.toUpperCase().trim();
        
        // Comparações de SKU (flexível - sem exigir linha exata)
        const skuMatch = skuImagem === skuProduto || 
                        skuImagem.replace(/[-_]/g, '') === skuProduto.replace(/[-_]/g, '');
        
        if (skuMatch) {
          console.log(`✅ MATCH POR SKU: ${img.sku} → Produto ${skuProduto} (linha ${img.linha})`);
          return true;
        }
        
        return false;
      });
      
      console.log(`  - Matches por SKU: ${imagensPorSku.length}`);
      
      // SEPARAR COLUNAS CORRETAMENTE
      if (imagensPorSku.length > 0) {
        console.log(`🔍 [DEBUG_SKU] Encontradas ${imagensPorSku.length} imagens por SKU para ${produtoMapeado.sku}`);
        imagensPorSku.forEach(img => {
          const tipo = img.tipoColuna || img.coluna;
          // ✅ CORREÇÃO: Extrair valor de objetos ExcelJS
          const urlLimpa = extrairValorExcel(img.url);
          console.log(`🔍 [DEBUG_ASSOC] Associando por SKU: SKU=${produtoMapeado.sku}, tipo=${tipo}, url=${urlLimpa?.substring(0, 50)}...`);
          
          if (tipo === 'IMAGEM' || tipo === 'B') {
            produtoMapeado.imagem = urlLimpa;
            console.log(`   ✅ Atribuído a 'imagem'`);
          } else if (tipo === 'IMAGEM_FORNECEDOR' || tipo === 'C') {
            produtoMapeado.imagem_fornecedor = urlLimpa;
            console.log(`   ✅ Atribuído a 'imagem_fornecedor'`);
          } else {
            console.log(`   ⚠️ Tipo não reconhecido: ${tipo}`);
          }
        });
        console.log(`✅ [SKU_SYSTEM] Produto ${produtoMapeado.sku}: imagem=${!!produtoMapeado.imagem}, imagem_fornecedor=${!!produtoMapeado.imagem_fornecedor}`);
      } else {
        // 2ª PRIORIDADE: Associação por linha (fallback apenas para casos especiais)
        const imagensPorLinha = imagensUpload.filter(img => img.linha === (index + 2)); // +2 porque linha 1 = header
        
        if (imagensPorLinha.length > 0) {
          console.log(`🔍 [DEBUG_LINHA] Encontradas ${imagensPorLinha.length} imagens por linha ${index + 2} para ${produtoMapeado.sku}`);
          imagensPorLinha.forEach(img => {
            const tipo = img.tipoColuna || img.coluna;
            // ✅ CORREÇÃO: Extrair valor de objetos ExcelJS
            const urlLimpa = extrairValorExcel(img.url);
            console.log(`   🔍 tipo=${tipo}, coluna=${img.coluna}, tipoColuna=${img.tipoColuna}`);
            if (tipo === 'IMAGEM' || tipo === 'B') {
              produtoMapeado.imagem = urlLimpa;
              console.log(`   ✅ Atribuído a 'imagem'`);
            } else if (tipo === 'IMAGEM_FORNECEDOR' || tipo === 'C') {
              produtoMapeado.imagem_fornecedor = urlLimpa;
              console.log(`   ✅ Atribuído a 'imagem_fornecedor'`);
            }
          });
          console.log(`✅ [LINHA_SYSTEM] Produto ${produtoMapeado.sku}: ${imagensPorLinha.length} imagem(ns) associada(s) por linha ${index + 2}`);
        } else {
          console.log(`❌ [NO_MATCH] Produto ${produtoMapeado.sku}: Nenhuma imagem encontrada (nem por SKU nem por linha)`);
        }
      }
      
      
      return produtoMapeado;
    });
  }, []);

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
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Arquivo processado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      
      await supabase
        .from('cotacoes_arquivos')
        .update({
          status: 'erro',
          detalhes_erro: [{ error: error instanceof Error ? error.message : 'Erro desconhecido' }]
        })
        .eq('id', arquivoId);

      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const processarArquivoLocal = useCallback(async (file: File): Promise<any[]> => {
    try {
      setLoading(true);
      
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('Planilha não encontrada');
      }

      const dados: any[] = [];
      const headers: string[] = [];
      
      // Extrair cabeçalhos da primeira linha
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || `Coluna${colNumber}`;
      });

      // Processar dados das linhas subsequentes
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData: any = {};
        
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        if (Object.keys(rowData).length > 0) {
          dados.push(rowData);
        }
      }

      return dados;
    } catch (error) {
      console.error('Erro ao processar arquivo local:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
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