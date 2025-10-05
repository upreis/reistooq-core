import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StateData {
  uf: string;
  valor: number;
  vendas: number;
  percentual?: number;
}

interface BrazilMapProps {
  data: StateData[];
  className?: string;
}

export function BrazilMap({ data, className = '' }: BrazilMapProps) {
  // Calcular valores máximo para normalizar as cores
  const maxValor = Math.max(...data.map(d => d.valor));
  
  // Função para obter cor baseada no valor (quanto maior, mais intenso)
  const getStateColor = (uf: string) => {
    const stateData = data.find(d => d.uf === uf);
    if (!stateData) return 'hsl(var(--muted))';
    
    const intensity = (stateData.valor / maxValor) * 100;
    if (intensity > 75) return 'hsl(var(--primary))';
    if (intensity > 50) return 'hsl(var(--primary) / 0.7)';
    if (intensity > 25) return 'hsl(var(--primary) / 0.4)';
    return 'hsl(var(--primary) / 0.2)';
  };

  // Mapa de estados do Brasil (SVG simplificado)
  const states = [
    { uf: 'AC', path: 'M 50,200 L 80,190 L 90,220 L 60,230 Z', cx: 70, cy: 210 },
    { uf: 'AL', path: 'M 320,170 L 340,165 L 345,185 L 325,190 Z', cx: 332, cy: 177 },
    { uf: 'AP', path: 'M 180,30 L 200,25 L 210,50 L 190,55 Z', cx: 195, cy: 40 },
    { uf: 'AM', path: 'M 60,80 L 140,70 L 150,150 L 70,160 Z', cx: 105, cy: 115 },
    { uf: 'BA', path: 'M 270,140 L 320,130 L 330,200 L 280,210 Z', cx: 300, cy: 170 },
    { uf: 'CE', path: 'M 290,90 L 320,85 L 325,110 L 295,115 Z', cx: 307, cy: 100 },
    { uf: 'DF', path: 'M 240,180 L 250,175 L 255,190 L 245,195 Z', cx: 247, cy: 185 },
    { uf: 'ES', path: 'M 300,230 L 315,225 L 320,245 L 305,250 Z', cx: 310, cy: 237 },
    { uf: 'GO', path: 'M 220,170 L 260,160 L 270,210 L 230,220 Z', cx: 245, cy: 190 },
    { uf: 'MA', path: 'M 230,70 L 280,65 L 290,110 L 240,115 Z', cx: 260, cy: 90 },
    { uf: 'MT', path: 'M 160,150 L 230,140 L 240,200 L 170,210 Z', cx: 200, cy: 175 },
    { uf: 'MS', path: 'M 190,220 L 240,210 L 250,270 L 200,280 Z', cx: 220, cy: 245 },
    { uf: 'MG', path: 'M 250,200 L 300,190 L 310,240 L 260,250 Z', cx: 280, cy: 220 },
    { uf: 'PA', path: 'M 150,60 L 230,50 L 240,120 L 160,130 Z', cx: 195, cy: 90 },
    { uf: 'PB', path: 'M 310,110 L 330,105 L 335,125 L 315,130 Z', cx: 322, cy: 117 },
    { uf: 'PR', path: 'M 230,260 L 270,250 L 280,290 L 240,300 Z', cx: 255, cy: 275 },
    { uf: 'PE', path: 'M 300,120 L 325,115 L 330,145 L 305,150 Z', cx: 315, cy: 132 },
    { uf: 'PI', path: 'M 250,100 L 285,95 L 295,140 L 260,145 Z', cx: 272, cy: 120 },
    { uf: 'RJ', path: 'M 290,245 L 310,240 L 315,265 L 295,270 Z', cx: 302, cy: 255 },
    { uf: 'RN', path: 'M 305,95 L 325,90 L 330,110 L 310,115 Z', cx: 317, cy: 102 },
    { uf: 'RS', path: 'M 220,300 L 260,290 L 270,330 L 230,340 Z', cx: 245, cy: 315 },
    { uf: 'RO', path: 'M 110,170 L 140,165 L 150,200 L 120,205 Z', cx: 130, cy: 185 },
    { uf: 'RR', path: 'M 120,10 L 160,5 L 170,40 L 130,45 Z', cx: 145, cy: 25 },
    { uf: 'SC', path: 'M 240,290 L 270,280 L 280,310 L 250,320 Z', cx: 260, cy: 300 },
    { uf: 'SP', path: 'M 250,240 L 290,230 L 300,270 L 260,280 Z', cx: 275, cy: 255 },
    { uf: 'SE', path: 'M 315,150 L 335,145 L 340,165 L 320,170 Z', cx: 327, cy: 157 },
    { uf: 'TO', path: 'M 230,130 L 260,125 L 270,170 L 240,175 Z', cx: 250, cy: 150 }
  ];

  const getStateData = (uf: string) => data.find(d => d.uf === uf);

  return (
    <TooltipProvider>
      <svg 
        viewBox="0 0 400 350" 
        className={`w-full h-full ${className}`}
        style={{ maxHeight: '500px' }}
      >
        {/* Background */}
        <rect width="400" height="350" fill="transparent" />
        
        {/* Estados */}
        {states.map(state => {
          const stateData = getStateData(state.uf);
          return (
            <Tooltip key={state.uf}>
              <TooltipTrigger asChild>
                <g className="cursor-pointer transition-all hover:opacity-80">
                  <path
                    d={state.path}
                    fill={getStateColor(state.uf)}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    className="transition-all"
                  />
                  <text
                    x={state.cx}
                    y={state.cy}
                    textAnchor="middle"
                    className="text-[8px] font-semibold fill-foreground pointer-events-none"
                  >
                    {state.uf}
                  </text>
                </g>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-semibold">{state.uf}</div>
                  {stateData ? (
                    <>
                      <div className="text-xs text-muted-foreground">
                        Vendas: {stateData.vendas}
                      </div>
                      <div className="text-xs font-medium">
                        {stateData.valor.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">Sem dados</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </svg>
    </TooltipProvider>
  );
}
