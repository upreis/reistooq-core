import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Download, X, Check } from 'lucide-react';
import { useCotacoesArquivos } from '@/hooks/useCotacoesArquivos';
import { useToast } from '@/hooks/use-toast';

interface ArquivoProcessado {
  id: string;
  cotacao_id: string;
  nome_arquivo: string;
  tipo_arquivo: 'excel' | 'csv';
  status: 'pendente' | 'processado' | 'erro';
  dados_processados?: any[];
  total_linhas?: number;
  linhas_processadas?: number;
  linhas_erro?: number;
  detalhes_erro?: any[];
}

interface CotacaoImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cotacao: any;
  onImportSuccess: (dados: any[]) => void;
}

export function CotacaoImportDialog({
  isOpen,
  onClose,
  cotacao,
  onImportSuccess
}: CotacaoImportDialogProps) {
  const [processando, setProcessando] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState(0);
  const [erroUpload, setErroUpload] = useState('');
  const [arquivosProcessados, setArquivosProcessados] = useState<ArquivoProcessado[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    loading,
    processarArquivoLocal,
    downloadTemplate
  } = useCotacoesArquivos();

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

    // Validar tamanho do arquivo (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 50MB.",
        variant: "destructive",
      });
      return;
    }

    processFile(file);
  }, [toast]);

  const processFile = useCallback(async (file: File) => {
    try {
      setProcessando(true);
      setProgressoUpload(0);
      setErroUpload('');

      console.log('🚀 [NEW] Processando arquivo:', file.name);

      // Simular progresso inicial
      setProgressoUpload(10);

      // Usar o novo sistema de processamento
      await processarArquivoLocal(file, cotacao, (dadosProcessados) => {
        console.log('✅ [NEW] Processamento concluído:', dadosProcessados.length, 'itens');
        
        // Verificar se há imagens mapeadas
        const comImagens = dadosProcessados.filter(item => item.IMAGEM || item.IMAGEM_FORNECEDOR).length;
        console.log('📸 [NEW] Itens com imagens:', comImagens);

        // Criar estrutura de arquivo processado
        const arquivo: ArquivoProcessado = {
          id: `arquivo-${Date.now()}`,
          cotacao_id: cotacao.id,
          nome_arquivo: file.name,
          tipo_arquivo: file.name.endsWith('.csv') ? 'csv' : 'excel',
          status: 'processado',
          dados_processados: dadosProcessados,
          total_linhas: dadosProcessados.length,
          linhas_processadas: dadosProcessados.length,
          linhas_erro: 0,
          detalhes_erro: []
        };

        setArquivosProcessados(prev => [...prev, arquivo]);
        setProgressoUpload(100);
        
        toast({
          title: "Importação concluída!",
          description: `${dadosProcessados.length} itens importados com sucesso. ${comImagens} com imagens.`,
        });

        onImportSuccess(dadosProcessados);
      });

    } catch (error) {
      console.error('❌ [NEW] Erro no processamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no processamento';
      setErroUpload(errorMessage);
      
      toast({
        title: "Erro na importação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessando(false);
    }
  }, [cotacao, processarArquivoLocal, onImportSuccess, toast]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDownloadTemplate = useCallback(() => {
    downloadTemplate();
  }, [downloadTemplate]);

  const resetUpload = useCallback(() => {
    setProcessando(false);
    setProgressoUpload(0);
    setErroUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    resetUpload();
    onClose();
  }, [resetUpload, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Arquivo - {cotacao?.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Template de Importação</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Baixe o template para ver o formato correto do arquivo
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadTemplate}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${processando 
                ? 'border-gray-300 bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400 cursor-pointer'
              }
            `}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !processando && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={processando}
            />
            
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {processando ? 'Processando arquivo...' : 'Selecione um arquivo'}
            </p>
            <p className="text-sm text-gray-500">
              Arraste e solte um arquivo Excel (.xlsx, .xls) ou CSV aqui, ou clique para selecionar
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Tamanho máximo: 50MB
            </p>
          </div>

          {/* Progress */}
          {processando && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>{progressoUpload}%</span>
              </div>
              <Progress value={progressoUpload} className="w-full" />
            </div>
          )}

          {/* Error */}
          {erroUpload && (
            <Alert variant="destructive">
              <AlertDescription>{erroUpload}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {arquivosProcessados.length > 0 && (
            <div className="space-y-2">
              {arquivosProcessados.map((arquivo) => (
                <div key={arquivo.id} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">{arquivo.nome_arquivo}</p>
                    <p className="text-sm text-green-700">
                      {arquivo.linhas_processadas} itens importados com sucesso
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              {processando ? 'Cancelar' : 'Fechar'}
            </Button>
            {!processando && arquivosProcessados.length === 0 && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}