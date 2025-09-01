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
        quantidade: Number(pedido.total_itens) || 0,
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
      case 'pronto_baixar': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'sem_estoque': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'sem_mapear': return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pronto_baixar': return <Badge variant="default" className="bg-success/10 text-success border-success/20">Pronto</Badge>;
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
                <div className="text-warning">
                  ⚠️ {resumo.problemas} pedido(s) com problemas (serão ignorados)
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Status do Processamento */}
          {isProcessing && (
            <Alert className="border-info/20 bg-info/10">
              <Zap className="h-4 w-4 text-info animate-pulse" />
              <AlertDescription className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-info"></div>
                <span className="text-info font-medium">
                  Processando {resumo.prontos} pedido(s)...
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {processed && !isProcessing && (
            <Alert className="border-success/20 bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                <div className="font-medium text-success">✅ Baixa processada com sucesso!</div>
                <div className="text-sm text-success/80 mt-1">
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
                <Badge variant="outline" className="text-warning border-warning/20">
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
                      className={pedido.temEstoque && pedido.temMapeamento ? 'bg-success/5' : 'bg-warning/5'}
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
                          <Badge variant="outline" className="text-warning border-warning/20 text-xs">
                            {pedido.problema}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-success/10 text-success border-success/20 text-xs">OK</Badge>
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
                <span className="text-success font-medium">
                  ✅ {resumo.prontos} pedido(s) serão processados
                </span>
              ) : (
                <span className="text-destructive font-medium">
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
                  className={resumo.prontos > 0 ? 'bg-success hover:bg-success/90' : ''}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
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
                  className="bg-info hover:bg-info/90"
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