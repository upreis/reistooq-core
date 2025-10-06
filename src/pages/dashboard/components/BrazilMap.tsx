import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BrazilMapSVG from '@/assets/brazil-map.svg';

interface StateData {
  uf: string;
  vendas: number;
  valor: number;
  pedidos: number;
  cidades: Array<{ cidade: string; vendas: number; valor: number }>;
}

interface BrazilMapProps {
  stateData: StateData[];
  onStateClick: (uf: string) => void;
}

export function BrazilMap({ stateData, onStateClick }: BrazilMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleStateClickEvent = (e: CustomEvent) => {
      handleStateClick(e.detail);
    };
    const handleStateHoverEvent = (e: CustomEvent) => {
      setHoveredState(e.detail);
    };
    const handleStateHoverOutEvent = () => {
      setHoveredState(null);
    };

    window.addEventListener('stateClick', handleStateClickEvent as EventListener);
    window.addEventListener('stateHover', handleStateHoverEvent as EventListener);
    window.addEventListener('stateHoverOut', handleStateHoverOutEvent);

    return () => {
      window.removeEventListener('stateClick', handleStateClickEvent as EventListener);
      window.removeEventListener('stateHover', handleStateHoverEvent as EventListener);
      window.removeEventListener('stateHoverOut', handleStateHoverOutEvent);
    };
  }, [stateData]);

  const { minSales, maxSales } = useMemo(() => {
    const sales = stateData.map(s => s.vendas);
    return {
      minSales: Math.min(...sales, 0),
      maxSales: Math.max(...sales, 1),
    };
  }, [stateData]);

  const getStateColor = (uf: string) => {
    const state = stateData.find(s => s.uf === uf);
    if (!state || state.vendas === 0) return '#e5f3e5';
    
    const normalized = (state.vendas - minSales) / (maxSales - minSales);
    const opacity = 0.3 + (normalized * 0.7);
    return `hsl(142, 76%, ${50 - normalized * 20}%, ${opacity})`;
  };

  const handleStateClick = (uf: string) => {
    const state = stateData.find(s => s.uf === uf);
    if (state) {
      setSelectedState(state);
      onStateClick(uf);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const topStates = useMemo(() => {
    return [...stateData]
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);
  }, [stateData]);

  // Map state IDs from SVG to UF codes
  const stateIdMap: Record<string, string> = {
    'Rondonia': 'RO',
    'Acre': 'AC',
    'Amazonas': 'AM',
    'Roraima': 'RR',
    'Para': 'PA',
    'Amapa': 'AP',
    'Tocantins': 'TO',
    'Maranhao': 'MA',
    'Piaui': 'PI',
    'Ceara': 'CE',
    'Rio_Grande_do_Norte': 'RN',
    'Paraiba': 'PB',
    'Pernambuco': 'PE',
    'Alagoas': 'AL',
    'Sergipe': 'SE',
    'Bahia': 'BA',
    'Minas_Gerais': 'MG',
    'Espirito_Santo': 'ES',
    'Rio_de_Janeiro': 'RJ',
    'Sao_Paulo': 'SP',
    'Parana': 'PR',
    'Santa_Catarina': 'SC',
    'Rio_Grande_do_Sul': 'RS',
    'Mato_Grosso_do_Sul': 'MS',
    'Mato_Grosso': 'MT',
    'Goias': 'GO',
    'Distrito_Federal': 'DF',
  };

  return (
    <>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Vendas - Brasil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              className="w-full h-auto"
              onMouseMove={handleMouseMove}
              dangerouslySetInnerHTML={{
                __html: BrazilMapSVG.replace(
                  /<g\s+id="([^"]+)">/g,
                  (match, id) => {
                    const uf = stateIdMap[id];
                    if (!uf) return match;
                    const color = getStateColor(uf);
                    return `<g id="${id}" class="cursor-pointer transition-all" style="fill:${color};stroke:#374151;stroke-width:200" onmouseenter="this.style.stroke='hsl(var(--primary))';this.style.strokeWidth='400'" onmouseleave="this.style.stroke='#374151';this.style.strokeWidth='200'" onclick="window.dispatchEvent(new CustomEvent('stateClick', {detail: '${uf}'}))" onmouseover="window.dispatchEvent(new CustomEvent('stateHover', {detail: '${uf}'}))" onmouseout="window.dispatchEvent(new CustomEvent('stateHoverOut'))">`;
                  }
                )
              }}
            />

            {hoveredState && (
              <div
                className="fixed z-50 bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 pointer-events-none"
                style={{
                  left: mousePosition.x + 10,
                  top: mousePosition.y + 10,
                }}
              >
                {(() => {
                  const state = stateData.find(s => s.uf === hoveredState);
                  return state ? (
                    <>
                      <div className="font-bold">{state.uf}</div>
                      <div className="text-sm">
                        {state.vendas} vendas
                      </div>
                      <div className="text-sm">
                        {state.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm">Sem dados</div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold">Top 5 Estados</h4>
            {topStates.map((state, index) => (
              <div
                key={state.uf}
                className="flex items-center justify-between p-2 bg-muted/50 rounded hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleStateClick(state.uf)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{state.uf}</span>
                </div>
                <div className="text-right text-sm">
                  <div>{state.vendas} vendas</div>
                  <div className="text-muted-foreground">
                    {state.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Escala:</div>
            <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-green-100 to-green-600" />
            <div className="text-xs text-muted-foreground">Mais vendas</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedState} onOpenChange={() => setSelectedState(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendas em {selectedState?.uf}</DialogTitle>
          </DialogHeader>
          {selectedState && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedState.vendas}</div>
                    <div className="text-sm text-muted-foreground">Total Vendas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {selectedState.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-sm text-muted-foreground">Receita</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedState.pedidos}</div>
                    <div className="text-sm text-muted-foreground">Pedidos</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Top Cidades</h4>
                <div className="space-y-2">
                  {selectedState.cidades.slice(0, 5).map((cidade, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span>{cidade.cidade}</span>
                      <div className="text-right text-sm">
                        <div>{cidade.vendas} vendas</div>
                        <div className="text-muted-foreground">
                          {cidade.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
