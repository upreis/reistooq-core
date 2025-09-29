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
        const coluna = col === 1 ? 'IMAGEM' : 'IMAGEM_FORNECEDOR';
        
        console.log(`📍 [POSITION] Imagem ${imagemIndex + 1} detectada: linha=${linha}, coluna=${coluna}`);
        return { linha, coluna };
      }
    }
  } catch (error) {
    console.warn('⚠️ [POSITION] Erro ao detectar posição via ExcelJS:', error);
  }
  
  // FALLBACK: Usar ordem sequencial (uma imagem por linha)
  const linhaFallback = imagemIndex + 2; // +2 porque linha 1 = header
  console.log(`📍 [POSITION] Fallback: Imagem ${imagemIndex + 1} → linha ${linhaFallback}`);
  return { linha: linhaFallback, coluna: 'IMAGEM' };
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
      'SKU', 'PRODUTO', 'DESCRICAO', 'PRECO_UNITARIO', 'QUANTIDADE', 
      'PRECO_TOTAL', 'CATEGORIA', 'FORNECEDOR', 'OBSERVACOES',
      'MATERIAL', 'COR', 'PACKAGE', 'UNIT', 'PCS_CTN', 'CAIXAS'
    ];

    const csvContent = headers.join(',') + '\n' + 
      'EXEMPLO-001,Produto Exemplo,Descrição do produto,10.50,2,21.00,Categoria A,Fornecedor XYZ,Observações aqui,Plástico,Azul,Caixa,pc,12,5';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_cotacao.csv');
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
      
      // Processar dados do Excel E EXTRAIR IMAGENS EMBUTIDAS
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);
      
      const dados: any[] = [];
      let imagensEmbutidas: any[] = [];
      
      if (worksheet) {
        // EXTRAIR IMAGENS EMBUTIDAS DO EXCEL
        console.log('🖼️ [SKU_SYSTEM] Procurando imagens embutidas no Excel...');
        
        try {
          // MÉTODO 1: Tentar usar ExcelJS getImages (pode não existir em todas as versões)
          if (worksheet.getImages && typeof worksheet.getImages === 'function') {
            const images = worksheet.getImages();
            console.log(`📸 [SKU_SYSTEM] Método ExcelJS: ${images.length} imagens encontradas`);
            
            images.forEach((image: any, index: number) => {
              // Processar imagens via ExcelJS
              console.log(`🖼️ [SKU_SYSTEM] Processando imagem ${index + 1} via ExcelJS`);
            });
          } else {
            console.log('⚠️ [SKU_SYSTEM] Método ExcelJS não disponível, tentando extração manual...');
          }
          
          // MÉTODO 2: Extração manual via ZIP do Excel
          if (zip && imagensEmbutidas.length === 0) {
            console.log('🔍 [SKU_SYSTEM] Procurando imagens na estrutura interna do Excel ZIP...');
            
            // Excel armazena imagens em xl/media/
            const xlMediaFiles = Object.keys(zip.files).filter(filename => 
              filename.startsWith('xl/media/') && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)
            );
            
            if (xlMediaFiles.length > 0) {
              console.log(`📁 [SKU_SYSTEM] ${xlMediaFiles.length} imagens encontradas em xl/media/`);
              
              for (let i = 0; i < xlMediaFiles.length; i++) {
                const mediaFile = xlMediaFiles[i];
                const zipFile = zip.files[mediaFile];
                
                if (zipFile) {
                  const blob = await zipFile.async('blob');
                  
                  // DETECTAR POSIÇÃO REAL DA IMAGEM NO EXCEL
                  const imagemInfo = detectarPosicaoImagemReal(worksheet, i);
                  
                  // EXTRAIR SKU DO NOME DO ARQUIVO
                  const skuExtraido = extrairSKUDoNome(mediaFile);
                  
                  imagensEmbutidas.push({
                    nome: skuExtraido ? `${skuExtraido}.jpg` : `imagem_excel_${i + 1}.jpg`,
                    blob: blob,
                    linha: imagemInfo.linha,
                    coluna: imagemInfo.coluna,
                    sku: skuExtraido
                  });
                  
                  console.log(`📷 [SKU_SYSTEM] Imagem ${i + 1} extraída: ${mediaFile}`);
                }
              }
            } else {
              console.log('📝 [SKU_SYSTEM] Nenhuma imagem encontrada na estrutura xl/media/');
            }
          }
        } catch (error) {
          console.log('⚠️ [SKU_SYSTEM] Erro ao extrair imagens embutidas:', error);
          console.log('💡 [SKU_SYSTEM] Dica: Para melhor suporte a imagens, salve o Excel como ZIP com imagens nomeadas por SKU');
        }
        
        // CONSTRUIR MAPA SKU → LINHAS se houver imagens
        if (imagensEmbutidas.length > 0 || mediaFiles.length > 0) {
          console.log('🗺️ [SKU_SYSTEM] Construindo mapa SKU → Linhas para processamento de imagens');
          skuProcessor.construirMapaSkuLinhas(worksheet);
        }
        
        const headers: string[] = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || `Coluna${colNumber}`;
        });

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
      }
      
      console.log('✅ [SKU_SYSTEM] Dados do Excel extraídos:', dados.length);
      
      // PROCESSAR IMAGENS (ZIP + Embutidas)
      let imagens: any[] = [];
      
      // 1. Processar imagens do ZIP se houver
      if (zip && mediaFiles.length > 0) {
        console.log('🖼️ [SKU_SYSTEM] Processando imagens do ZIP por SKU...');
        const resultado = await skuProcessor.processarImagensIndividualmente(zip, mediaFiles);
        
        console.log('✅ [SKU_SYSTEM] Processamento de imagens ZIP concluído:', {
          imagensProcessadas: resultado.imagensProcessadas.length,
          rejeitadas: resultado.rejeitadas.length,
          renomeadas: resultado.renomeadasCount
        });
        
        // Mapear para formato esperado
        const imagensZip = resultado.imagensProcessadas.map(img => {
          // Extrair SKU do nome original do arquivo também
          const skuDoNome = extrairSKUDoNome(img.arquivoOriginal);
          const skuFinal = img.sku || skuDoNome;
          
          return {
            nome: img.arquivoOriginal, // Manter nome original para extração de SKU
            blob: img.blob,
            linha: img.linha,
            coluna: 'IMAGEM',
            sku: skuFinal
          };
        });
        
        imagens = [...imagens, ...imagensZip];
      }
      
      // 2. Processar imagens embutidas do Excel
      if (imagensEmbutidas.length > 0) {
        console.log('🖼️ [SKU_SYSTEM] Associando imagens embutidas do Excel por linha...');
        
        // Associar SKUs às imagens embutidas baseado na linha
        const imagensComSku = imagensEmbutidas.map(img => {
          // Encontrar SKU da linha correspondente
          const produtoData = dados[img.linha - 2]; // -2 porque linha 1 = cabeçalho, linha 2 = dados[0]
          const sku = produtoData?.SKU || produtoData?.sku || `PROD-${img.linha}`;
          
          return {
            nome: `${sku}-embutida.jpg`,
            blob: img.blob,
            linha: img.linha,
            coluna: img.coluna,
            sku: sku
          };
        });
        
        console.log(`✅ [SKU_SYSTEM] ${imagensComSku.length} imagens embutidas associadas por linha`);
        imagens = [...imagens, ...imagensComSku];
      }
      
      return { dados, imagens };
      
    } catch (error) {
      console.error('❌ [SKU_SYSTEM] ERRO no processamento:', error);
      throw error;
    }
  }, [skuProcessor]);

  const uploadImagensExtraidas = useCallback(async (
    imagensExtraidas: {nome: string, blob: Blob, linha: number, coluna: string, sku?: string}[],
    cotacaoId: string,
    organizationId: string
  ) => {
    try {
      setLoading(true);
      console.log(`🔄 [UPLOAD] Iniciando upload de ${imagensExtraidas.length} imagens...`);
      
      if (imagensExtraidas.length === 0) {
        throw new Error('Nenhuma imagem foi encontrada para upload');
      }

      const imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string}[] = [];
      
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
            nome: imagem.nome,
            url: urlData.publicUrl,
            linha: imagem.linha,
            coluna: imagem.coluna,
            sku: imagem.sku
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

  const processarDados = useCallback((dados: any[], imagensUpload: {nome: string, url: string, linha: number, coluna: string, sku?: string}[] = []): any[] => {
    console.log('🔄 [SKU_SYSTEM] Processamento completo de dados com imagens');
    console.log('📊 [SKU_SYSTEM] Dados recebidos:', dados.length);
    console.log('🖼️ [SKU_SYSTEM] Imagens para associação:', imagensUpload.length);
    
    return dados.map((item, index) => {
      // Mapeamento de campos
      const produtoMapeado = {
        ...item,
        sku: item.SKU || item.sku || `PROD-${index + 1}`,
        nome_produto: item.PRODUTO || item.produto || item.nome_produto || '',
        preco: Number(item.PRECO_UNITARIO || item.preco_unitario || item.preco) || 0,
        quantidade: Number(item.QUANTIDADE || item.quantidade) || 1,
        valor_total: Number(item.PRECO_TOTAL || item.preco_total || item.valor_total) || 0,
        material: item.material || item.Material || '',
        cor: item.cor || item.Cor || item.COR || '',
        package: item.package || item.Package || item.PACKAGE || '',
        unit: item.unit || item.Unit || item.UNIT || 'pc',
        pcs_ctn: Number(item.pcs_ctn || item.PCS_CTN) || 0,
        caixas: Number(item.caixas || item.Caixas || item.CAIXAS) || 1,
        imagem: '',
        imagem_fornecedor: ''
      };
      
      // LOGS DETALHADOS PARA DEBUG
      console.log(`🔍 AUDIT: Produto ${index + 1}:`);
      console.log(`  - SKU: ${produtoMapeado.sku}`);
      console.log(`  - Linha Excel: ${index + 2}`);
      console.log(`  - Imagens encontradas: ${imagensUpload.length}`);
      
      imagensUpload.forEach((img, i) => {
        console.log(`  - Imagem ${i + 1}: Nome=${img.nome}, SKU=${img.sku}, Linha=${img.linha}, Coluna=${img.coluna}`);
      });
      
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
        imagensPorNome.forEach(img => {
          if (img.coluna === 'IMAGEM') {
            produtoMapeado.imagem = img.url;
          } else if (img.coluna === 'IMAGEM_FORNECEDOR') {
            produtoMapeado.imagem_fornecedor = img.url;
          }
        });
        console.log(`✅ [NOME] Produto ${produtoMapeado.sku}: ${imagensPorNome.length} imagem(ns) associada(s) por NOME DE ARQUIVO`);
        
        // Debug adicional
        if (produtoMapeado.imagem) {
          console.log(`🔍 [AUDIT] Produto ${index + 1}: imagem=${produtoMapeado.imagem.substring(0, 100)}...`);
        }
        
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
        imagensPorSku.forEach(img => {
          if (img.coluna === 'IMAGEM') {
            produtoMapeado.imagem = img.url;
          } else if (img.coluna === 'IMAGEM_FORNECEDOR') {
            produtoMapeado.imagem_fornecedor = img.url;
          }
        });
        console.log(`✅ [SKU_SYSTEM] Produto ${produtoMapeado.sku}: ${imagensPorSku.length} imagem(ns) associada(s) por SKU MATCH`);
      } else {
        // 2ª PRIORIDADE: Associação por linha (fallback apenas para casos especiais)
        const imagensPorLinha = imagensUpload.filter(img => img.linha === (index + 2)); // +2 porque linha 1 = header
        
        if (imagensPorLinha.length > 0) {
          produtoMapeado.imagem = imagensPorLinha[0].url;
          if (imagensPorLinha[1]) {
            produtoMapeado.imagem_fornecedor = imagensPorLinha[1].url;
          }
          console.log(`✅ [LINHA_SYSTEM] Produto ${produtoMapeado.sku}: ${imagensPorLinha.length} imagem(ns) associada(s) por linha ${index + 2}`);
        } else {
          console.log(`❌ [NO_MATCH] Produto ${produtoMapeado.sku}: Nenhuma imagem encontrada (nem por SKU nem por linha)`);
        }
      }
      
      // Debug adicional
      console.log(`🔍 [AUDIT] Produto ${index + 1}: imagem=${produtoMapeado.imagem ? 'DEFINIDA' : 'VAZIA'}`);
      if (produtoMapeado.imagem) {
        console.log(`🔍 [AUDIT] Produto ${index + 1}: imagem=${produtoMapeado.imagem.substring(0, 100)}...`);
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