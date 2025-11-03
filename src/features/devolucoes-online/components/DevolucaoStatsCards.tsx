/**
 * 📊 STATS CARDS - DEVOLUÇÕES
 * Cards de estatísticas otimizados
 */

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Package, Clock, CheckCircle, DollarSign } from 'lucide-react';

interface DevolucaoStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    refunded: number;
  };
}

export const DevolucaoStatsCards = memo(({ stats }: DevolucaoStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aprovadas</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reembolsadas</p>
            <p className="text-2xl font-bold">{stats.refunded}</p>
          </div>
        </div>
      </Card>
    </div>
  );
});

DevolucaoStatsCards.displayName = 'DevolucaoStatsCards';
