import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  // Simplified Brazil map with main states
  const states = [
    { uf: 'SP', path: 'M 300,350 L 350,350 L 350,400 L 300,400 Z' },
    { uf: 'RJ', path: 'M 350,370 L 380,370 L 380,400 L 350,400 Z' },
    { uf: 'MG', path: 'M 300,300 L 370,300 L 370,350 L 300,350 Z' },
    { uf: 'BA', path: 'M 320,200 L 400,200 L 400,300 L 320,300 Z' },
    { uf: 'PR', path: 'M 280,380 L 330,380 L 330,420 L 280,420 Z' },
    { uf: 'SC', path: 'M 280,420 L 330,420 L 330,450 L 280,450 Z' },
    { uf: 'RS', path: 'M 260,450 L 320,450 L 320,520 L 260,520 Z' },
    { uf: 'GO', path: 'M 250,250 L 320,250 L 320,320 L 250,320 Z' },
    { uf: 'MT', path: 'M 180,180 L 270,180 L 270,280 L 180,280 Z' },
    { uf: 'MS', path: 'M 200,320 L 270,320 L 270,400 L 200,400 Z' },
    { uf: 'PE', path: 'M 370,130 L 430,130 L 430,180 L 370,180 Z' },
    { uf: 'CE', path: 'M 350,80 L 420,80 L 420,130 L 350,130 Z' },
    { uf: 'PA', path: 'M 200,50 L 300,50 L 300,150 L 200,150 Z' },
    { uf: 'AM', path: 'M 80,80 L 200,80 L 200,180 L 80,180 Z' },
  ];

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
            <svg
              viewBox="0 0 500 550"
              className="w-full h-auto"
              onMouseMove={handleMouseMove}
            >
              {states.map(state => {
                const stateInfo = stateData.find(s => s.uf === state.uf);
                return (
                  <path
                    key={state.uf}
                    d={state.path}
                    fill={getStateColor(state.uf)}
                    stroke="#374151"
                    strokeWidth="1"
                    className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
                    onMouseEnter={() => setHoveredState(state.uf)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => handleStateClick(state.uf)}
                  />
                );
              })}
            </svg>

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
