import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  // Status de aprovação/rejeição
  'approved': { label: 'Aprovado', variant: 'default', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
  'rejected': { label: 'Recusado', variant: 'destructive' },
  'pending': { label: 'Pendente', variant: 'outline', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  
  // Status de análise
  'in_analysis': { label: 'Em Análise', variant: 'secondary', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  'waiting_seller': { label: 'Aguard. Vendedor', variant: 'outline', className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  'waiting_buyer': { label: 'Aguard. Comprador', variant: 'outline', className: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
  
  // Status de devolução física
  'shipped': { label: 'Enviado', variant: 'secondary', className: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20' },
  'delivered': { label: 'Entregue', variant: 'default', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
  'in_transit': { label: 'Em Trânsito', variant: 'secondary', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  
  // Status financeiro
  'refunded': { label: 'Reembolsado', variant: 'default', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
  'processing_refund': { label: 'Processando', variant: 'secondary', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  
  // Status finais
  'closed': { label: 'Fechado', variant: 'secondary', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
  'cancelled': { label: 'Cancelado', variant: 'outline', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
  'completed': { label: 'Completo', variant: 'default', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
  
  // Status de mediação
  'under_mediation': { label: 'Em Mediação', variant: 'destructive', className: 'bg-red-500/10 text-red-700 border-red-500/20' },
  'mediation_resolved': { label: 'Mediação Resolvida', variant: 'default', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20">
        Desconhecido
      </Badge>
    );
  }

  const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
  const config = statusConfig[normalizedStatus] || {
    label: status,
    variant: 'outline' as const,
    className: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
