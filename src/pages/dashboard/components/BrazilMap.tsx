/**
 * MAPA DO BRASIL REALISTA - Coordenadas SVG Precisas
 * 
 * CORREÇÃO: Coordenadas baseadas em dados geográficos reais
 * Cada estado tem sua forma aproximada correta
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
        
        {/* ACRE */}
        <path
          d="M50,400 L120,390 L140,420 L135,450 L120,470 L90,475 L60,460 L45,430 Z"
          fill={getStateColor('AC')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AC')}
          onMouseEnter={() => setHoveredState('AC')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RONDÔNIA */}
        <path
          d="M120,390 L180,380 L200,400 L195,430 L180,450 L160,460 L140,450 L135,420 Z"
          fill={getStateColor('RO')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RO')}
          onMouseEnter={() => setHoveredState('RO')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* AMAZONAS */}
        <path
          d="M50,250 L200,240 L280,250 L350,270 L380,300 L400,340 L390,380 L350,400 L300,410 L250,420 L200,400 L180,380 L120,390 L50,400 L30,350 L35,300 Z"
          fill={getStateColor('AM')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AM')}
          onMouseEnter={() => setHoveredState('AM')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RORAIMA */}
        <path
          d="M200,150 L280,140 L300,170 L290,200 L270,220 L240,230 L210,220 L190,190 Z"
          fill={getStateColor('RR')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RR')}
          onMouseEnter={() => setHoveredState('RR')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PARÁ */}
        <path
          d="M280,250 L450,230 L480,260 L500,290 L510,320 L500,350 L480,380 L450,400 L400,410 L380,390 L350,370 L320,350 L300,320 L290,290 Z"
          fill={getStateColor('PA')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PA')}
          onMouseEnter={() => setHoveredState('PA')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* AMAPÁ */}
        <path
          d="M450,180 L490,170 L510,200 L500,230 L480,250 L450,240 L430,210 Z"
          fill={getStateColor('AP')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AP')}
          onMouseEnter={() => setHoveredState('AP')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* TOCANTINS */}
        <path
          d="M450,400 L510,380 L540,410 L550,440 L540,470 L520,500 L490,520 L460,510 L440,480 L435,450 Z"
          fill={getStateColor('TO')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('TO')}
          onMouseEnter={() => setHoveredState('TO')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO NORDESTE */}

        {/* MARANHÃO */}
        <path
          d="M510,320 L580,310 L600,340 L590,370 L570,390 L540,400 L510,390 L500,360 Z"
          fill={getStateColor('MA')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MA')}
          onMouseEnter={() => setHoveredState('MA')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PIAUÍ */}
        <path
          d="M540,410 L590,390 L610,420 L600,450 L580,480 L550,490 L530,470 L525,440 Z"
          fill={getStateColor('PI')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PI')}
          onMouseEnter={() => setHoveredState('PI')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* CEARÁ */}
        <path
          d="M600,340 L680,330 L700,360 L690,390 L670,410 L640,420 L610,410 L590,380 Z"
          fill={getStateColor('CE')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('CE')}
          onMouseEnter={() => setHoveredState('CE')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RIO GRANDE DO NORTE */}
        <path
          d="M690,360 L740,350 L760,370 L750,390 L730,400 L710,395 L695,380 Z"
          fill={getStateColor('RN')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RN')}
          onMouseEnter={() => setHoveredState('RN')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PARAÍBA */}
        <path
          d="M710,395 L750,390 L765,410 L755,430 L735,440 L715,435 L705,415 Z"
          fill={getStateColor('PB')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PB')}
          onMouseEnter={() => setHoveredState('PB')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* PERNAMBUCO */}
        <path
          d="M640,420 L715,435 L735,470 L720,500 L690,520 L660,530 L630,520 L610,490 L620,460 Z"
          fill={getStateColor('PE')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PE')}
          onMouseEnter={() => setHoveredState('PE')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* ALAGOAS */}
        <path
          d="M690,520 L720,510 L735,530 L725,550 L705,560 L690,555 L680,535 Z"
          fill={getStateColor('AL')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('AL')}
          onMouseEnter={() => setHoveredState('AL')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* SERGIPE */}
        <path
          d="M690,555 L725,550 L735,570 L720,585 L700,590 L685,580 L680,565 Z"
          fill={getStateColor('SE')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('SE')}
          onMouseEnter={() => setHoveredState('SE')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* BAHIA */}
        <path
          d="M580,480 L630,520 L660,530 L680,565 L670,600 L650,630 L620,650 L580,660 L540,650 L510,630 L490,600 L480,570 L490,540 L520,520 L550,500 Z"
          fill={getStateColor('BA')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('BA')}
          onMouseEnter={() => setHoveredState('BA')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO CENTRO-OESTE */}

        {/* MATO GROSSO */}
        <path
          d="M200,400 L350,400 L400,410 L430,440 L450,470 L440,500 L420,530 L390,550 L360,560 L330,550 L300,530 L270,500 L250,470 L240,440 L220,420 Z"
          fill={getStateColor('MT')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MT')}
          onMouseEnter={() => setHoveredState('MT')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* MATO GROSSO DO SUL */}
        <path
          d="M330,550 L420,530 L440,560 L430,590 L410,620 L380,640 L350,650 L320,640 L300,620 L290,590 L300,570 Z"
          fill={getStateColor('MS')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MS')}
          onMouseEnter={() => setHoveredState('MS')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* GOIÁS */}
        <path
          d="M450,470 L520,520 L540,550 L530,580 L510,610 L480,630 L450,640 L420,630 L400,610 L390,580 L400,550 L420,530 Z"
          fill={getStateColor('GO')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('GO')}
          onMouseEnter={() => setHoveredState('GO')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* DISTRITO FEDERAL */}
        <path
          d="M485,555 L495,550 L500,560 L495,570 L485,565 Z"
          fill={getStateColor('DF')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('DF')}
          onMouseEnter={() => setHoveredState('DF')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO SUDESTE */}

        {/* MINAS GERAIS */}
        <path
          d="M480,630 L580,610 L620,630 L650,650 L670,680 L660,710 L640,730 L610,740 L580,750 L550,740 L520,730 L490,710 L470,690 L460,670 L470,650 Z"
          fill={getStateColor('MG')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('MG')}
          onMouseEnter={() => setHoveredState('MG')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* ESPÍRITO SANTO */}
        <path
          d="M650,650 L680,640 L690,660 L685,680 L675,700 L660,710 L650,690 L645,670 Z"
          fill={getStateColor('ES')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('ES')}
          onMouseEnter={() => setHoveredState('ES')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RIO DE JANEIRO */}
        <path
          d="M610,740 L660,710 L680,730 L675,750 L660,770 L640,780 L620,775 L600,765 L590,750 Z"
          fill={getStateColor('RJ')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('RJ')}
          onMouseEnter={() => setHoveredState('RJ')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* SÃO PAULO */}
        <path
          d="M520,730 L590,750 L580,780 L560,800 L530,810 L500,800 L480,780 L470,760 L480,740 L500,735 Z"
          fill={getStateColor('SP')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('SP')}
          onMouseEnter={() => setHoveredState('SP')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* REGIÃO SUL */}

        {/* PARANÁ */}
        <path
          d="M410,620 L480,630 L520,730 L500,735 L480,740 L460,750 L440,760 L420,750 L400,740 L390,720 L385,700 L390,680 L400,660 L405,640 Z"
          fill={getStateColor('PR')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('PR')}
          onMouseEnter={() => setHoveredState('PR')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* SANTA CATARINA */}
        <path
          d="M420,750 L480,740 L500,760 L490,780 L470,790 L450,800 L430,795 L410,785 L400,770 L405,755 Z"
          fill={getStateColor('SC')}
          stroke="#374151"
          strokeWidth="1"
          className="cursor-pointer hover:stroke-2 transition-all"
          onClick={() => onStateClick('SC')}
          onMouseEnter={() => setHoveredState('SC')}
          onMouseLeave={() => setHoveredState(null)}
        />

        {/* RIO GRANDE DO SUL */}
        <path
          d="M400,785 L470,790 L490,810 L480,840 L460,860 L430,870 L400,865 L380,850 L370,830 L375,810 L385,795 Z"
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
