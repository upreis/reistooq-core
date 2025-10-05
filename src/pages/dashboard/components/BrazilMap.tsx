import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Maximize2, Eye, EyeOff } from 'lucide-react';
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
  const [showCities, setShowCities] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
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
    if (!state || state.vendas === 0) return 'hsl(var(--muted))';
    
    const normalized = (state.vendas - minSales) / (maxSales - minSales);
    const lightness = 50 - (normalized * 20);
    return `hsl(142, 76%, ${lightness}%)`;
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

  const MapContent = ({ className = "" }: { className?: string }) => (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 800 900"
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
      >
        {/* Estados do Brasil com coordenadas mais realistas */}
        
        {/* Região Norte */}
        <path id="AC" d="M 100,380 L 150,370 L 170,400 L 160,430 L 120,440 L 90,410 Z" 
          fill={getStateColor('AC')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('AC')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('AC')} />
        
        <path id="AM" d="M 100,300 L 230,280 L 270,310 L 300,360 L 260,400 L 170,420 L 150,380 L 100,390 L 80,340 Z"
          fill={getStateColor('AM')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('AM')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('AM')} />
        
        <path id="RR" d="M 180,160 L 250,145 L 265,180 L 230,215 L 180,225 L 165,190 Z"
          fill={getStateColor('RR')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('RR')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('RR')} />
        
        <path id="AP" d="M 310,180 L 350,165 L 370,200 L 355,235 L 315,225 L 295,195 Z"
          fill={getStateColor('AP')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('AP')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('AP')} />
        
        <path id="PA" d="M 230,280 L 350,265 L 390,295 L 410,335 L 385,375 L 335,390 L 300,370 L 270,320 Z"
          fill={getStateColor('PA')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('PA')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('PA')} />
        
        <path id="RO" d="M 160,420 L 230,405 L 250,440 L 235,475 L 195,490 L 160,470 L 145,435 Z"
          fill={getStateColor('RO')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('RO')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('RO')} />
        
        <path id="TO" d="M 385,375 L 415,365 L 435,395 L 450,430 L 435,465 L 410,485 L 385,470 L 370,435 L 365,400 Z"
          fill={getStateColor('TO')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('TO')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('TO')} />

        {/* Região Nordeste */}
        <path id="MA" d="M 410,335 L 480,320 L 500,355 L 485,390 L 460,400 L 435,385 L 415,360 Z"
          fill={getStateColor('MA')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('MA')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('MA')} />
        
        <path id="PI" d="M 435,395 L 485,385 L 505,420 L 490,455 L 460,465 L 435,450 L 425,420 Z"
          fill={getStateColor('PI')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('PI')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('PI')} />
        
        <path id="CE" d="M 500,355 L 570,340 L 595,370 L 580,395 L 540,400 L 515,380 Z"
          fill={getStateColor('CE')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('CE')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('CE')} />
        
        <path id="RN" d="M 570,370 L 625,355 L 645,375 L 630,395 L 595,400 L 575,385 Z"
          fill={getStateColor('RN')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('RN')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('RN')} />
        
        <path id="PB" d="M 595,400 L 630,395 L 645,415 L 635,430 L 610,435 L 595,420 Z"
          fill={getStateColor('PB')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('PB')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('PB')} />
        
        <path id="PE" d="M 540,420 L 610,435 L 630,465 L 615,490 L 575,505 L 540,485 L 515,455 Z"
          fill={getStateColor('PE')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('PE')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('PE')} />
        
        <path id="AL" d="M 615,490 L 645,475 L 660,495 L 650,515 L 625,520 L 610,505 Z"
          fill={getStateColor('AL')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('AL')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('AL')} />
        
        <path id="SE" d="M 610,520 L 650,515 L 660,535 L 645,555 L 625,555 L 610,540 Z"
          fill={getStateColor('SE')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('SE')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('SE')} />
        
        <path id="BA" d="M 490,455 L 540,485 L 575,505 L 610,555 L 600,595 L 560,625 L 510,640 L 470,620 L 445,580 L 430,540 L 440,495 Z"
          fill={getStateColor('BA')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('BA')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('BA')} />

        {/* Região Centro-Oeste */}
        <path id="MT" d="M 250,440 L 335,420 L 385,450 L 420,490 L 410,530 L 380,560 L 340,570 L 300,550 L 270,515 L 245,475 Z"
          fill={getStateColor('MT')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('MT')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('MT')} />
        
        <path id="MS" d="M 340,570 L 410,555 L 435,590 L 430,630 L 405,665 L 370,680 L 330,670 L 305,640 L 295,600 Z"
          fill={getStateColor('MS')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('MS')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('MS')} />
        
        <path id="GO" d="M 410,485 L 460,470 L 490,495 L 510,530 L 500,565 L 470,590 L 435,600 L 410,580 L 395,545 L 400,510 Z"
          fill={getStateColor('GO')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('GO')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('GO')} />
        
        <circle id="DF" cx="475" cy="540" r="8"
          fill={getStateColor('DF')} stroke="hsl(var(--border))" strokeWidth="2"
          className="cursor-pointer hover:stroke-primary hover:stroke-3 transition-all"
          onMouseEnter={() => setHoveredState('DF')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('DF')} />

        {/* Região Sudeste */}
        <path id="MG" d="M 470,590 L 540,570 L 600,595 L 630,630 L 620,670 L 585,700 L 540,710 L 500,695 L 465,665 L 445,630 L 450,600 Z"
          fill={getStateColor('MG')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('MG')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('MG')} />
        
        <path id="ES" d="M 620,630 L 660,610 L 680,630 L 670,655 L 650,665 L 620,660 L 610,640 Z"
          fill={getStateColor('ES')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('ES')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('ES')} />
        
        <path id="RJ" d="M 585,700 L 650,680 L 670,700 L 660,725 L 635,740 L 600,740 L 575,720 Z"
          fill={getStateColor('RJ')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('RJ')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('RJ')} />
        
        <path id="SP" d="M 500,695 L 575,705 L 590,735 L 560,765 L 520,780 L 480,770 L 450,745 L 440,710 L 460,700 Z"
          fill={getStateColor('SP')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('SP')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('SP')} />

        {/* Região Sul */}
        <path id="PR" d="M 405,665 L 465,665 L 480,695 L 475,725 L 450,750 L 415,765 L 380,755 L 360,730 L 365,700 Z"
          fill={getStateColor('PR')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('PR')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('PR')} />
        
        <path id="SC" d="M 380,755 L 450,750 L 475,770 L 470,795 L 440,815 L 405,820 L 375,805 L 360,780 Z"
          fill={getStateColor('SC')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('SC')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('SC')} />
        
        <path id="RS" d="M 360,805 L 440,815 L 460,840 L 455,875 L 430,900 L 390,910 L 350,895 L 325,865 L 325,830 Z"
          fill={getStateColor('RS')} stroke="hsl(var(--border))" strokeWidth="1.5"
          className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
          onMouseEnter={() => setHoveredState('RS')} onMouseLeave={() => setHoveredState(null)}
          onClick={() => handleStateClick('RS')} />
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
                <div className="text-sm">{state.vendas} vendas</div>
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
  );

  return (
    <>
      <Card className="col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Vendas - Brasil
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaximized(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MapContent />

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

      <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa de Vendas - Visão Completa
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <MapContent className="h-96" />
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Top 10 Estados</h4>
                <div className="space-y-1">
                  {stateData
                    .sort((a, b) => b.vendas - a.vendas)
                    .slice(0, 10)
                    .map((state, index) => (
                      <div key={state.uf} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-bold">#{index + 1}</span>
                          <span>{state.uf}</span>
                        </div>
                        <div className="text-right">
                          <div>{state.vendas} vendas</div>
                          <div className="text-xs text-muted-foreground">
                            {state.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
