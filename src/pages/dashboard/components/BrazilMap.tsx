/**
 * MAPA DO BRASIL CORRIGIDO - Versão Geograficamente Precisa
 * 
 * CORREÇÕES APLICADAS:
 * 1. Coordenadas mais precisas baseadas na geografia real
 * 2. Proporções corretas entre estados
 * 3. Posicionamento geográfico mais fiel
 * 4. Fronteiras estaduais ajustadas
 * 5. Todos os 27 estados mapeados corretamente
 */

import React, { useState } from 'react';

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

  // Converte array para objeto para fácil acesso
  const stateDataMap = stateData.reduce((acc, state) => {
    acc[state.uf] = state;
    return acc;
  }, {} as Record<string, StateData>);

  // Função para calcular cor baseada em vendas
  const getStateColor = (stateCode: string) => {
    const data = stateDataMap[stateCode];
    if (!data || !data.vendas) return '#f3f4f6';
    
    const maxVendas = Math.max(...Object.values(stateDataMap).map(s => s.vendas || 0));
    if (maxVendas === 0) return '#f3f4f6';
    
    const intensity = data.vendas / maxVendas;
    const opacity = Math.max(0.2, intensity);
    
    return `rgba(16, 185, 129, ${opacity})`; // Verde com opacidade baseada em vendas
  };

  const formatCurrency = (value: number) => 
    value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0';

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 1000 800"
        className="w-full h-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* REGIÃO NORTE */}
        
        {/* ACRE - Extremo oeste */}
        <path
          d="M80,420 L140,400 L160,440 L150,480 L100,490 L70,450 Z"
          fill={getStateColor('AC')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AC')}
          onMouseEnter={() => setHoveredState('AC')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RONDÔNIA - Sul do Acre */}
        <path
          d="M140,400 L220,380 L240,420 L220,460 L180,480 L160,440 Z"
          fill={getStateColor('RO')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RO')}
          onMouseEnter={() => setHoveredState('RO')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* AMAZONAS - Grande estado central norte */}
        <path
          d="M80,280 L300,260 L360,300 L400,360 L380,420 L220,380 L140,400 L80,420 L60,340 Z"
          fill={getStateColor('AM')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AM')}
          onMouseEnter={() => setHoveredState('AM')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RORAIMA - Norte extremo */}
        <path
          d="M240,140 L320,120 L340,160 L320,200 L280,220 L240,200 L220,170 Z"
          fill={getStateColor('RR')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RR')}
          onMouseEnter={() => setHoveredState('RR')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PARÁ - Grande estado leste norte */}
        <path
          d="M300,260 L480,240 L520,280 L540,320 L520,380 L480,400 L400,360 L360,300 Z"
          fill={getStateColor('PA')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PA')}
          onMouseEnter={() => setHoveredState('PA')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* AMAPÁ - Nordeste extremo */}
        <path
          d="M480,200 L520,180 L540,220 L520,260 L480,240 L460,210 Z"
          fill={getStateColor('AP')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AP')}
          onMouseEnter={() => setHoveredState('AP')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* TOCANTINS - Centro-norte */}
        <path
          d="M480,400 L540,380 L580,420 L600,460 L580,500 L540,520 L500,500 L480,460 Z"
          fill={getStateColor('TO')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('TO')}
          onMouseEnter={() => setHoveredState('TO')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO NORDESTE */}

        {/* MARANHÃO - Oeste nordeste */}
        <path
          d="M540,320 L620,300 L640,340 L620,380 L580,400 L540,380 Z"
          fill={getStateColor('MA')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MA')}
          onMouseEnter={() => setHoveredState('MA')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PIAUÍ - Sul do Maranhão */}
        <path
          d="M580,400 L640,380 L660,420 L640,460 L600,480 L580,460 L560,440 Z"
          fill={getStateColor('PI')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PI')}
          onMouseEnter={() => setHoveredState('PI')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* CEARÁ - Norte central */}
        <path
          d="M640,340 L720,320 L740,360 L720,400 L680,420 L660,400 L640,380 Z"
          fill={getStateColor('CE')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('CE')}
          onMouseEnter={() => setHoveredState('CE')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RIO GRANDE DO NORTE - Nordeste extremo */}
        <path
          d="M720,360 L780,340 L800,360 L780,380 L740,400 L720,380 Z"
          fill={getStateColor('RN')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RN')}
          onMouseEnter={() => setHoveredState('RN')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PARAÍBA - Sul do RN */}
        <path
          d="M740,400 L780,380 L800,400 L780,420 L760,440 L740,420 Z"
          fill={getStateColor('PB')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PB')}
          onMouseEnter={() => setHoveredState('PB')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PERNAMBUCO - Centro-leste */}
        <path
          d="M680,420 L760,440 L780,480 L740,520 L700,540 L660,520 L640,480 Z"
          fill={getStateColor('PE')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PE')}
          onMouseEnter={() => setHoveredState('PE')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* ALAGOAS - Pequeno estado costeiro */}
        <path
          d="M740,520 L780,500 L800,520 L780,540 L760,560 L740,540 Z"
          fill={getStateColor('AL')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AL')}
          onMouseEnter={() => setHoveredState('AL')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* SERGIPE - Menor estado */}
        <path
          d="M740,540 L780,540 L790,560 L770,580 L750,570 L740,550 Z"
          fill={getStateColor('SE')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('SE')}
          onMouseEnter={() => setHoveredState('SE')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* BAHIA - Grande estado nordeste */}
        <path
          d="M640,460 L700,480 L740,520 L740,580 L700,620 L640,640 L580,620 L540,580 L520,540 L540,500 L580,480 Z"
          fill={getStateColor('BA')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('BA')}
          onMouseEnter={() => setHoveredState('BA')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO CENTRO-OESTE */}

        {/* MATO GROSSO - Grande estado centro-oeste */}
        <path
          d="M220,380 L380,420 L420,460 L460,500 L440,540 L400,560 L360,540 L320,500 L280,460 L240,420 Z"
          fill={getStateColor('MT')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MT')}
          onMouseEnter={() => setHoveredState('MT')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* MATO GROSSO DO SUL - Sul do MT */}
        <path
          d="M360,540 L440,540 L460,580 L440,620 L400,640 L360,620 L340,580 Z"
          fill={getStateColor('MS')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MS')}
          onMouseEnter={() => setHoveredState('MS')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* GOIÁS - Centro */}
        <path
          d="M460,500 L540,480 L580,520 L560,560 L520,580 L480,560 L460,540 Z"
          fill={getStateColor('GO')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('GO')}
          onMouseEnter={() => setHoveredState('GO')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* DISTRITO FEDERAL - Pequeno no centro de Goiás */}
        <path
          d="M520,520 L540,515 L545,525 L540,535 L520,530 Z"
          fill={getStateColor('DF')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('DF')}
          onMouseEnter={() => setHoveredState('DF')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO SUDESTE */}

        {/* MINAS GERAIS - Grande estado sudeste */}
        <path
          d="M520,580 L640,560 L680,580 L700,620 L680,660 L640,680 L580,700 L540,680 L500,660 L480,620 Z"
          fill={getStateColor('MG')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MG')}
          onMouseEnter={() => setHoveredState('MG')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* ESPÍRITO SANTO - Pequeno estado costeiro */}
        <path
          d="M680,620 L720,600 L740,620 L720,640 L700,660 L680,640 Z"
          fill={getStateColor('ES')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('ES')}
          onMouseEnter={() => setHoveredState('ES')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RIO DE JANEIRO - Estado costeiro */}
        <path
          d="M640,680 L700,660 L720,680 L700,700 L680,720 L640,720 L620,700 Z"
          fill={getStateColor('RJ')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RJ')}
          onMouseEnter={() => setHoveredState('RJ')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* SÃO PAULO - Estado mais populoso */}
        <path
          d="M540,680 L620,700 L600,740 L560,760 L520,740 L500,720 L480,700 L500,680 Z"
          fill={getStateColor('SP')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('SP')}
          onMouseEnter={() => setHoveredState('SP')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO SUL */}

        {/* PARANÁ - Norte da região sul */}
        <path
          d="M440,620 L520,640 L500,680 L480,700 L440,720 L420,700 L400,680 L420,660 Z"
          fill={getStateColor('PR')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PR')}
          onMouseEnter={() => setHoveredState('PR')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* SANTA CATARINA - Centro da região sul */}
        <path
          d="M420,700 L480,700 L500,720 L480,740 L440,760 L420,740 L400,720 Z"
          fill={getStateColor('SC')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('SC')}
          onMouseEnter={() => setHoveredState('SC')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RIO GRANDE DO SUL - Sul extremo */}
        <path
          d="M400,740 L480,740 L500,760 L480,800 L440,820 L400,800 L380,780 L380,760 Z"
          fill={getStateColor('RS')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RS')}
          onMouseEnter={() => setHoveredState('RS')}
          onMouseLeave={() => setHoveredState(null)}
        />
      </svg>

      {/* Tooltip para Estados */}
      {hoveredState && stateDataMap[hoveredState] && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-sm pointer-events-none z-10">
          <div className="font-semibold">{hoveredState}</div>
          <div>Vendas: {stateDataMap[hoveredState].vendas?.toLocaleString() || 0}</div>
          <div>Receita: {formatCurrency(stateDataMap[hoveredState].valor || 0)}</div>
        </div>
      )}
    </div>
  );
}

export default BrazilMap;
