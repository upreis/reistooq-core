import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Scale, 
  Sparkles, 
  Package,
  Clock,
  TrendingUp
} from 'lucide-react';

interface FiltroRapido {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  filtros: {
    statusClaim?: string;
    dataInicio?: string;
    dataFim?: string;
    tipoClaim?: string;
  };
  badge?: {
    text: string;
    variant: 'default' | 'destructive' | 'secondary' | 'outline';
  };
}

interface FiltrosRapidosProps {
  onAplicarFiltro: (filtros: any) => void;
  filtroAtivo?: string;
}

export function FiltrosRapidos({ onAplicarFiltro, filtroAtivo }: FiltrosRapidosProps) {
  
  const calcularDataInicio = (dias: number): string => {
    const data = new Date();
    data.setDate(data.getDate() - dias);
    return data.toISOString().split('T')[0];
  };

  const filtrosRapidos: FiltroRapido[] = [
    {
      id: 'urgentes',
      label: 'Urgentes',
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Devoluções com mais de 30 dias abertas',
      filtros: {
        statusClaim: 'opened',
        dataInicio: calcularDataInicio(90),
        dataFim: calcularDataInicio(30)
      },
      badge: {
        text: '30+ dias',
        variant: 'destructive'
      }
    },
    {
      id: 'mediacao',
      label: 'Em Mediação',
      icon: <Scale className="h-4 w-4" />,
      description: 'Claims em disputa/mediação',
      filtros: {
        statusClaim: 'opened',
        dataInicio: calcularDataInicio(60)
      },
      badge: {
        text: 'Alta prioridade',
        variant: 'default'
      }
    },
    {
      id: 'recentes',
      label: 'Recentes',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Últimos 7 dias',
      filtros: {
        statusClaim: 'opened',
        dataInicio: calcularDataInicio(7)
      },
      badge: {
        text: '7 dias',
        variant: 'secondary'
      }
    },
    {
      id: 'ativas',
      label: 'Todas Ativas',
      icon: <Package className="h-4 w-4" />,
      description: 'Todas as devoluções abertas',
      filtros: {
        statusClaim: 'opened',
        dataInicio: calcularDataInicio(60)
      }
    },
    {
      id: 'mes_atual',
      label: 'Mês Atual',
      icon: <Clock className="h-4 w-4" />,
      description: 'Devoluções do mês corrente',
      filtros: {
        dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      }
    },
    {
      id: 'tendencias',
      label: 'Análise',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Últimos 30 dias para análise',
      filtros: {
        dataInicio: calcularDataInicio(30)
      }
    }
  ];

  const handleFiltroClick = (filtro: FiltroRapido) => {
    console.log(`🎯 Filtro rápido aplicado: ${filtro.id}`, filtro.filtros);
    onAplicarFiltro(filtro.filtros);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Filtros Rápidos
            </h3>
            <Badge variant="outline" className="text-xs">
              Atalhos
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {filtrosRapidos.map((filtro) => (
              <Button
                key={filtro.id}
                variant={filtroAtivo === filtro.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroClick(filtro)}
                className="flex flex-col h-auto py-3 px-3 items-start text-left gap-1"
                title={filtro.description}
              >
                <div className="flex items-center gap-2 w-full">
                  {filtro.icon}
                  <span className="text-xs font-medium flex-1">{filtro.label}</span>
                </div>
                {filtro.badge && (
                  <Badge 
                    variant={filtro.badge.variant} 
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {filtro.badge.text}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Clique em um filtro para aplicar rapidamente. Você pode refinar depois nos filtros avançados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
