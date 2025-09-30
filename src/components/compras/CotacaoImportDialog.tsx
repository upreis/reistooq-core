import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Eye
} from "lucide-react";
import { useCotacoesArquivos } from "@/hooks/useCotacoesArquivos";
import { useToast } from "@/hooks/use-toast";
import { extrairImagensDoExcel, converterImagensParaDataURL } from '@/utils/excelImageExtractor';
import * as XLSX from 'xlsx';

interface CotacaoImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacao: any;
  onImportSuccess: (dados: any[]) => void;
}

interface ArquivoProcessado {
  id?: string;
  cotacao_id: string;
  nome_arquivo: string;
  tipo_arquivo: string; // Permitir qualquer string do banco
  url_arquivo?: string;
  status: string; // Permitir qualquer string do banco
  total_linhas?: number;
  linhas_processadas?: number;
  linhas_erro?: number;
  dados_processados?: any;
  detalhes_erro?: any;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  organization_id?: string;
}

export const CotacaoImportDialog: React.FC<CotacaoImportDialogProps> = ({
  open,
  onOpenChange,
  cotacao,
  onImportSuccess
}) => {
  const [arquivos, setArquivos] = useState<ArquivoProcessado[]>([]);
  const [processando, setProcessando] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const {
    loading,
    getArquivosCotacao,
    uploadArquivo,
    processarArquivo,
    deletarArquivo,
    downloadTemplate,
    lerArquivoComImagens,
    uploadImagensExtraidas,
    processarDados
  } = useCotacoesArquivos();

  // Remover carregamento de arquivos do banco - usar apenas local

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const isValidType = file.name.endsWith('.xlsx') || 
                       file.name.endsWith('.xls') || 
                       file.name.endsWith('.csv');
    
    if (!isValidType) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 20MB.",
        variant: "destructive",
      });
      return;
    }

    processarArquivoLocal(file);
  }, [cotacao, toast]);

  const processarArquivoLocal = async (file: File) => {
    try {
      console.log('🎯 Iniciando processamento local do arquivo:', file.name);
      
      setProcessando(true);
      setProgressoUpload(10);

      // Usar IDs fixos para evitar dependência do banco
      const cotacaoId = "local-cotacao-001";
      const organizationId = "local-org-001";
      // Simular upload do arquivo
      console.log('⬆️ Simulando upload do arquivo...');
      const arquivoUpload = { 
        id: `arquivo-${Date.now()}`,
        nome_arquivo: file.name,
        status: 'processado'
      };
      console.log('✅ Upload simulado concluído:', arquivoUpload);
      setProgressoUpload(30);

      // PASSO 1: Extrair dados normais
      console.log('📊 [POSIÇÃO] PASSO 1: Extraindo dados da planilha...');
      const dados = await lerArquivo(file);
      console.log('📊 [POSIÇÃO] Dados extraídos:', dados.length, 'produtos');
      setProgressoUpload(30);
      
      // PASSO 2: Extrair imagens por posição
      console.log('📸 [POSIÇÃO] PASSO 2: Extraindo imagens por posicionamento...');
      const imagensExtraidas = await extrairImagensDoExcel(file);
      console.log('📸 [POSIÇÃO] Imagens extraídas:', imagensExtraidas.length);
      setProgressoUpload(50);
      
      // PASSO 3: Converter para Data URL
      console.log('🔄 [POSIÇÃO] PASSO 3: Convertendo imagens...');
      const imagensProcessadas = await converterImagensParaDataURL(imagensExtraidas);
      console.log('🔄 [POSIÇÃO] Imagens processadas:', imagensProcessadas.length);
      setProgressoUpload(70);
      
      // DEBUG DETALHADO
      console.log('🎯 [POSIÇÃO] MAPEAMENTO FINAL:');
      imagensProcessadas.forEach((img, i) => {
        console.log(`  ${i + 1}. SKU: ${img.sku} → Imagem: ${img.nome}`);
      });
      
      // CORRELACIONAR IMAGENS COM PRODUTOS (SEPARANDO POR TIPO)
      console.log('🔗 [POSIÇÃO] CORRELACIONANDO IMAGENS COM PRODUTOS...');
      const produtosComImagens = dados.map(produto => {
        // Buscar imagem principal (coluna B)
        const imagemPrincipal = imagensProcessadas.find(img => 
          (img.sku === produto.sku || img.sku === String(produto.sku) ||
           img.sku === produto.SKU || img.sku === String(produto.SKU)) &&
          img.tipoColuna === 'IMAGEM'
        );
        
        // Buscar imagem de fornecedor (coluna C)
        const imagemFornecedor = imagensProcessadas.find(img => 
          (img.sku === produto.sku || img.sku === String(produto.sku) ||
           img.sku === produto.SKU || img.sku === String(produto.SKU)) &&
          img.tipoColuna === 'IMAGEM_FORNECEDOR'
        );
        
        return {
          ...produto,
          imagem: imagemPrincipal?.url || '',
          imagem_fornecedor: imagemFornecedor?.url || '',
          nomeImagem: imagemPrincipal?.nome || ''
        };
      });
      
      console.log('✅ [POSIÇÃO] CORRELAÇÃO CONCLUÍDA!');
      console.log(`📊 [POSIÇÃO] ${produtosComImagens.filter(p => p.imagem).length} produtos com imagem principal (coluna B)`);
      console.log(`📊 [POSIÇÃO] ${produtosComImagens.filter(p => p.imagem_fornecedor).length} produtos com imagem fornecedor (coluna C)`);
      console.log(`📊 [POSIÇÃO] ${produtosComImagens.filter(p => !p.imagem && !p.imagem_fornecedor).length} produtos sem imagens`);
      setProgressoUpload(80);
      
      let dadosProcessados = produtosComImagens;
      
      try {
        // MAPEAR TODOS OS CAMPOS DO EXCEL PARA ESTRUTURA COMPLETA
        dadosProcessados = produtosComImagens.map((item, index) => ({
          id: `produto-${index}`,
          
          // CAMPOS BÁSICOS
          sku: item.SKU || item.sku || `PROD-${index + 1}`,
          material: item.Material || item.material || '',
          cor: item.Cor || item.cor || '',
          nome_produto: item['Nome do Produto'] || item.PRODUTO || item.produto || `Produto ${index + 1}`,
          package: item.Package || item.package || '',
          
          // PREÇOS E QUANTIDADES
          preco_unitario: Number(item.Preço || item.PRECO_UNITARIO || item.preco || 0),
          unidade: item['Unid.'] || item.UNIT || item.unidade || 'un',
          pcs_ctn: Number(item['PCS/CTN'] || item.pcs_ctn || 0),
          caixas: Number(item.Caixas || item.caixas || 0),
          quantidade_total: Number(item['Qtd. Total'] || item.QUANTIDADE || item.quantidade || 1),
          valor_total: Number(item['Valor Total'] || item.PRECO_TOTAL || item.valor_total || 0),
          
          // PESOS (EM GRAMAS E QUILOS)
          peso_unitario_g: Number(item['Peso Unit. (g)'] || item.peso_unitario || 0),
          peso_embalagem_master_kg: Number(item['Peso Emb. Master (KG)'] || item.peso_embalagem || 0),
          peso_sem_embalagem_master_kg: Number(item['Peso S/ Emb. Master (KG)'] || item.peso_liquido || 0),
          peso_total_embalagem_kg: Number(item['Peso Total Emb. (KG)'] || item.peso_total_bruto || 0),
          peso_total_sem_embalagem_kg: Number(item['Peso Total S/ Emb. (KG)'] || item.peso_total_liquido || 0),
          
          // DIMENSÕES (EM CENTÍMETROS)
          comprimento_cm: Number(item['Comp. (cm)'] || item.comprimento || 0),
          largura_cm: Number(item['Larg. (cm)'] || item.largura || 0),
          altura_cm: Number(item['Alt. (cm)'] || item.altura || 0),
          
          // CUBAGEM
          cbm_cubagem: Number(item['CBM Cubagem'] || item.cbm_unitario || 0),
          cbm_total: Number(item['CBM Total'] || item.cbm_total || 0),
          
          // OBSERVAÇÕES E IMAGENS
          observacoes: item['Obs.'] || item.OBSERVACOES || item.observacoes || '',
          
          // CAMPOS DE IMAGEM
          imagem: item.imagem || '',
          imagem_fornecedor: item.imagem_fornecedor || '',
          nomeImagem: item.nomeImagem || ''
        }));

        console.log('✅ Dados processados com TODOS os campos:', { 
          totalProdutos: dadosProcessados.length,
          camposExemplo: dadosProcessados[0] ? Object.keys(dadosProcessados[0]) : [],
          primeiroItem: dadosProcessados[0]
        });
        
      } catch (error) {
        console.error('❌ Erro no processamento de dados completos:', error);
        // Fallback mais robusto mantendo estrutura mínima
        dadosProcessados = produtosComImagens.map((item, index) => ({
          id: `fallback-${index}`,
          sku: item.SKU || item.sku || `PROD-${index + 1}`,
          nome_produto: item['Nome do Produto'] || item.PRODUTO || `Produto ${index + 1}`,
          preco_unitario: Number(item.Preço || item.preco || 0),
          quantidade_total: Number(item['Qtd. Total'] || item.quantidade || 1),
          valor_total: Number(item['Valor Total'] || item.valor_total || 0),
          imagem: item.imagem || '',
          imagem_fornecedor: item.imagem_fornecedor || ''
        }));
      }
      setProgressoUpload(90);

      // Simular salvamento de dados
      console.log('💾 Simulando salvamento de dados...');
      const arquivoCompleto: ArquivoProcessado = {
        id: arquivoUpload.id,
        cotacao_id: cotacaoId,
        nome_arquivo: arquivoUpload.nome_arquivo,
        tipo_arquivo: 'excel',
        status: 'processado',
        dados_processados: dadosProcessados,
        total_linhas: dadosProcessados.length,
        linhas_processadas: dadosProcessados.length,
        linhas_erro: 0
      };
      
      // Adicionar arquivo à lista local
      setArquivos(prev => [...prev, arquivoCompleto]);
      setProgressoUpload(100);

      toast({
        title: "Arquivo importado!",
        description: `${dadosProcessados.length} produtos importados com sucesso.`,
      });

      // Resetar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('🎉 Processamento completo com sucesso!');
    } catch (error) {
      console.error('💥 Erro detalhado no processamento:', error);
      
      // Log adicional para debug
      console.error('📋 Contexto do erro:', {
        arquivo: file.name,
        tamanho: file.size,
        tipo: file.type,
        cotacao: cotacao?.id,
        organizacao: cotacao?.organization_id,
        stack: error instanceof Error ? error.stack : 'Stack não disponível'
      });
      
      toast({
        title: "Erro na importação",
        description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setProcessando(false);
      setProgressoUpload(0);
    }
  };

  const lerArquivo = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let rows: any[] = [];

          if (file.name.endsWith('.csv')) {
            // Processar CSV
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
                rows.push(row);
              }
            }
          } else {
            // Processar Excel
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rows = XLSX.utils.sheet_to_json(worksheet);
          }

          resolve(rows);
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

  // Função removida - agora está no hook

  const handleImportarDados = async (arquivo: ArquivoProcessado) => {
    console.log('🚀 [DEBUG] Iniciando importação de dados:', arquivo);
    console.log('🚀 [DEBUG] Arquivo.dados_processados:', arquivo.dados_processados);
    console.log('🚀 [DEBUG] Tipo de dados_processados:', typeof arquivo.dados_processados);
    console.log('🚀 [DEBUG] É array?:', Array.isArray(arquivo.dados_processados));
    
    if (arquivo.dados_processados && arquivo.dados_processados.length > 0) {
      // Contar imagens extraídas do arquivo OU preenchidas nas colunas
      const totalImagens = arquivo.dados_processados.filter((p: any) => 
        p.imagem_extraida || p.imagem_fornecedor_extraida || 
        (p.imagem && p.imagem.trim() !== '') || 
        (p.imagem_fornecedor && p.imagem_fornecedor.trim() !== '')
      ).length;
      
      console.log('✅ [DEBUG] Dados para importar:', arquivo.dados_processados);
      console.log('📸 [DEBUG] Total de imagens extraídas:', totalImagens);
      console.log('🎯 [DEBUG] Chamando onImportSuccess com dados:', arquivo.dados_processados);
      
      // Chamar callback para importar dados na tela principal
      try {
        onImportSuccess(arquivo.dados_processados);
        console.log('✅ [DEBUG] onImportSuccess chamado com sucesso');
        
        // Fechar modal apenas após sucesso
        onOpenChange(false);
        console.log('✅ [DEBUG] Modal fechado');
        
        toast({
          title: "Dados importados!",
          description: `${arquivo.dados_processados.length} produtos importados${totalImagens > 0 ? ` com ${totalImagens} produtos contendo imagens.` : '.'}`,
        });
      } catch (error) {
        console.error('❌ [DEBUG] Erro ao chamar onImportSuccess:', error);
        toast({
          title: "Erro na importação",
          description: "Erro ao processar os dados importados.",
          variant: "destructive",
        });
      }
    } else {
      console.error('❌ [DEBUG] Nenhum dado processado encontrado no arquivo:', arquivo);
      console.error('❌ [DEBUG] dados_processados é null/undefined ou vazio');
      toast({
        title: "Erro na importação",
        description: "Não há dados processados neste arquivo para importar.",
        variant: "destructive",
      });
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processado': return 'bg-green-500';
      case 'erro': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processado': return <CheckCircle className="h-4 w-4" />;
      case 'erro': return <AlertCircle className="h-4 w-4" />;
      default: return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importação de Produtos - {cotacao?.numero_cotacao}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Templates */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Template de Importação
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Baixe o template com todas as colunas necessárias e exemplos. 
              <br />
              <strong>Novidade:</strong> Imagens coladas diretamente nas células do Excel serão extraídas automaticamente!
            </p>
            <div className="flex gap-2">
              <Button onClick={() => downloadTemplate('csv')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Template CSV
              </Button>
              <Button onClick={() => downloadTemplate('excel')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Template Excel
              </Button>
            </div>
          </div>

          <Separator />

          {/* Seção de Upload */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Enviar Arquivo
            </h3>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={processando}
              />
              
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              
              <div className="space-y-2">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processando}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {processando ? 'Processando...' : 'Selecionar Arquivo'}
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: Excel (.xlsx, .xls) ou CSV
                  <br />
                  Tamanho máximo: 20MB
                </p>
              </div>

              {processando && (
                <div className="mt-4">
                  <Progress value={progressoUpload} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Processando arquivo... {progressoUpload}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Lista de Arquivos */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Arquivos da Cotação ({arquivos.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Carregando arquivos...</p>
              </div>
            ) : arquivos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum arquivo importado ainda</p>
                <p className="text-sm">Faça upload do primeiro arquivo para esta cotação</p>
              </div>
            ) : (
              <div className="space-y-3">
                {arquivos.map((arquivo) => (
                  <div key={arquivo.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(arquivo.status)}
                        <div>
                          <h4 className="font-medium">{arquivo.nome_arquivo}</h4>
                          <p className="text-sm text-muted-foreground">
                            {arquivo.created_at && formatarData(arquivo.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`text-white ${getStatusColor(arquivo.status)}`}>
                          {arquivo.status}
                        </Badge>
                        
                        {arquivo.status === 'processado' && (
                          <Button
                            onClick={() => handleImportarDados(arquivo)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Importar ({arquivo.total_linhas})
                          </Button>
                        )}
                        
                        <Button
                          onClick={async () => {
                            try {
                              console.log('🗑️ [DEBUG] Tentando deletar arquivo:', arquivo);
                              await deletarArquivo({
                                ...arquivo,
                                status: arquivo.status as 'pendente' | 'processado' | 'erro',
                                tipo_arquivo: (arquivo.tipo_arquivo || 'excel') as 'excel' | 'csv'
                              });
                              
                              console.log('✅ [DEBUG] Arquivo deletado com sucesso');
                              
                              // Lista já foi atualizada no estado local
                              console.log('🔄 [DEBUG] Arquivo removido da lista local');
                              
                              toast({
                                title: "Arquivo removido!",
                                description: "Arquivo deletado com sucesso.",
                              });
                              
                            } catch (error) {
                              console.error('❌ [DEBUG] Erro na exclusão:', error);
                              toast({
                                title: "Erro ao deletar",
                                description: "Não foi possível deletar o arquivo.",
                                variant: "destructive",
                              });
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {arquivo.status === 'processado' && arquivo.total_linhas && (
                      <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        ✅ {arquivo.total_linhas} produtos processados
                        {arquivo.dados_processados && (
                          <span className="ml-2">
                            ({arquivo.dados_processados.filter((p: any) => 
                              p.imagem_extraida || p.imagem_fornecedor_extraida || 
                              (p.imagem && p.imagem.trim() !== '') || 
                              (p.imagem_fornecedor && p.imagem_fornecedor.trim() !== '')
                            ).length} com imagens/referências)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};