import React, { useState, useRef, useEffect } from 'react';
import containerSvg from '@/assets/container.svg';

interface ContainerSvgProps {
  containerType: string;
  volumePercentage: number;
  weightPercentage: number;
  totalCBM: number;
  totalWeight: number;
  maxVolume: number;
  maxWeight: number;
}

const ContainerSvg: React.FC<ContainerSvgProps> = ({
  containerType,
  volumePercentage,
  weightPercentage,
  totalCBM,
  totalWeight,
  maxVolume,
  maxWeight
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [fillHeight, setFillHeight] = useState(0);
  
  // Calcular altura do enchimento baseado na porcentagem de volume
  const targetFillHeight = Math.min(volumePercentage, 100);
  
  useEffect(() => {
    // Animar o enchimento
    const timer = setTimeout(() => {
      setFillHeight(targetFillHeight);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [targetFillHeight]);
  
  // Determinar cores baseadas nos percentuais
  const getVolumeColor = (percent: number = volumePercentage) => {
    if (percent >= 100) return '#ef4444'; // red-500
    if (percent >= 80) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  const getWeightColor = (percent: number = weightPercentage) => {
    if (percent >= 100) return '#ef4444'; // red-500
    if (percent >= 80) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 p-4">
        {/* Container SVG Interativo */}
        <div className="relative flex-shrink-0">
          <div className="relative w-96 h-64">
            {/* SVG Container */}
            <svg
              ref={svgRef}
              className="w-full h-full"
              viewBox="0 0 1050 749.999995"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Definições para gradientes e efeitos */}
              <defs>
                <linearGradient id="fillGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop 
                    offset="0%" 
                    style={{ stopColor: getVolumeColor(), stopOpacity: 0.9 }} 
                  />
                  <stop 
                    offset="50%" 
                    style={{ stopColor: getVolumeColor(), stopOpacity: 0.7 }} 
                  />
                  <stop 
                    offset="100%" 
                    style={{ stopColor: getVolumeColor(), stopOpacity: 0.5 }} 
                  />
                </linearGradient>
                
                <linearGradient id="containerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#cbd5e1', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
                </linearGradient>
                
                {/* Máscara para o container */}
                <clipPath id="containerClip">
                  <rect x="100" y="150" width="850" height="450" rx="10" />
                </clipPath>
              </defs>
              
              {/* Container base */}
              <rect
                x="100"
                y="150"
                width="850"
                height="450"
                rx="10"
                fill="url(#containerGradient)"
                stroke="#475569"
                strokeWidth="3"
                className="drop-shadow-lg"
              />
              
              {/* Efeito de profundidade */}
              <rect
                x="105"
                y="155"
                width="840"
                height="440"
                rx="8"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2"
                opacity="0.6"
              />
              
              {/* Enchimento animado */}
              <rect
                x="100"
                y={150 + (450 * (100 - fillHeight) / 100)}
                width="850"
                height={450 * fillHeight / 100}
                rx="10"
                fill="url(#fillGradient)"
                clipPath="url(#containerClip)"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 20px ${getVolumeColor()}66)`
                }}
              />
              
              {/* Efeito de líquido ondulando */}
              {fillHeight > 0 && (
                <ellipse
                  cx="525"
                  cy={150 + (450 * (100 - fillHeight) / 100)}
                  rx="425"
                  ry="20"
                  fill={getVolumeColor()}
                  opacity="0.6"
                  className="animate-pulse"
                />
              )}
              
              {/* Porta do container */}
              <rect
                x="940"
                y="160"
                width="8"
                height="430"
                fill="#374151"
                rx="2"
              />
              
              {/* Detalhes da porta */}
              <rect
                x="945"
                y="280"
                width="3"
                height="190"
                fill="#1f2937"
                rx="1"
              />
              
              {/* Label do container */}
              <rect
                x="400"
                y="100"
                width="250"
                height="40"
                rx="20"
                fill="#374151"
              />
              <text
                x="525"
                y="125"
                textAnchor="middle"
                fill="white"
                fontSize="16"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {containerType}
              </text>
            </svg>
            
            {/* Indicadores laterais */}
            <div className="absolute -left-16 top-0 bottom-0 flex flex-col justify-end">
              <div className="w-6 bg-slate-200 rounded-full border border-slate-400 relative h-48">
                <div 
                  className="w-full rounded-full transition-all duration-1000 ease-out absolute bottom-0"
                  style={{
                    height: `${Math.min(volumePercentage, 100)}%`,
                    backgroundColor: getVolumeColor()
                  }}
                />
                <div className="absolute -left-12 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs font-medium text-slate-600">VOL</span>
                </div>
              </div>
            </div>

            <div className="absolute -right-16 top-0 bottom-0 flex flex-col justify-end">
              <div className="w-6 bg-slate-200 rounded-full border border-slate-400 relative h-48">
                <div 
                  className="w-full rounded-full transition-all duration-1000 ease-out absolute bottom-0"
                  style={{
                    height: `${Math.min(weightPercentage, 100)}%`,
                    backgroundColor: getWeightColor(weightPercentage)
                  }}
                />
                <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs font-medium text-slate-600">PESO</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Container */}
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-4">
              {/* Mini visual do container */}
              <div className="flex flex-col items-center min-w-max">
                <div className="w-16 h-10 rounded border-2 border-slate-400 relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t transition-all duration-500"
                    style={{ 
                      height: `${fillHeight}%`,
                      backgroundColor: getVolumeColor()
                    }}
                  />
                </div>
                <span className="text-xs mt-1 font-medium text-slate-600 dark:text-slate-400">
                  {containerType}
                </span>
              </div>
              
              {/* Info de volume */}
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Volume: {totalCBM.toFixed(1)}m³ ({volumePercentage.toFixed(1)}%)
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${volumePercentage}%`,
                      backgroundColor: getVolumeColor(volumePercentage)
                    }}
                  />
                </div>
              </div>
              
              {/* Info de peso */}
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Peso: {totalWeight.toFixed(0)}kg ({weightPercentage.toFixed(1)}%)
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${weightPercentage}%`,
                      backgroundColor: getWeightColor(weightPercentage)
                    }}
                  />
                </div>
              </div>
              
              {/* Badge de porcentagem */}
              <div className="min-w-max">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getVolumeColor(volumePercentage) }}>
                  {volumePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens de status */}
      <div className="flex flex-col gap-2">
        {(volumePercentage >= 80 || weightPercentage >= 80) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                ⚡ Aproximando-se do limite
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerSvg;