import React from 'react';
import containerImage from '@/assets/container-3d.png';

interface ContainerVisualizationProps {
  containerType: string;
  volumePercentage: number;
  weightPercentage: number;
  totalCBM: number;
  totalWeight: number;
  maxVolume: number;
  maxWeight: number;
}

const ContainerVisualization: React.FC<ContainerVisualizationProps> = ({
  containerType,
  volumePercentage,
  weightPercentage,
  totalCBM,
  totalWeight,
  maxVolume,
  maxWeight
}) => {
  // Calcular altura do enchimento baseado na cubagem
  const fillHeight = Math.min(volumePercentage, 100);
  
  // Determinar cores baseadas nos percentuais
  const getVolumeColor = () => {
    if (volumePercentage >= 100) return '#ef4444'; // red-500
    if (volumePercentage >= 80) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  const getWeightColor = () => {
    if (weightPercentage >= 100) return '#ef4444'; // red-500
    if (weightPercentage >= 80) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      {/* Container 3D Visual */}
      <div className="relative">
        {/* Container Base - Real container image */}
        <div className="relative w-64 h-40">
          {/* Container image */}
          <img 
            src={containerImage} 
            alt="Container 3D" 
            className="w-full h-full object-contain"
          />
          
          {/* Fill level overlay */}
          <div 
            className="absolute bottom-8 left-8 right-16 transition-all duration-1000 ease-out rounded-sm"
            style={{
              height: `${(fillHeight / 100) * 60}%`,
              background: `linear-gradient(to top, ${getVolumeColor()}CC, ${getVolumeColor()}88, ${getVolumeColor()}44)`,
              boxShadow: `inset 0 0 10px ${getVolumeColor()}66`,
              transformOrigin: 'bottom',
              transform: 'perspective(400px) rotateX(-10deg) rotateY(20deg)'
            }}
          >
            {/* Cargo blocks simulation */}
            {fillHeight > 0 && (
              <div className="absolute inset-0 opacity-70">
                <div className="grid grid-cols-6 gap-1 p-1 h-full">
                  {Array.from({ length: Math.ceil((fillHeight / 100) * 12) }).map((_, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-sm border border-amber-700 animate-fade-in"
                      style={{ 
                        animationDelay: `${i * 100}ms`,
                        opacity: 0.8 
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Container label */}
          <div className="absolute -top-8 left-0 right-0 text-center">
            <span className="inline-block bg-slate-700 text-white px-3 py-1 rounded-full text-xs font-mono">
              {containerType}
            </span>
          </div>

          {/* Volume indicator */}
          <div className="absolute -left-16 top-4 bottom-8 flex flex-col justify-end">
            <div className="w-4 bg-slate-200 rounded-full border border-slate-400 relative h-24">
              <div 
                className="w-full rounded-full transition-all duration-1000 ease-out absolute bottom-0"
                style={{
                  height: `${fillHeight}%`,
                  backgroundColor: getVolumeColor()
                }}
              />
              <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
                <span className="text-xs font-medium text-slate-600">VOL</span>
              </div>
            </div>
          </div>

          {/* Weight indicator */}
          <div className="absolute -right-16 top-4 bottom-8 flex flex-col justify-end">
            <div className="w-4 bg-slate-200 rounded-full border border-slate-400 relative h-24">
              <div 
                className="w-full rounded-full transition-all duration-1000 ease-out absolute bottom-0"
                style={{
                  height: `${weightPercentage}%`,
                  backgroundColor: getWeightColor()
                }}
              />
              <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                <span className="text-xs font-medium text-slate-600">PESO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {/* Volume Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Volume</span>
            <span className={`text-sm font-bold ${volumePercentage >= 100 ? 'text-red-600' : volumePercentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {volumePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {totalCBM.toFixed(1)} / {maxVolume} m³
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(volumePercentage, 100)}%`,
                backgroundColor: getVolumeColor()
              }}
            />
          </div>
        </div>

        {/* Weight Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Peso</span>
            <span className={`text-sm font-bold ${weightPercentage >= 100 ? 'text-red-600' : weightPercentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {weightPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {totalWeight.toFixed(0)} / {maxWeight.toLocaleString()} kg
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(weightPercentage, 100)}%`,
                backgroundColor: getWeightColor()
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {(volumePercentage >= 100 || weightPercentage >= 100) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 w-full max-w-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              ⚠️ Limite {volumePercentage >= 100 && weightPercentage >= 100 ? 'de volume e peso' : volumePercentage >= 100 ? 'de volume' : 'de peso'} excedido!
            </span>
          </div>
        </div>
      )}

      {(volumePercentage >= 80 || weightPercentage >= 80) && (volumePercentage < 100 && weightPercentage < 100) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 w-full max-w-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              ⚡ Aproximando-se do limite
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainerVisualization;