/**
 * 📦 VENDAS COM ENVIO - Componente de Estatísticas
 */

import { Card } from '@/components/ui/card';
import { Package, Clock, Truck, CheckCircle, DollarSign } from 'lucide-react';
import type { VendasComEnvioStats as StatsType } from '../types';

interface VendasComEnvioStatsProps {
  stats: StatsType;
}

export function VendasComEnvioStats({ stats }: VendasComEnvioStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: Package,
      color: 'text-foreground',
      bgColor: 'bg-muted/50',
    },
    {
      label: 'Pronto p/ Enviar',
      value: stats.readyToShip,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Em Manuseio',
      value: stats.handling,
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Enviados',
      value: stats.shipped,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Valor Total',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      isValue: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item) => (
        <Card
          key={item.label}
          className={`p-3 ${item.bgColor} border-0 cursor-pointer hover:opacity-80 transition-opacity`}
        >
          <div className="flex items-center gap-2">
            <item.icon className={`h-4 w-4 ${item.color}`} />
            <span className="text-xs text-muted-foreground truncate">
              {item.label}
            </span>
          </div>
          <p className={`text-lg font-bold mt-1 ${item.color}`}>
            {item.isValue ? item.value : item.value.toLocaleString('pt-BR')}
          </p>
        </Card>
      ))}
    </div>
  );
}
