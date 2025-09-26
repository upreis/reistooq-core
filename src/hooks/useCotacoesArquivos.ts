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

  const lerArquivoComImagens = (file: File): Promise<{dados: any[], imagens: {nome: string, blob: Blob, linha: number, coluna: string}[]}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          let dados: any[] = [];
          let imagens: {nome: string, blob: Blob, linha: number, coluna: string}[] = [];

          if (file.name.endsWith('.csv')) {
            // Processar CSV (sem imagens)
            const text = data as string;
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
            // Processar Excel com extração de imagens
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(data, { type: 'binary', cellStyles: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Extrair dados da planilha
            dados = XLSX.utils.sheet_to_json(worksheet);
            
            // Tentar extrair imagens se existirem (funcionalidade experimental)
            try {
              if (worksheet['!images']) {
                for (let i = 0; i < worksheet['!images'].length; i++) {
                  const img = worksheet['!images'][i];
                  try {
                    // Converter imagem para blob
                    const imageData = img.data;
                    const blob = new Blob([imageData], { type: 'image/png' });
                    
                    // Determinar posição da imagem (linha e coluna)
                    const cellRef = img.ref || `A${i + 2}`; // Default para linha 2+
                    const linha = parseInt(cellRef.replace(/[A-Z]/g, '')) - 1; // 0-indexed
                    const coluna = cellRef.replace(/[0-9]/g, '');
                    
                    imagens.push({
                      nome: `imagem_${i + 1}_${cellRef}.png`,
                      blob,
                      linha,
                      coluna
                    });
                  } catch (imgError) {
                    console.warn('Erro ao processar imagem:', imgError);
                  }
                }
              }
            } catch (imageError) {
              console.warn('Funcionalidade de extração de imagens ainda em desenvolvimento:', imageError);
            }
          }

          resolve({ dados, imagens });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const uploadImagensExtraidas = async (imagens: {nome: string, blob: Blob, linha: number, coluna: string}[], cotacaoId: string, organizationId: string) => {
    const imagensUpload: {nome: string, url: string, linha: number, coluna: string}[] = [];
    
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

      const totalImagens = dados.filter((p: any) => p.imagem_extraida || p.imagem_fornecedor_extraida).length;
      
      toast({
        title: "Arquivo processado!",
        description: `${dados.length} linhas processadas${totalImagens > 0 ? ` com ${totalImagens} imagens extraídas.` : '.'}`,
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

  const processarDados = (dados: any[], imagensUpload: {nome: string, url: string, linha: number, coluna: string}[] = []): any[] => {
    return dados.map((linha, index) => {
      try {
        // Buscar imagens para esta linha
        const imagemPrincipal = imagensUpload.find(img => 
          img.linha === index + 1 && (img.coluna === 'B' || img.coluna.includes('IMAGEM'))
        );
        const imagemFornecedor = imagensUpload.find(img => 
          img.linha === index + 1 && (img.coluna === 'C' || img.coluna.includes('FORNECEDOR'))
        );

        const produto = {
          sku: linha.SKU || linha.sku || `PROD-${index + 1}`,
          imagem: imagemPrincipal?.url || linha.IMAGEM || linha.imagem || '',
          imagem_fornecedor: imagemFornecedor?.url || linha.IMAGEM_FORNECEDOR || linha.imagem_fornecedor || '',
          material: linha.MATERIAL || linha.material || '',
          cor: linha.COR || linha.cor || '',
          nome_produto: linha.NOME_PRODUTO || linha.nome_produto || '',
          package: linha.PACKAGE || linha.package || '',
          preco: parseFloat(String(linha.PRECO || linha.preco || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          unit: linha.UNIT || linha.unit || '',
          pcs_ctn: parseInt(String(linha.PCS_CTN || linha.pcs_ctn || '0').replace(/[^\d]/g, '')) || 0,
          caixas: parseFloat(String(linha.CAIXAS || linha.caixas || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          peso_unitario: parseFloat(String(linha.PESO_UNITARIO_KG || linha.peso_unitario_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          peso_master: parseFloat(String(linha.PESO_MASTER_KG || linha.peso_master_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          peso_sem_master: parseFloat(String(linha.PESO_SEM_MASTER_KG || linha.peso_sem_master_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          peso_total_master: parseFloat(String(linha.PESO_TOTAL_MASTER_KG || linha.peso_total_master_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          peso_total_sem_master: parseFloat(String(linha.PESO_TOTAL_SEM_MASTER_KG || linha.peso_total_sem_master_kg || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          comprimento: parseFloat(String(linha.COMPRIMENTO || linha.comprimento || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          largura: parseFloat(String(linha.LARGURA || linha.largura || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          altura: parseFloat(String(linha.ALTURA || linha.altura || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          cbm_cubagem: parseFloat(String(linha.CBM_CUBAGEM || linha.cbm_cubagem || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          cbm_total: parseFloat(String(linha.CBM_TOTAL || linha.cbm_total || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          quantidade_total: parseInt(String(linha.QUANTIDADE_TOTAL || linha.quantidade_total || '0').replace(/[^\d]/g, '')) || 0,
          valor_total: parseFloat(String(linha.VALOR_TOTAL || linha.valor_total || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          obs: linha.OBS || linha.obs || '',
          change_dolar: parseFloat(String(linha.CHANGE_DOLAR || linha.change_dolar || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          multiplicador_reais: parseFloat(String(linha.MULTIPLICADOR_REAIS || linha.multiplicador_reais || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          // Campos calculados adicionais
          preco_unitario: 0, // Será calculado
          quantidade_total_calc: 0, // Será calculado
          cbm_total_calc: 0, // Será calculado
          peso_total_calc: 0, // Será calculado
          // Metadados das imagens
          imagem_extraida: imagemPrincipal ? true : false,
          imagem_fornecedor_extraida: imagemFornecedor ? true : false,
        };

        // Cálculos automáticos baseados na lógica existente
        produto.quantidade_total_calc = produto.caixas * produto.pcs_ctn;
        produto.cbm_total_calc = produto.cbm_cubagem * produto.caixas;
        produto.peso_total_calc = produto.peso_unitario * produto.quantidade_total_calc;
        produto.preco_unitario = produto.quantidade_total_calc > 0 ? produto.valor_total / produto.quantidade_total_calc : 0;

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
      setLoading(true);

      // Deletar arquivo do storage se existir URL
      if (arquivo.url_arquivo) {
        const path = arquivo.url_arquivo.split('/cotacoes-arquivos/')[1];
        if (path) {
          await supabase.storage
            .from('cotacoes-arquivos')
            .remove([path]);
        }
      }

      // Deletar registro da tabela
      const { error } = await supabase
        .from('cotacoes_arquivos')
        .delete()
        .eq('id', arquivo.id);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        throw error;
      }

      toast({
        title: "Arquivo removido!",
        description: "Arquivo deletado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
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
      // Colunas baseadas na imagem fornecida
      const headers = [
        'SKU',
        'IMAGEM',
        'IMAGEM_FORNECEDOR',
        'MATERIAL',
        'COR',
        'NOME_PRODUTO',
        'PACKAGE',
        'PRECO',
        'UNIT',
        'PCS_CTN',
        'CAIXAS',
        'PESO_UNITARIO_KG',
        'PESO_MASTER_KG',
        'PESO_SEM_MASTER_KG',
        'PESO_TOTAL_MASTER_KG',
        'PESO_TOTAL_SEM_MASTER_KG',
        'COMPRIMENTO',
        'LARGURA',
        'ALTURA',
        'CBM_CUBAGEM',
        'CBM_TOTAL',
        'QUANTIDADE_TOTAL',
        'VALOR_TOTAL',
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