import { useState, useMemo } from 'react';
import { Pedido } from '@/types/pedido';
import { useProcessarBaixaEstoque } from '@/hooks/useEstoqueBaixa';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';

interface BaixaEstoqueModalProps {
  pedidos: Pedido[];
  trigger?: React.ReactNode;
  // 📸 Contexto da UI para fotografia completa
  contextoDaUI?: {
    mappingData?: Map<string, any>;
    accounts?: any[];
    selectedAccounts?: string[];
    integrationAccountId?: string;
  };
}

export function BaixaEstoqueModal({ pedidos, trigger, contextoDaUI }: BaixaEstoqueModalProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  
  const processarBaixa = useProcessarBaixaEstoque();

  // 🚀 NOVO: Análise de viabilidade dos pedidos
  const pedidosAnalise = useMemo(() => {
    return pedidos.map(pedido => {
      const mapping = contextoDaUI?.mappingData?.get(pedido.id);
      const temMapeamento = !!mapping?.skuKit;
      const temEstoque = mapping?.statusBaixa === 'pronto_baixar';
      
      return {
        ...pedido,
        temMapeamento,
        temEstoque,
        statusBaixa: mapping?.statusBaixa || 'sem_mapear',
        skuKit: mapping?.skuKit,
        quantidade: pedido.total_itens || 0,
        problema: !temMapeamento ? 'Sem mapeamento' : 
                 !temEstoque ? 'Sem estoque' : null
      };
    });
  }, [pedidos, contextoDaUI]);

  const resumo = useMemo(() => {
    const total = pedidosAnalise.length;
    const prontos = pedidosAnalise.filter(p => p.temEstoque && p.temMapeamento).length;
    const problemas = total - prontos;
    const valorTotal = pedidosAnalise.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    
    return { total, prontos, problemas, valorTotal };
  }, [pedidosAnalise]);

  const handleProcessar = async () => {
    console.log('🚀 Iniciando processamento OTIMIZADO de baixa de estoque');
    
    // Filtrar apenas pedidos prontos para baixa
    const pedidosProntos = pedidosAnalise.filter(p => p.temEstoque && p.temMapeamento);
    
    if (pedidosProntos.length === 0) {
      alert('❌ Nenhum pedido está pronto para baixa. Verifique os mapeamentos e estoque.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 📸 Passar contexto da UI para fotografia completa
      const ok = await processarBaixa.mutateAsync({
        pedidos: pedidosProntos,
        contextoDaUI
      });
      
      console.log('✅ Baixa processada com sucesso:', ok);
      setProcessed(Boolean(ok));
    } catch (error) {
      console.error('❌ Erro ao processar baixa:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setProcessed(false);
    setIsProcessing(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Package className="h-4 w-4 mr-1" />
      Baixar Estoque ({pedidos.length})
    </Button>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pronto_baixar': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sem_estoque': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'sem_mapear': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pronto_baixar': return <Badge className="bg-green-100 text-green-800">Pronto</Badge>;
      case 'sem_estoque': return <Badge variant="destructive">Sem Estoque</Badge>;
      case 'sem_mapear': return <Badge variant="secondary">Sem Mapeamento</Badge>;
      default: return <Badge variant="outline">Indefinido</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) handleReset();
    }}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Baixa Automática de Estoque
            <Badge variant="outline" className="ml-auto">
              {resumo.prontos}/{resumo.total} prontos
            </Badge>
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <div>Valor total selecionado: <span className="font-semibold">R$ {resumo.valorTotal.toFixed(2)}</span></div>
              {resumo.problemas > 0 && (
                <div className="text-orange-600">
                  ⚠️ {resumo.problemas} pedido(s) com problemas (serão ignorados)
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Status do Processamento */}
          {isProcessing && (
            <Alert className="border-blue-200 bg-blue-50">
              <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
              <AlertDescription className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">
                  Processando {resumo.prontos} pedido(s)...
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {processed && !isProcessing && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800">✅ Baixa processada com sucesso!</div>
                <div className="text-sm text-green-700 mt-1">
                  {resumo.prontos} pedido(s) processados. Dados salvos no histórico.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Lista de Pedidos Otimizada */}
          <div className="flex-1 overflow-hidden">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              Pedidos a Processar
              {resumo.problemas > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  {resumo.problemas} com problemas
                </Badge>
              )}
            </h4>
            <div className="rounded-lg border flex-1 overflow-auto max-h-[300px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>SKU Kit</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Problema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosAnalise.map((pedido) => (
                    <TableRow 
                      key={pedido.id}
                      className={pedido.temEstoque && pedido.temMapeamento ? 'bg-green-50' : 'bg-orange-50'}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(pedido.statusBaixa)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {pedido.numero || pedido.id || '-'}
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">
                        {pedido.nome_cliente || 'Cliente não informado'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {pedido.skuKit || '-'}
                      </TableCell>
                      <TableCell>{pedido.quantidade}</TableCell>
                      <TableCell>R$ {(pedido.valor_total || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {pedido.problema ? (
                          <Badge variant="outline" className="text-orange-600 text-xs">
                            {pedido.problema}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 text-xs">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {resumo.prontos > 0 ? (
                <span className="text-green-600 font-medium">
                  ✅ {resumo.prontos} pedido(s) serão processados
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ❌ Nenhum pedido pronto para baixa
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              {!processed && (
                <Button
                  onClick={handleProcessar}
                  disabled={isProcessing || resumo.prontos === 0}
                  className={resumo.prontos > 0 ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processando...
                    </div>
                  ) : (
                    `Processar ${resumo.prontos} Pedido(s)`
                  )}
                </Button>
              )}
              {processed && (
                <Button
                  onClick={() => {
                    window.location.href = '/historico';
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ver Histórico
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}