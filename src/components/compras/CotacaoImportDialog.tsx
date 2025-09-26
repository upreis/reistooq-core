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
    downloadTemplate
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
      setProcessando(true);
      setProgressoUpload(10);

      // Upload do arquivo primeiro
      const organizationId = cotacao.organization_id;
      const arquivoUpload = await uploadArquivo(file, cotacao.id, organizationId);
      setProgressoUpload(30);

      // Ler e processar o arquivo
      const dados = await lerArquivo(file);
      setProgressoUpload(70);

      // Processar dados
      const dadosProcessados = processarDados(dados);
      setProgressoUpload(90);

      // Salvar dados processados
      await processarArquivo(arquivoUpload.id, dadosProcessados);
      setProgressoUpload(100);

      // Recarregar lista de arquivos
      await carregarArquivos();

      toast({
        title: "Arquivo importado!",
        description: `${dadosProcessados.length} produtos importados com sucesso.`,
      });

      // Resetar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo.",
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

  const processarDados = (dados: any[]): any[] => {
    return dados.map((linha, index) => {
      try {
        const produto = {
          sku: linha.SKU || linha.sku || `PROD-${index + 1}`,
          imagem: linha.IMAGEM || linha.imagem || '',
          imagem_fornecedor: linha.IMAGEM_FORNECEDOR || linha.imagem_fornecedor || '',
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

  const handleImportarDados = async (arquivo: ArquivoProcessado) => {
    if (arquivo.dados_processados && arquivo.dados_processados.length > 0) {
      onImportSuccess(arquivo.dados_processados);
      onOpenChange(false);
      
      toast({
        title: "Dados importados!",
        description: `${arquivo.dados_processados.length} produtos importados para a cotação.`,
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
              Baixe o template CSV com todas as colunas necessárias e exemplos de preenchimento.
            </p>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar Template CSV
            </Button>
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
                          onClick={() => deletarArquivo({
                            ...arquivo,
                            status: arquivo.status as 'pendente' | 'processado' | 'erro',
                            tipo_arquivo: (arquivo.tipo_arquivo || 'excel') as 'excel' | 'csv'
                          })}
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
                        ✅ {arquivo.total_linhas} produtos processados com sucesso
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