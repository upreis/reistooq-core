/**
 * 🛡️ SEÇÃO DO DASHBOARD - MIGRAÇÃO GRADUAL FASE 1.4
 * Extraído do SimplePedidosPage para testar funcionalidade
 * GARANTIA: Mantém 100% da funcionalidade do dashboard
 */

import { memo } from 'react';
import { IntelligentPedidosDashboard } from '@/features/pedidos/components/IntelligentPedidosDashboard';
import { PedidosAlerts } from '../dashboard/PedidosAlerts';

interface PedidosDashboardSectionProps {
  orders: any[];
  loading: boolean;
  timeRange?: string;
  className?: string;
}

export const PedidosDashboardSection = memo(function PedidosDashboardSection({
  orders,
  loading,
  timeRange = '7d',
  className = ''
}: PedidosDashboardSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 🚨 Alertas de Pedidos */}
      <PedidosAlerts orders={orders} />
      
      {/* 📊 Dashboard Inteligente */}
      <IntelligentPedidosDashboard 
        orders={orders} 
        loading={loading}
      />
    </div>
  );
});