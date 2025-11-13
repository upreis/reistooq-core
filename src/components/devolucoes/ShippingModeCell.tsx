/**
 * 🚢 CÉLULA DE MODO DE ENVIO
 * Exibe modo de envio igual à página /pedidos
 */

import { Badge } from '@/components/ui/badge';
import { translateShippingMode } from '@/utils/pedidos-translations';

interface ShippingModeCellProps {
  shipping_mode: string | null;
}

export const ShippingModeCell = ({ shipping_mode }: ShippingModeCellProps) => {
  if (!shipping_mode) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const translatedMode = translateShippingMode(shipping_mode);

  return (
    <Badge variant="outline" className="text-xs">
      {translatedMode}
    </Badge>
  );
};
