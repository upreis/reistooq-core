/**
 * 📦 VENDAS PACK DIALOG
 * Dialog para visualizar detalhes de um pack
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Calendar, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendasPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packId: string;
  integrationAccountId: string;
}

export const VendasPackDialog = ({
  open,
  onOpenChange,
  packId,
  integrationAccountId
}: VendasPackDialogProps) => {
  const [pack, setPack] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && packId) {
      fetchPackDetails();
    }
  }, [open, packId]);

  const fetchPackDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ml-vendas-unified', {
        body: {
          action: 'fetch_pack',
          params: {
            packId,
            integrationAccountId
          }
        }
      });

      if (error) throw error;

      if (data?.pack) {
        setPack(data.pack);
      } else {
        throw new Error('Pack não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao buscar pack:', error);
      toast.error(error.message || 'Erro ao buscar detalhes do pack');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes do Pack #{packId}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : pack ? (
          <div className="space-y-6 py-4">
            {/* Status */}
            {pack.status && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge>{pack.status}</Badge>
              </div>
            )}

            {/* Data de criação */}
            {pack.date_created && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Criado em {format(new Date(pack.date_created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}

            {/* Orders do Pack */}
            {pack.orders && pack.orders.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Pedidos no Pack ({pack.orders.length})</h4>
                <div className="space-y-2">
                  {pack.orders.map((orderId: string) => (
                    <div key={orderId} className="p-3 bg-muted/30 rounded text-sm">
                      Pedido #{orderId}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Info */}
            {pack.shipment && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Informações de Envio
                </h4>
                <div className="p-4 bg-muted/30 rounded space-y-2 text-sm">
                  {pack.shipment.id && (
                    <p><strong>ID:</strong> {pack.shipment.id}</p>
                  )}
                  {pack.shipment.status && (
                    <p><strong>Status:</strong> <Badge variant="outline">{pack.shipment.status}</Badge></p>
                  )}
                  {pack.shipment.tracking_number && (
                    <p><strong>Rastreio:</strong> {pack.shipment.tracking_number}</p>
                  )}
                </div>
              </div>
            )}

            {/* Nota do Vendedor */}
            {pack.sellers_note && (
              <div className="space-y-2">
                <h4 className="font-semibold">Nota do Vendedor</h4>
                <div className="p-4 bg-muted/30 rounded text-sm">
                  {pack.sellers_note}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
