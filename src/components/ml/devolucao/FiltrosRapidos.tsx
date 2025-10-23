import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Sparkles, 
  Package,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';

interface FiltroRapido {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  filtros: {
    statusClaim?: string;
    periodoDias?: number;
    tipoData?: 'date_created' | 'last_updated';
    tipoClaim?: string;
    // ❌ REMOVIDO: dataInicio e dataFim (sistema antigo)
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

export const FiltrosRapidos = React.memo(function FiltrosRapidos({ onAplicarFiltro, filtroAtivo }: FiltrosRapidosProps) {

  const filtrosRapidos: FiltroRapido[] = [
    {
      id: 'sem_filtro',
      label: 'Sem Filtro',
      icon: <X className="h-4 w-4" />,
      description: 'Buscar TODAS as devoluções (sem limite de data)',
      filtros: {
        periodoDias: 0,  // ✅ 0 = buscar tudo
        tipoData: 'date_created'
      },
      badge: {
        text: 'Todas',
        variant: 'outline'
      }
    },
    {
      id: 'recentes',
      label: 'Últimos 7 dias',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Devoluções dos últimos 7 dias',
      filtros: {
        periodoDias: 7,
        tipoData: 'date_created'
      },
      badge: {
        text: '7 dias',
        variant: 'secondary'
      }
    },
    {
      id: 'mes_atual',
      label: 'Últimos 30 dias',
      icon: <Clock className="h-4 w-4" />,
      description: 'Devoluções dos últimos 30 dias',
      filtros: {
        periodoDias: 30,
        tipoData: 'date_created'
      },
      badge: {
        text: '30 dias',
        variant: 'default'
      }
    },
    {
      id: 'trimestre',
      label: 'Últimos 90 dias',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Devoluções dos últimos 90 dias',
      filtros: {
        periodoDias: 90,
        tipoData: 'date_created'
      },
      badge: {
        text: '90 dias',
        variant: 'default'
      }
    },
    {
      id: 'urgentes',
      label: 'Urgentes Abertas',
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Devoluções abertas dos últimos 60 dias',
      filtros: {
        statusClaim: 'opened',
        periodoDias: 60,
        tipoData: 'date_created'
      },
      badge: {
        text: 'Abertas',
        variant: 'destructive'
      }
    },
    {
      id: 'ativas',
      label: 'Todas Abertas',
      icon: <Package className="h-4 w-4" />,
      description: 'Todas as devoluções com status aberto',
      filtros: {
        statusClaim: 'opened',
        periodoDias: 0,  // ✅ Buscar todas as abertas sem limite de data
        tipoData: 'date_created'
      },
      badge: {
        text: 'Status aberto',
        variant: 'default'
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
            💡 <strong>"Sem Filtro"</strong> busca TODAS as devoluções. Use filtros específicos para resultados mais rápidos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
