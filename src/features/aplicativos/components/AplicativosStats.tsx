import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Notebook, Clock, FileText } from 'lucide-react';

export const AplicativosStats: React.FC = () => {
  // Mock data - você pode substituir por dados reais
  const stats = {
    eventosCalendario: 12,
    proximosEventos: 3,
    totalNotas: 25,
    notasRecentes: 5
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos do Calendário</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.eventosCalendario}</div>
          <p className="text-xs text-muted-foreground">
            Total de eventos agendados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.proximosEventos}</div>
          <p className="text-xs text-muted-foreground">
            Nos próximos 7 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
          <Notebook className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalNotas}</div>
          <p className="text-xs text-muted-foreground">
            Notas criadas no sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Notas Recentes</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.notasRecentes}</div>
          <p className="text-xs text-muted-foreground">
            Criadas esta semana
          </p>
        </CardContent>
      </Card>
    </div>
  );
};