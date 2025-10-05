import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Truck, CheckCircle } from 'lucide-react';

interface StatusCardProps {
  title: string;
  count: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

function StatusCard({ title, count, percentage, icon, color }: StatusCardProps) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {percentage.toFixed(1)}% do total
        </p>
      </CardContent>
    </Card>
  );
}

interface DashboardStatusCardsProps {
  pendentes: number;
  enviados: number;
  entregues: number;
  total: number;
}

export function DashboardStatusCards({
  pendentes,
  enviados,
  entregues,
  total,
}: DashboardStatusCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatusCard
        title="Pendentes"
        count={pendentes}
        percentage={(pendentes / total) * 100}
        icon={<Clock className="h-5 w-5 text-orange-500" />}
        color="border-l-orange-500"
      />
      <StatusCard
        title="Enviados"
        count={enviados}
        percentage={(enviados / total) * 100}
        icon={<Truck className="h-5 w-5 text-blue-500" />}
        color="border-l-blue-500"
      />
      <StatusCard
        title="Entregues"
        count={entregues}
        percentage={(entregues / total) * 100}
        icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        color="border-l-green-500"
      />
    </div>
  );
}
