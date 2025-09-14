import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Package, Clock, AlertTriangle } from 'lucide-react';

interface DevolucaoData {
  id: number;
  data_criacao?: string | null;
  status_devolucao?: string | null;
  valor_total?: number | null;
  produto?: string;
}

interface DashboardMetricasProps {
  devolucoes: DevolucaoData[];
}

export function DashboardMetricas({ devolucoes }: DashboardMetricasProps) {
  const totalDevolucoes = devolucoes.length;
  const valorTotalDevolucoes = devolucoes.reduce((acc, dev) => acc + (dev.valor_total || 0), 0);
  const devolucoesPendentes = devolucoes.filter(d => d.status_devolucao === 'opened').length;
  const devolucoesConcluidas = devolucoes.filter(d => d.status_devolucao === 'closed').length;
  const devolucoesCanceladas = devolucoes.filter(d => d.status_devolucao === 'cancelled').length;
  const devolucoesPorcentagemConcluidas = totalDevolucoes > 0 ? ((devolucoesConcluidas / totalDevolucoes) * 100).toFixed(1) : '0';

  // Calcular devoluções dos últimos 7 dias
  const ultimaSemana = new Date();
  ultimaSemana.setDate(ultimaSemana.getDate() - 7);
  const devolucoesSemana = devolucoes.filter(d => d.data_criacao && new Date(d.data_criacao) >= ultimaSemana).length;

  // Calcular valor médio por devolução
  const valorMedio = totalDevolucoes > 0 ? valorTotalDevolucoes / totalDevolucoes : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const metricas = [
    {
      titulo: 'Total de Devoluções',
      valor: totalDevolucoes.toString(),
      icone: Package,
      cor: 'text-blue-600',
      fundo: 'bg-blue-100',
      descricao: 'Todas as devoluções registradas'
    },
    {
      titulo: 'Valor Total',
      valor: formatCurrency(valorTotalDevolucoes),
      icone: DollarSign,
      cor: 'text-green-600',
      fundo: 'bg-green-100',
      descricao: 'Valor total das devoluções'
    },
    {
      titulo: 'Pendentes',
      valor: devolucoesPendentes.toString(),
      icone: Clock,
      cor: 'text-yellow-600',
      fundo: 'bg-yellow-100',
      descricao: 'Devoluções em aberto'
    },
    {
      titulo: 'Taxa de Conclusão',
      valor: `${devolucoesPorcentagemConcluidas}%`,
      icone: TrendingUp,
      cor: 'text-purple-600',
      fundo: 'bg-purple-100',
      descricao: 'Devoluções finalizadas'
    },
    {
      titulo: 'Última Semana',
      valor: devolucoesSemana.toString(),
      icone: TrendingDown,
      cor: 'text-orange-600',
      fundo: 'bg-orange-100',
      descricao: 'Devoluções nos últimos 7 dias'
    },
    {
      titulo: 'Valor Médio',
      valor: formatCurrency(valorMedio),
      icone: AlertTriangle,
      cor: 'text-red-600',
      fundo: 'bg-red-100',
      descricao: 'Valor médio por devolução'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricas.map((metrica, index) => {
        const IconeComponente = metrica.icone;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metrica.titulo}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {metrica.valor}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrica.descricao}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metrica.fundo}`}>
                  <IconeComponente className={`w-6 h-6 ${metrica.cor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}