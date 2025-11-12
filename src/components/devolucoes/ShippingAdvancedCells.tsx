/**
 * 🚚 CÉLULAS DE SHIPPING AVANÇADO - FASE 2
 * Componentes para exibir dados logísticos avançados de rastreamento
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Clock, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShippingAdvancedCellsProps {
  devolucao: any;
}

/**
 * 📍 Localização Atual do Produto
 */
export const LocalizacaoAtualCell = ({ devolucao }: ShippingAdvancedCellsProps) => {
  const localizacao = devolucao.localizacao_atual_produto || devolucao.localizacao_atual;
  
  if (!localizacao) {
    return <TableCell className="text-muted-foreground">-</TableCell>;
  }

  return (
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm truncate max-w-[200px]">{localizacao}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Localização Atual</p>
            <p className="text-sm">{localizacao}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};

/**
 * 🚚 Status Transporte Atual
 */
export const StatusTransporteCell = ({ devolucao }: ShippingAdvancedCellsProps) => {
  const status = devolucao.status_transporte_atual;
  
  if (!status) {
    return <TableCell className="text-muted-foreground">-</TableCell>;
  }

  // Mapear status para cores e ícones
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('delivered') || statusLower.includes('entregue')) {
      return { variant: 'default' as const, label: 'Entregue', color: 'bg-green-500' };
    }
    if (statusLower.includes('transit') || statusLower.includes('trânsito')) {
      return { variant: 'secondary' as const, label: 'Em Trânsito', color: 'bg-blue-500' };
    }
    if (statusLower.includes('pending') || statusLower.includes('pendente')) {
      return { variant: 'outline' as const, label: 'Pendente', color: 'bg-yellow-500' };
    }
    if (statusLower.includes('returned') || statusLower.includes('devolvido')) {
      return { variant: 'default' as const, label: 'Devolvido', color: 'bg-purple-500' };
    }
    
    return { variant: 'outline' as const, label: status, color: 'bg-gray-500' };
  };

  const config = getStatusConfig(status);

  return (
    <TableCell>
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    </TableCell>
  );
};

/**
 * ⏱️ Tempo em Trânsito
 */
export const TempoTransitoCell = ({ devolucao }: ShippingAdvancedCellsProps) => {
  const dias = devolucao.tempo_transito_dias;
  
  if (dias === null || dias === undefined) {
    return <TableCell className="text-muted-foreground">-</TableCell>;
  }

  // Alertas visuais por tempo
  const getVariant = (dias: number) => {
    if (dias <= 2) return 'default';
    if (dias <= 5) return 'secondary';
    if (dias <= 10) return 'outline';
    return 'destructive';
  };

  return (
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge variant={getVariant(dias)}>
                {dias} {dias === 1 ? 'dia' : 'dias'}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Tempo em Trânsito</p>
            <p className="text-sm">
              {dias === 0 && 'Menos de 1 dia'}
              {dias > 0 && dias <= 2 && 'Trânsito rápido'}
              {dias > 2 && dias <= 5 && 'Trânsito normal'}
              {dias > 5 && dias <= 10 && 'Trânsito lento'}
              {dias > 10 && '⚠️ Atraso significativo'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};

/**
 * 📅 Previsão de Chegada ao Vendedor
 */
export const PrevisaoChegadaCell = ({ devolucao }: ShippingAdvancedCellsProps) => {
  const previsao = devolucao.previsao_chegada_vendedor;
  
  if (!previsao) {
    return <TableCell className="text-muted-foreground">-</TableCell>;
  }

  const dataPrevisao = new Date(previsao);
  const hoje = new Date();
  const diffDias = Math.ceil((dataPrevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  
  // Verificar se já passou da previsão
  const atrasado = diffDias < 0;
  const urgente = diffDias >= 0 && diffDias <= 2;

  return (
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm">
                  {dataPrevisao.toLocaleDateString('pt-BR')}
                </span>
                {atrasado && (
                  <Badge variant="destructive" className="text-xs">
                    Atrasado {Math.abs(diffDias)} dias
                  </Badge>
                )}
                {urgente && !atrasado && (
                  <Badge variant="outline" className="text-xs">
                    Chega em {diffDias} dias
                  </Badge>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Previsão de Chegada</p>
            <p className="text-sm">{dataPrevisao.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            {atrasado && (
              <p className="text-sm text-destructive mt-1">
                ⚠️ Produto deveria ter chegado há {Math.abs(diffDias)} dias
              </p>
            )}
            {urgente && !atrasado && (
              <p className="text-sm text-yellow-600 mt-1">
                ⏰ Chegada prevista nos próximos dias
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
};
