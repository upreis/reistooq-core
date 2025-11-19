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
  ShoppingCart,
  Truck,
  PackageCheck
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
  
  // Contar por statusBaixa da coluna "Status da Baixa"
  const prontosBaixa = pedidos.filter(p => {
    const mapping = mappingData?.get(p.id_unico || p.id || p.numero);
    return mapping?.statusBaixa === 'pronto_baixar';
  }).length;

  const mapeamentoPendente = pedidos.filter(p => {
    const mapping = mappingData?.get(p.id_unico || p.id || p.numero);
    return mapping?.statusBaixa === 'sem_mapear' || !mapping;
  }).length;

  const baixados = pedidos.filter(p => {
    const mapping = mappingData?.get(p.id_unico || p.id || p.numero);
    return mapping?.statusBaixa === 'pedido_baixado' || isPedidoProcessado?.(p);
  }).length;

  const semEstoque = pedidos.filter(p => {
    const mapping = mappingData?.get(p.id_unico || p.id || p.numero);
    return mapping?.statusBaixa === 'sem_estoque';
  }).length;

  const skuNaoCadastrado = pedidos.filter(p => {
    const mapping = mappingData?.get(p.id_unico || p.id || p.numero);
    return mapping?.statusBaixa === 'sku_nao_cadastrado';
  }).length;

  const semComposicao = pedidos.filter(p => {
    const mapping = mappingData?.get(p.id_unico || p.id || p.numero);
    return mapping?.statusBaixa === 'sem_composicao';
  }).length;

  // Contar por status da coluna "Status"
  const shipped = pedidos.filter(p => {
    const statuses = Array.isArray(p.status) ? p.status : [p.status];
    return statuses.some((s: string) => s?.includes('shipped') || s?.includes('ready_to_ship'));
  }).length;

  const delivered = pedidos.filter(p => {
    const statuses = Array.isArray(p.status) ? p.status : [p.status];
    return statuses.some((s: string) => s?.includes('delivered'));
  }).length;

  const badges = [
    {
      id: 'all' as FiltroResumo,
      label: 'Total',
      valor: total,
      icon: ShoppingCart,
      destaque: true,
      color: 'bg-primary text-primary-foreground hover:bg-primary/90'
    },
    {
      id: 'pronto_baixar' as FiltroResumo,
      label: 'Prontos p/ Baixar',
      valor: prontosBaixa,
      icon: CheckCircle2,
      destaque: false,
      color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20'
    },
    {
      id: 'mapear_incompleto' as FiltroResumo,
      label: 'Sem Mapear',
      valor: mapeamentoPendente,
      icon: AlertTriangle,
      destaque: false,
      color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
    },
    {
      id: 'baixado' as FiltroResumo,
      label: 'Baixados',
      valor: baixados,
      icon: Package,
      destaque: false,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
    },
    {
      id: 'sem_estoque' as FiltroResumo,
      label: 'Sem Estoque',
      valor: semEstoque,
      icon: XCircle,
      destaque: false,
      color: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
    },
    {
      id: 'sku_nao_cadastrado' as FiltroResumo,
      label: 'SKU Não Cadastrado',
      valor: skuNaoCadastrado,
      icon: Clock,
      destaque: false,
      color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
    },
    {
      id: 'sem_composicao' as FiltroResumo,
      label: 'Sem Composição',
      valor: semComposicao,
      icon: FileText,
      destaque: false,
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
    },
    {
      id: 'shipped' as FiltroResumo,
      label: 'Enviados',
      valor: shipped,
      icon: Truck,
      destaque: false,
      color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
    },
    {
      id: 'delivered' as FiltroResumo,
      label: 'Entregues',
      valor: delivered,
      icon: PackageCheck,
      destaque: false,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
    }
  ];

  // Mostrar todos os badges sempre
  const badgesVisiveis = badges;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-sm font-medium text-muted-foreground">Resumo:</span>
      
      {badgesVisiveis.map((badge) => {
        const Icon = badge.icon;
        const isActive = filtroAtivo === badge.id;
        
        return (
          <Badge
            key={badge.id}
            variant={badge.destaque ? "default" : "outline"}
            onClick={() => onFiltroClick?.(badge.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all",
              badge.color,
              isActive && "ring-2 ring-primary ring-offset-2 scale-105"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-normal">{badge.label}</span>
            <span className={cn(
              "font-bold ml-1 px-1.5 py-0.5 rounded",
              badge.destaque ? "bg-black/20" : "bg-primary/10"
            )}>
              {badge.valor}
            </span>
          </Badge>
        );
      })}
    </div>
  );
}
