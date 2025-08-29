import { useState } from 'react';
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
import { Package, CheckCircle } from 'lucide-react';

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

  const handleProcessar = async () => {
    setIsProcessing(true);
    
    try {
      // 📸 Passar contexto da UI para fotografia completa
      const ok = await processarBaixa.mutateAsync({
        pedidos,
        contextoDaUI
      });
      setProcessed(Boolean(ok));
    } catch (error) {
      console.error('Erro ao processar baixa:', error);
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

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) handleReset();
    }}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Baixa Automática de Estoque
          </DialogTitle>
          <DialogDescription>
            Processar baixa para {pedidos.length} pedido(s) selecionado(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status do Processamento */}
          {isProcessing && (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Processando baixa...
              </AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {processed && !isProcessing && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800">✅ Baixa processada!</div>
                <div className="text-sm text-green-700 mt-1">
                  Os dados foram salvos no histórico. Vá para /historico para visualizar.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Lista de Pedidos */}
          <div>
            <h4 className="font-medium mb-2">Pedidos a Processar</h4>
            <div className="rounded-lg border max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-mono text-xs">{pedido.numero}</TableCell>
                      <TableCell className="text-sm">{pedido.nome_cliente}</TableCell>
                      <TableCell>R$ {pedido.valor_total?.toFixed(2) || '0,00'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
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
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Processar Baixa'}
              </Button>
            )}
            {processed && (
              <Button
                onClick={() => {
                  window.location.href = '/historico';
                }}
              >
                Ver Histórico
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}