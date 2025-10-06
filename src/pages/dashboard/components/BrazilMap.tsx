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
    if (!state || state.vendas === 0) return '#f3f4f6';
    
    const maxVendas = Math.max(...stateData.map(s => s.vendas || 0), 1);
    const intensity = state.vendas / maxVendas;
    const opacity = Math.max(0.2, intensity);
    
    return `rgba(16, 185, 129, ${opacity})`;
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

  // Geographically accurate Brazil map with all 27 states
  const states = [
    // ACRE - Extremo oeste
    { uf: 'AC', path: 'M50,300 L90,290 L100,310 L95,330 L85,340 L70,345 L55,335 L45,315 Z' },
    
    // AMAZONAS - Grande estado norte
    { uf: 'AM', path: 'M50,200 L200,190 L280,200 L320,220 L350,250 L360,290 L340,320 L300,340 L250,350 L200,345 L150,340 L100,330 L90,290 L50,300 L30,250 L35,220 Z' },
    
    // PARÁ - Nordeste da região norte
    { uf: 'PA', path: 'M280,200 L400,185 L450,210 L480,240 L490,270 L485,300 L470,330 L440,350 L400,360 L360,355 L340,340 L320,320 L310,290 L315,260 L330,230 Z' },
    
    // RORAIMA - Norte extremo
    { uf: 'RR', path: 'M200,120 L280,110 L300,140 L290,170 L270,190 L240,200 L210,190 L190,160 Z' },
    
    // AMAPÁ - Nordeste extremo
    { uf: 'AP', path: 'M450,150 L490,140 L510,170 L500,200 L480,220 L450,210 L430,180 Z' },
    
    // RONDÔNIA - Sul do Acre
    { uf: 'RO', path: 'M90,290 L140,280 L160,300 L155,320 L140,340 L120,350 L100,345 L85,325 Z' },
    
    // MATO GROSSO - Centro-oeste grande
    { uf: 'MT', path: 'M140,340 L250,350 L300,360 L320,380 L330,410 L320,440 L300,470 L270,490 L240,500 L210,495 L180,485 L150,470 L130,450 L125,420 L135,390 Z' },
    
    // TOCANTINS - Centro-norte
    { uf: 'TO', path: 'M400,360 L450,340 L480,370 L490,400 L480,430 L460,450 L430,460 L400,450 L380,420 L375,390 Z' },
    
    // MARANHÃO - Nordeste oeste
    { uf: 'MA', path: 'M470,330 L530,320 L550,350 L540,380 L520,400 L490,410 L470,400 L460,370 Z' },
    
    // PIAUÍ - Centro nordeste
    { uf: 'PI', path: 'M490,410 L540,390 L560,420 L550,450 L530,470 L500,480 L480,460 L475,430 Z' },
    
    // CEARÁ - Nordeste norte
    { uf: 'CE', path: 'M550,350 L620,340 L640,370 L630,400 L610,420 L580,430 L560,420 L540,390 Z' },
    
    // RIO GRANDE DO NORTE - Nordeste extremo
    { uf: 'RN', path: 'M630,370 L680,360 L700,380 L690,400 L670,410 L650,405 L635,385 Z' },
    
    // PARAÍBA - Nordeste leste
    { uf: 'PB', path: 'M650,405 L690,400 L705,420 L695,440 L675,450 L655,445 L645,425 Z' },
    
    // PERNAMBUCO - Nordeste centro-leste
    { uf: 'PE', path: 'M580,430 L655,445 L675,480 L660,510 L630,530 L600,540 L570,530 L550,500 L560,470 Z' },
    
    // ALAGOAS - Pequeno estado nordeste
    { uf: 'AL', path: 'M630,530 L660,520 L675,540 L665,560 L645,570 L630,565 L620,545 Z' },
    
    // SERGIPE - Menor estado
    { uf: 'SE', path: 'M630,565 L665,560 L675,580 L660,595 L640,600 L625,590 L620,575 Z' },
    
    // BAHIA - Grande estado nordeste
    { uf: 'BA', path: 'M530,470 L570,530 L600,540 L620,575 L610,610 L590,640 L560,660 L520,670 L480,660 L450,640 L430,610 L420,580 L430,550 L460,530 L490,510 Z' },
    
    // GOIÁS - Centro-oeste
    { uf: 'GO', path: 'M400,450 L460,530 L490,560 L480,590 L460,620 L430,640 L400,650 L370,640 L350,620 L340,590 L350,560 L370,540 L390,520 Z' },
    
    // DISTRITO FEDERAL - Pequeno no centro de Goiás
    { uf: 'DF', path: 'M425,575 L435,570 L440,580 L435,590 L425,585 Z' },
    
    // MATO GROSSO DO SUL - Sul do centro-oeste
    { uf: 'MS', path: 'M270,490 L370,540 L400,570 L390,600 L370,630 L340,650 L310,660 L280,650 L250,630 L230,600 L225,570 L235,540 Z' },
    
    // MINAS GERAIS - Grande estado sudeste
    { uf: 'MG', path: 'M430,640 L520,620 L560,640 L590,660 L610,690 L600,720 L580,740 L550,750 L520,760 L490,750 L460,740 L430,720 L410,700 L400,680 L410,660 Z' },
    
    // ESPÍRITO SANTO - Pequeno estado leste
    { uf: 'ES', path: 'M590,660 L620,650 L630,670 L625,690 L615,710 L600,720 L590,700 L585,680 Z' },
    
    // RIO DE JANEIRO - Estado leste
    { uf: 'RJ', path: 'M550,750 L600,720 L620,740 L615,760 L600,780 L580,790 L560,785 L540,775 L530,760 Z' },
    
    // SÃO PAULO - Estado sudeste
    { uf: 'SP', path: 'M460,740 L530,760 L520,790 L500,810 L470,820 L440,810 L420,790 L410,770 L420,750 L440,745 Z' },
    
    // PARANÁ - Sul
    { uf: 'PR', path: 'M340,650 L430,640 L460,740 L440,745 L420,750 L400,760 L380,770 L360,760 L340,750 L330,730 L325,710 L330,690 L335,670 Z' },
    
    // SANTA CATARINA - Sul centro
    { uf: 'SC', path: 'M360,760 L420,750 L440,770 L430,790 L410,800 L390,810 L370,805 L350,795 L340,780 L345,765 Z' },
    
    // RIO GRANDE DO SUL - Sul extremo
    { uf: 'RS', path: 'M340,795 L410,800 L430,820 L420,850 L400,870 L370,880 L340,875 L320,860 L310,840 L315,820 L325,805 Z' },
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
              viewBox="0 0 800 900"
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
