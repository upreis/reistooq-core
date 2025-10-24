import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, MapPin, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import type { MLReturn } from '@/features/devolucoes/types/returns';

interface ClaimReturnsSectionProps {
  returns: MLReturn[] | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const ClaimReturnsSection: React.FC<ClaimReturnsSectionProps> = ({
  returns,
  loading,
  error,
  onRefresh
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Returns (Devoluções)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Carregando returns...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Returns (Devoluções)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!returns || returns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Returns (Devoluções)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Este claim não possui returns associados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Returns (Devoluções)
          <Badge variant="secondary">{returns.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {returns.map((returnItem) => (
          <div key={returnItem.id} className="border rounded-lg p-4 space-y-3">
            {/* Status e Tipo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={returnItem.status === 'delivered' ? 'default' : 'secondary'}
                >
                  {returnItem.status}
                </Badge>
                <Badge variant="outline">
                  {returnItem.type}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                ID: {returnItem.id}
              </span>
            </div>

            {/* Tracking Info */}
            {returnItem.tracking_number && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Rastreamento: {returnItem.tracking_number}
                </span>
                {returnItem.carrier && (
                  <Badge variant="outline" className="text-xs">
                    {returnItem.carrier.name}
                  </Badge>
                )}
              </div>
            )}

            {/* Endereço de Devolução */}
            {returnItem.return_address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-success mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Endereço de Devolução:</p>
                  <p className="text-muted-foreground">
                    {returnItem.return_address.address_line}<br />
                    {returnItem.return_address.city}, {returnItem.return_address.state}<br />
                    CEP: {returnItem.return_address.zip_code}
                  </p>
                </div>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Criado em:</p>
                  <p className="text-muted-foreground">
                    {new Date(returnItem.date_created).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              {returnItem.estimated_delivery_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Entrega Estimada:</p>
                    <p className="text-muted-foreground">
                      {new Date(returnItem.estimated_delivery_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Etiqueta de Envio */}
            {returnItem.shipping_label && (
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(returnItem.shipping_label!.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Baixar Etiqueta de Envio
                </Button>
              </div>
            )}

            {/* Ações Disponíveis */}
            {returnItem.available_actions && returnItem.available_actions.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Ações Disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {returnItem.available_actions.map((action, index) => (
                    <Badge 
                      key={index}
                      variant={action.mandatory ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {action.action}
                      {action.mandatory && " (Obrigatório)"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
