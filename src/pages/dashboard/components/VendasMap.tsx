import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface VendasMapProps {
  analytics: any;
  onStateClick: (stateData: any) => void;
  selectedState: any;
}

export function VendasMap({ analytics, onStateClick, selectedState }: VendasMapProps) {
  
  if (!analytics?.geografico?.estados) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Carregando dados do mapa...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Análise Geográfica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            <h4 className="font-semibold text-sm">Top Estados</h4>
            {analytics.geografico.estados.slice(0, 10).map((estado: any, index: number) => (
              <div
                key={estado.uf}
                className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onStateClick(estado)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{estado.uf}</span>
                </div>
                <div className="text-right text-sm">
                  <div>{estado.vendas} vendas</div>
                  <div className="text-muted-foreground">
                    {formatCurrency(estado.valor)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {selectedState && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Detalhes - {selectedState.uf}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold">{selectedState.vendas}</div>
                <div className="text-sm text-muted-foreground">Total de Vendas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(selectedState.valor)}
                </div>
                <div className="text-sm text-muted-foreground">Faturamento</div>
              </div>
            </div>
            
            <h4 className="font-semibold text-sm mb-2">Top Cidades</h4>
            {analytics.geografico.cidades
              ?.filter((cidade: any) => cidade.uf === selectedState.uf)
              ?.slice(0, 5)
              ?.map((cidade: any) => (
                <div
                  key={cidade.cidade}
                  className="flex items-center justify-between py-2 border-t"
                >
                  <span className="text-sm">{cidade.cidade}</span>
                  <div className="text-right text-sm">
                    <div>{cidade.vendas} vendas</div>
                    <div className="text-muted-foreground">
                      {formatCurrency(cidade.valor)}
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
