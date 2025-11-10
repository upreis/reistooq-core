/**
 * 💰 FINANCIAL INFO CELL
 * Exibe dados financeiros da devolução com valores formatados
 */

import { DollarSign, TrendingDown, CreditCard } from 'lucide-react';
import { FinancialInfo } from '../../types/devolucao.types';
import { Badge } from '@/components/ui/badge';

interface FinancialInfoCellProps {
  financialInfo?: FinancialInfo | null;
  statusMoney?: string | null;
}

export const FinancialInfoCell = ({ financialInfo, statusMoney }: FinancialInfoCellProps) => {
  if (!financialInfo) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <DollarSign className="h-4 w-4" />
        <span className="text-xs">Sem dados</span>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return null;
    
    const methods: Record<string, string> = {
      'account_money': 'Saldo ML',
      'credit_card': 'Cartão Crédito',
      'debit_card': 'Cartão Débito',
      'ticket': 'Boleto',
      'pix': 'PIX',
    };
    
    return methods[method] || method;
  };

  const getPaymentStatusVariant = (status: string | null) => {
    if (!status) return 'secondary';
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
      'approved': 'success' as const,
      'pending': 'secondary' as const,
      'rejected': 'destructive' as const,
      'refunded': 'default' as const,
    };
    
    return variants[status] || 'secondary';
  };

  const getPaymentStatusLabel = (status: string | null) => {
    if (!status) return null;
    
    const labels: Record<string, string> = {
      'approved': 'Aprovado',
      'pending': 'Pendente',
      'rejected': 'Rejeitado',
      'refunded': 'Reembolsado',
    };
    
    return labels[status] || status;
  };

  const paymentMethodLabel = getPaymentMethodLabel(financialInfo.payment_method);
  const paymentStatusLabel = getPaymentStatusLabel(financialInfo.payment_status);

  return (
    <div className="flex flex-col gap-2 min-w-[220px] max-w-[280px]">
      {/* Valor Total da Venda */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="text-xs">Total:</span>
        </div>
        <span className="text-sm font-semibold">
          {formatCurrency(financialInfo.total_amount, financialInfo.currency_id)}
        </span>
      </div>

      {/* Valor Reembolsado/A Reembolsar */}
      {financialInfo.refund_amount > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-xs">
              {statusMoney === 'refunded' ? 'Reembolsado:' : 'A Reembolsar:'}
            </span>
          </div>
          <span className={`text-sm font-semibold ${
            statusMoney === 'refunded' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {formatCurrency(financialInfo.refund_amount, financialInfo.currency_id)}
          </span>
        </div>
      )}

      {/* Frete (se houver) */}
      {financialInfo.shipping_cost > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Frete:</span>
          <span className="text-xs font-medium">
            {formatCurrency(financialInfo.shipping_cost, financialInfo.currency_id)}
          </span>
        </div>
      )}

      {/* Método de Pagamento e Status */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
        {paymentMethodLabel && (
          <Badge variant="outline" className="text-xs gap-1">
            <CreditCard className="h-3 w-3" />
            {paymentMethodLabel}
          </Badge>
        )}
        
        {paymentStatusLabel && (
          <Badge variant={getPaymentStatusVariant(financialInfo.payment_status)} className="text-xs">
            {paymentStatusLabel}
          </Badge>
        )}
      </div>
    </div>
  );
};
