/**
 * 📊 RESUMO DE PEDIDOS - BADGES CLICÁVEIS COM MÉTRICAS
 * Aplicação do padrão de /reclamacoes (Opção A - FASE 2)
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  CheckCircle2,
  AlertTriangle,
  Package,
  XCircle,
  Clock,
  ShoppingCart
} from 'lucide-react';

export type FiltroResumo = 'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado' | 'shipped' | 'delivered' | 'sem_estoque' | 'sku_nao_cadastrado' | 'sem_composicao';

interface PedidosResumoProps {
  pedidos: any[];
  className?: string;
  onFiltroClick?: (filtro: FiltroResumo) => void;
  filtroAtivo?: FiltroResumo;
  mappingData?: Map<string, any>;
  isPedidoProcessado?: (order: any) => boolean;
}

export function PedidosResumo({ 
  pedidos, 
  className, 
  onFiltroClick,
  filtroAtivo = 'all',
  mappingData,
  isPedidoProcessado
}: PedidosResumoProps) {
  // Total
  const total = pedidos.length;
  
  // Cálculo de métricas baseado em status de mapeamento e estoque
  const prontosBaixa = pedidos.filter(p => {
    if (!mappingData) return false;
    const mapping = mappingData.get(p.id_unico || p.id || p.numero);
    if (!mapping) return false;
    return mapping.status === 'completo' && !isPedidoProcessado?.(p);
  }).length;

  const mapeamentoPendente = pedidos.filter(p => {
    if (!mappingData) return false;
    const mapping = mappingData.get(p.id_unico || p.id || p.numero);
    if (!mapping) return true; // Sem mapeamento = pendente
    return mapping.status === 'incompleto' || mapping.status === 'parcial';
  }).length;

  const baixados = pedidos.filter(p => isPedidoProcessado?.(p)).length;

  const semEstoque = pedidos.filter(p => {
    if (!mappingData) return false;
    const mapping = mappingData.get(p.id_unico || p.id || p.numero);
    return mapping?.status === 'sem_estoque';
  }).length;

  const skuNaoCadastrado = pedidos.filter(p => {
    if (!mappingData) return false;
    const mapping = mappingData.get(p.id_unico || p.id || p.numero);
    return mapping?.status === 'sku_nao_cadastrado';
  }).length;

  const badges = [
    {
      id: 'all' as FiltroResumo,
      label: 'Total',
      valor: total,
      icon: ShoppingCart,
      variant: 'default' as const,
      alwaysShow: true
    },
    {
      id: 'pronto_baixar' as FiltroResumo,
      label: 'Prontos p/ Baixar',
      valor: prontosBaixa,
      icon: CheckCircle2,
      variant: 'default' as const,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'mapear_incompleto' as FiltroResumo,
      label: 'Mapeamento Pendente',
      valor: mapeamentoPendente,
      icon: AlertTriangle,
      variant: 'default' as const,
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      id: 'baixado' as FiltroResumo,
      label: 'Baixados',
      valor: baixados,
      icon: Package,
      variant: 'default' as const,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'sem_estoque' as FiltroResumo,
      label: 'Sem Estoque',
      valor: semEstoque,
      icon: XCircle,
      variant: 'default' as const,
      color: 'text-red-600 dark:text-red-400'
    },
    {
      id: 'sku_nao_cadastrado' as FiltroResumo,
      label: 'SKU Não Cadastrado',
      valor: skuNaoCadastrado,
      icon: Clock,
      variant: 'default' as const,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  // Mostrar todos os badges sempre
  const badgesVisiveis = badges;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {badgesVisiveis.map((badge) => {
        const Icon = badge.icon;
        const isActive = filtroAtivo === badge.id;
        
        return (
          <Badge
            key={badge.id}
            variant={badge.variant}
            className={cn(
              "h-8 px-3 py-1.5 cursor-pointer transition-all flex items-center gap-1.5",
              "hover:scale-105",
              isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              badge.color
            )}
            onClick={() => onFiltroClick?.(badge.id)}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{badge.label}</span>
            <span className="ml-1 font-bold">{badge.valor}</span>
          </Badge>
        );
      })}
    </div>
  );
}
