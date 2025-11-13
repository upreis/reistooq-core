/**
 * 👤 CÉLULA DE RESPONSÁVEL PELO FRETE
 * Exibe quem é responsável pelo custo do frete da devolução
 */

import { Badge } from '@/components/ui/badge';
import { User, Store, Building2 } from 'lucide-react';

interface ResponsavelFreteCellProps {
  responsavel_custo_frete: string | null;
}

export const ResponsavelFreteCell = ({ responsavel_custo_frete }: ResponsavelFreteCellProps) => {
  if (!responsavel_custo_frete) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  // Normalizar valor para lowercase para comparação
  const responsavel = responsavel_custo_frete.toLowerCase();

  // Determinar variante, ícone e texto baseado no responsável
  const getResponsavelInfo = () => {
    if (responsavel.includes('buyer') || responsavel.includes('comprador')) {
      return {
        variant: 'default' as const,
        icon: User,
        text: 'Comprador',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
      };
    }
    
    if (responsavel.includes('seller') || responsavel.includes('vendedor')) {
      return {
        variant: 'secondary' as const,
        icon: Store,
        text: 'Vendedor',
        className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
      };
    }
    
    if (responsavel.includes('mercadolibre') || responsavel.includes('ml') || responsavel.includes('marketplace')) {
      return {
        variant: 'outline' as const,
        icon: Building2,
        text: 'Mercado Livre',
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
      };
    }

    // Default: retornar o valor original capitalizado
    return {
      variant: 'outline' as const,
      icon: User,
      text: responsavel_custo_frete,
      className: ''
    };
  };

  const info = getResponsavelInfo();
  const Icon = info.icon;

  return (
    <Badge variant={info.variant} className={`text-xs flex items-center gap-1 w-fit ${info.className}`}>
      <Icon className="h-3 w-3" />
      {info.text}
    </Badge>
  );
};
