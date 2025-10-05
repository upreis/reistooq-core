import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Truck, CheckCircle } from 'lucide-react';

interface StatusData {
  pendentes: number;
  enviados: number;
  entregues: number;
  total: number;
}

interface DashboardStatusCardsProps {
  statusData: StatusData;
  onStatusClick?: (status: string) => void;
}

export function DashboardStatusCards({ statusData, onStatusClick }: DashboardStatusCardsProps) {
  const cards = [
    {
      title: 'Pendentes',
      value: statusData.pendentes,
      percentage: ((statusData.pendentes / statusData.total) * 100).toFixed(1),
      icon: <Clock className="h-5 w-5" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      status: 'pendente',
    },
    {
      title: 'Enviados',
      value: statusData.enviados,
      percentage: ((statusData.enviados / statusData.total) * 100).toFixed(1),
      icon: <Truck className="h-5 w-5" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      status: 'enviado',
    },
    {
      title: 'Entregues',
      value: statusData.entregues,
      percentage: ((statusData.entregues / statusData.total) * 100).toFixed(1),
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      status: 'entregue',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onStatusClick?.(card.status)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {card.percentage}% do total
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${card.color.replace('text-', 'bg-')} transition-all duration-500`}
                style={{ width: `${card.percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
