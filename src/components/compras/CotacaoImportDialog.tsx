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

  // Carregar arquivos quando o dialog abrir
  React.useEffect(() => {
    if (open && cotacao?.id) {
      carregarArquivos();
    }
  }, [open, cotacao?.id]);

  const carregarArquivos = async () => {
    try {
      const dadosArquivos = await getArquivosCotacao(cotacao.id);
      setArquivos(dadosArquivos as ArquivoProcessado[]);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

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
      console.log('📋 Dados da cotação:', { 
        cotacaoId: cotacao?.id, 
        organizationId: cotacao?.organization_id 
      });
      
      setProcessando(true);
      setProgressoUpload(10);

      // Validar se temos as informações necessárias
      if (!cotacao?.id) {
        console.error('❌ ID da cotação não encontrado');
        throw new Error('ID da cotação não encontrado');
      }
      if (!cotacao?.organization_id) {
        console.error('❌ ID da organização não encontrado');
        throw new Error('ID da organização não encontrado');
      }

      // Upload do arquivo primeiro
      const organizationId = cotacao.organization_id;
      console.log('⬆️ Fazendo upload do arquivo...');
      const arquivoUpload = await uploadArquivo(file, cotacao.id, organizationId);
      console.log('✅ Upload concluído:', arquivoUpload);
      setProgressoUpload(30);

      // Ler e processar o arquivo
      console.log('📖 Lendo arquivo...');
      const dados = await lerArquivo(file);
      console.log('📊 Dados extraídos:', { totalDados: dados.length });
      setProgressoUpload(70);

      // Processar dados
      console.log('⚙️ Processando dados...');
      const dadosProcessados = processarDados(dados);
      console.log('✅ Dados processados:', { totalProdutos: dadosProcessados.length });
      setProgressoUpload(90);

      // Salvar dados processados
      console.log('💾 Salvando dados processados...');
      await processarArquivo(arquivoUpload.id, dadosProcessados);
      setProgressoUpload(100);

      // Recarregar lista de arquivos
      console.log('🔄 Recarregando lista de arquivos...');
      await carregarArquivos();

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
    
    if (arquivo.dados_processados && arquivo.dados_processados.length > 0) {
      const totalImagens = arquivo.dados_processados.filter((p: any) => p.imagem_extraida || p.imagem_fornecedor_extraida).length;
      
      console.log('✅ [DEBUG] Dados para importar:', arquivo.dados_processados);
      console.log('📸 [DEBUG] Total de imagens extraídas:', totalImagens);
      
      // Chamar callback para importar dados na tela principal
      onImportSuccess(arquivo.dados_processados);
      onOpenChange(false);
      
      toast({
        title: "Dados importados!",
        description: `${arquivo.dados_processados.length} produtos importados${totalImagens > 0 ? ` com ${totalImagens} imagens extraídas do Excel.` : '.'}`,
      });
    } else {
      console.error('❌ [DEBUG] Nenhum dado processado encontrado no arquivo:', arquivo);
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
                              
                              // Recarregar a lista após exclusão
                              if (cotacao?.id) {
                                console.log('🔄 [DEBUG] Recarregando lista de arquivos...');
                                await getArquivosCotacao(cotacao.id);
                              }
                            } catch (error) {
                              console.error('❌ [DEBUG] Erro na exclusão:', error);
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
                            ({arquivo.dados_processados.filter((p: any) => p.imagem_extraida || p.imagem_fornecedor_extraida).length} com imagens extraídas)
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