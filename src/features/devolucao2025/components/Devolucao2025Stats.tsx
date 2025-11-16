/**
 * 📊 ESTATÍSTICAS - DEVOLUÇÕES DE VENDAS
 */

import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Package, Clock } from 'lucide-react';

interface Devolucao2025StatsProps {
  devolucoes: any[];
}

export const Devolucao2025Stats = ({ devolucoes }: Devolucao2025StatsProps) => {
  const stats = {
    total: devolucoes.length,
    valorTotal: devolucoes.reduce((acc, dev) => acc + (dev.valor_reembolso_total || 0), 0),
    emAndamento: devolucoes.filter(dev => !dev.data_fechamento_devolucao).length,
    mediacao: devolucoes.filter(dev => dev.em_mediacao).length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Devoluções</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <Package className="h-8 w-8 text-primary" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">R$ {stats.valorTotal.toFixed(2)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Em Andamento</p>
            <p className="text-2xl font-bold">{stats.emAndamento}</p>
          </div>
          <Clock className="h-8 w-8 text-orange-500" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Em Mediação</p>
            <p className="text-2xl font-bold">{stats.mediacao}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-purple-500" />
        </div>
      </Card>
    </div>
  );
};
