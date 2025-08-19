import { useState } from 'react';
import { Pedido } from '@/types/pedido';
import { useProcessarBaixaEstoque } from '@/hooks/useEstoqueBaixa';
import { BaixaEstoqueResult, BaixaItemDetail } from '@/services/EstoqueBaixaService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';

interface BaixaEstoqueModalProps {
  pedidos: Pedido[];
  trigger?: React.ReactNode;
}

function getStatusBadge(status: BaixaItemDetail['status']) {
  switch (status) {
    case 'success':
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
    case 'error':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
    case 'skipped':
      return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Pulado</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
}

export function BaixaEstoqueModal({ pedidos, trigger }: BaixaEstoqueModalProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<BaixaEstoqueResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processarBaixa = useProcessarBaixaEstoque();

  const handleProcessar = async () => {
    setIsProcessing(true);
    setResult(null);
    
    try {
      const resultado = await processarBaixa.mutateAsync(pedidos);
      setResult(resultado);
    } catch (error) {
      console.error('Erro ao processar baixa:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setIsProcessing(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Package className="h-4 w-4 mr-1" />
      Baixar Estoque ({pedidos.length})
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        handleReset();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Baixa Automática de Estoque
          </DialogTitle>
          <DialogDescription>
            Processa a baixa de estoque com base no mapeamento De-Para para {pedidos.length} pedido(s) selecionado(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status do Processamento */}
          {isProcessing && (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Processando baixa de estoque...
              </AlertDescription>
            </Alert>
          )}

          {/* Resultado do Processamento */}
          {result && (
            <div className="space-y-4">
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                <AlertDescription>
                  <div className="font-medium mb-1">
                    {result.success ? "✅ Processamento concluído" : "⚠️ Processamento concluído com erros"}
                  </div>
                  <div className="text-sm">{result.message}</div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span>✅ Processados: {result.processedItems}</span>
                    <span>⏭️ Pulados: {result.skippedItems}</span>
                    <span>❌ Erros: {result.errors.length}</span>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Erros Gerais */}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-medium">Erros encontrados:</div>
                    <ul className="list-disc pl-4 mt-1">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Detalhes por Item */}
              {result.details.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Detalhes do Processamento</h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU Pedido</TableHead>
                          <TableHead>SKU Estoque</TableHead>
                          <TableHead>Qtd Kit</TableHead>
                          <TableHead>Baixa</TableHead>
                          <TableHead>Estoque Antes</TableHead>
                          <TableHead>Estoque Depois</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Observação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{detail.skuPedido}</TableCell>
                            <TableCell className="font-mono text-xs">{detail.skuEstoque || '—'}</TableCell>
                            <TableCell>{detail.quantidadeKit}</TableCell>
                            <TableCell>{detail.quantidadeBaixada}</TableCell>
                            <TableCell>{detail.estoqueAntes}</TableCell>
                            <TableCell className={detail.estoqueDepois < 5 ? "text-red-600 font-medium" : ""}>
                              {detail.estoqueDepois}
                            </TableCell>
                            <TableCell>{getStatusBadge(detail.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {detail.motivo || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de Pedidos */}
          {!result && !isProcessing && (
            <div>
              <h4 className="font-medium mb-2">Pedidos a Processar</h4>
              <div className="rounded-lg border max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidos.map((pedido) => (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-mono text-xs">{pedido.numero}</TableCell>
                        <TableCell>{pedido.nome_cliente}</TableCell>
                        <TableCell>R$ {pedido.valor_total?.toFixed(2) || '0,00'}</TableCell>
                        <TableCell>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between">
            <div>
              {result && result.details.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Implementar download de relatório se necessário
                    const csvContent = result.details.map(d => 
                      `${d.skuPedido},${d.skuEstoque || ''},${d.quantidadeKit},${d.quantidadeBaixada},${d.estoqueAntes},${d.estoqueDepois},${d.status},${d.motivo || ''}`
                    ).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'relatorio_baixa_estoque.csv';
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Baixar Relatório
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {!result && !isProcessing && (
                <Button onClick={handleProcessar} disabled={processarBaixa.isPending}>
                  <Package className="h-4 w-4 mr-1" />
                  Processar Baixa
                </Button>
              )}
              
              {result && (
                <Button variant="outline" onClick={handleReset}>
                  Processar Novamente
                </Button>
              )}
              
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}