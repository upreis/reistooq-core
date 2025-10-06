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

  // Realistic Brazil map with all states
  const states = [
    // Norte
    { uf: 'AM', path: 'M 50,120 L 120,110 L 140,125 L 155,115 L 170,130 L 165,145 L 175,155 L 170,170 L 155,175 L 145,185 L 135,175 L 125,180 L 115,175 L 105,185 L 95,180 L 85,185 L 75,175 L 65,180 L 55,175 L 50,165 L 45,155 L 50,145 L 45,135 Z' },
    { uf: 'RR', path: 'M 120,30 L 140,35 L 145,50 L 140,65 L 135,75 L 125,85 L 120,95 L 110,95 L 105,85 L 100,75 L 105,65 L 100,55 L 105,45 L 110,40 Z' },
    { uf: 'AP', path: 'M 155,50 L 170,55 L 175,65 L 180,75 L 175,85 L 170,90 L 165,95 L 160,100 L 155,105 L 150,100 L 150,90 L 155,80 L 150,70 L 155,60 Z' },
    { uf: 'PA', path: 'M 120,110 L 175,105 L 200,115 L 220,125 L 235,130 L 245,140 L 255,150 L 260,160 L 255,170 L 245,175 L 235,180 L 225,175 L 215,180 L 205,175 L 195,180 L 185,175 L 175,170 L 165,165 L 155,170 L 145,165 L 135,170 L 125,165 L 120,155 L 125,145 L 120,135 Z' },
    { uf: 'TO', path: 'M 255,170 L 265,180 L 270,195 L 275,210 L 270,225 L 265,235 L 260,245 L 255,255 L 250,265 L 245,260 L 240,250 L 235,240 L 235,230 L 240,220 L 235,210 L 240,200 L 245,190 L 250,180 Z' },
    { uf: 'AC', path: 'M 50,155 L 65,165 L 75,175 L 85,185 L 90,195 L 85,205 L 75,210 L 65,205 L 55,200 L 45,195 L 40,185 L 35,175 L 40,165 Z' },
    { uf: 'RO', path: 'M 95,190 L 115,195 L 125,205 L 130,215 L 125,225 L 120,230 L 110,235 L 100,230 L 90,225 L 85,215 L 90,205 Z' },
    
    // Nordeste
    { uf: 'MA', path: 'M 260,160 L 275,165 L 290,170 L 305,165 L 315,170 L 320,180 L 315,190 L 305,195 L 295,200 L 285,205 L 275,210 L 270,200 L 265,190 L 265,180 Z' },
    { uf: 'PI', path: 'M 275,210 L 285,215 L 295,225 L 300,235 L 295,245 L 285,250 L 275,245 L 270,235 L 270,225 Z' },
    { uf: 'CE', path: 'M 320,150 L 340,155 L 355,160 L 365,155 L 375,160 L 380,170 L 375,180 L 365,185 L 355,180 L 345,185 L 335,180 L 325,175 L 320,165 Z' },
    { uf: 'RN', path: 'M 375,160 L 395,165 L 405,170 L 410,180 L 405,185 L 395,190 L 385,185 L 380,175 Z' },
    { uf: 'PB', path: 'M 395,185 L 410,190 L 415,200 L 410,205 L 400,210 L 390,205 L 385,195 Z' },
    { uf: 'PE', path: 'M 385,195 L 400,200 L 410,210 L 415,220 L 410,230 L 400,235 L 385,230 L 375,225 L 370,215 L 375,205 Z' },
    { uf: 'AL', path: 'M 400,235 L 410,240 L 415,250 L 410,260 L 400,255 L 395,245 Z' },
    { uf: 'SE', path: 'M 390,260 L 400,265 L 405,275 L 400,280 L 390,275 L 385,265 Z' },
    { uf: 'BA', path: 'M 295,245 L 310,250 L 325,260 L 340,270 L 355,280 L 365,290 L 370,305 L 365,320 L 355,330 L 340,335 L 325,340 L 310,335 L 295,330 L 285,320 L 280,305 L 275,290 L 280,275 L 285,260 Z' },
    
    // Centro-Oeste
    { uf: 'MT', path: 'M 130,215 L 150,220 L 170,230 L 185,240 L 200,255 L 210,270 L 215,285 L 210,300 L 200,310 L 185,315 L 170,310 L 155,305 L 145,295 L 135,285 L 130,270 L 125,255 L 125,240 Z' },
    { uf: 'MS', path: 'M 200,310 L 215,320 L 225,335 L 230,350 L 225,365 L 215,375 L 200,380 L 185,375 L 175,365 L 170,350 L 175,335 L 185,325 Z' },
    { uf: 'GO', path: 'M 250,265 L 265,275 L 280,285 L 290,300 L 295,315 L 290,330 L 280,340 L 265,345 L 250,340 L 240,330 L 235,315 L 240,300 L 245,285 Z' },
    { uf: 'DF', path: 'M 270,305 L 277,308 L 280,315 L 277,322 L 270,325 L 263,322 L 260,315 L 263,308 Z' },
    
    // Sudeste
    { uf: 'MG', path: 'M 280,340 L 300,345 L 320,355 L 335,365 L 345,380 L 350,395 L 345,405 L 330,410 L 315,405 L 300,400 L 285,395 L 270,385 L 260,370 L 255,355 L 260,345 Z' },
    { uf: 'ES', path: 'M 350,395 L 360,400 L 365,410 L 360,420 L 350,415 L 345,405 Z' },
    { uf: 'RJ', path: 'M 330,410 L 345,415 L 355,425 L 350,435 L 340,438 L 330,435 L 325,425 L 325,415 Z' },
    { uf: 'SP', path: 'M 285,395 L 305,405 L 320,415 L 330,425 L 325,440 L 315,450 L 300,455 L 285,450 L 270,440 L 260,425 L 255,410 L 260,400 Z' },
    
    // Sul
    { uf: 'PR', path: 'M 255,410 L 270,420 L 285,435 L 295,450 L 290,465 L 280,475 L 265,480 L 250,475 L 240,465 L 235,450 L 240,435 L 245,420 Z' },
    { uf: 'SC', path: 'M 250,475 L 265,485 L 280,495 L 285,505 L 280,515 L 265,520 L 250,515 L 240,505 L 235,495 L 240,485 Z' },
    { uf: 'RS', path: 'M 235,495 L 250,510 L 265,525 L 270,540 L 265,555 L 255,565 L 240,570 L 225,565 L 215,555 L 210,540 L 205,525 L 210,510 L 220,500 Z' },
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
              viewBox="0 0 450 600"
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
