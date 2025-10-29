/**
 * 📊 ESTATÍSTICAS DE RECLAMAÇÕES
 * Cards com métricas principais
 * ⚡ OTIMIZADO: Memoização agressiva para evitar recálculos
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Scale } from 'lucide-react';

interface ReclamacoesStatsProps {
  reclamacoes: any[];
}

export function ReclamacoesStats({ reclamacoes }: ReclamacoesStatsProps) {
  // ⚡ MEMOIZAR cálculos para evitar reprocessamento (950 × 4 = 3.800 ops)
  const stats = useMemo(() => {
    const abertas = reclamacoes.filter(r => r.status === 'opened').length;
    const fechadas = reclamacoes.filter(r => r.status === 'closed').length;
    const emAnalise = reclamacoes.filter(r => r.status === 'under_review').length;
    const mediacoes = reclamacoes.filter(r => r.type === 'mediation').length;

    return [
      {
        title: 'Abertas',
        value: abertas,
        icon: AlertCircle,
        color: 'text-orange-500'
      },
      {
        title: 'Fechadas',
        value: fechadas,
        icon: CheckCircle,
        color: 'text-green-500'
      },
      {
        title: 'Em Análise',
        value: emAnalise,
        icon: Clock,
        color: 'text-blue-500'
      },
      {
        title: 'Mediações',
        value: mediacoes,
        icon: Scale,
        color: 'text-purple-500'
      }
    ];
  }, [reclamacoes]); // Só recalcula quando reclamacoes muda

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
