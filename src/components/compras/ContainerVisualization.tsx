import React from 'react';

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
  // Calcular quantos containers são necessários
  const volumeRatio = totalCBM / maxVolume;
  const weightRatio = totalWeight / maxWeight;
  const containersNeeded = Math.ceil(Math.max(volumeRatio, weightRatio));
  
  // Debug logs para identificar o problema
  console.log('🐛 [DEBUG] Container calculation:', {
    totalCBM,
    maxVolume,
    volumeRatio,
    totalWeight,
    maxWeight,
    weightRatio,
    containersNeeded,
    containerType
  });
  
  // Para o container atual (primeiro), limitar o percentual a 100%
  const currentContainerVolumePercentage = Math.min(volumePercentage, 100);
  const currentContainerWeightPercentage = Math.min(weightPercentage, 100);
  
  // Calcular altura do enchimento baseado na cubagem
  const fillHeight = currentContainerVolumePercentage;
  
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
    <div className="space-y-6">
      {/* Indicador de múltiplos containers */}
      {containersNeeded > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                📦 {containersNeeded} Containers necessários
              </span>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Excesso: Volume {((totalCBM / maxVolume - 1) * 100).toFixed(1)}% | Peso {((totalWeight / maxWeight - 1) * 100).toFixed(1)}%
            </div>
          </div>
          
          {/* Mini containers indicator */}
          <div className="flex items-center space-x-2 mt-3">
            {Array.from({ length: containersNeeded }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-8 h-6 rounded border-2 ${index === 0 ? 'bg-blue-500 border-blue-600' : 'bg-slate-300 border-slate-400'} relative`}>
                  {index === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded" 
                         style={{ height: `${fillHeight}%` }} />
                  )}
                </div>
                <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-8 p-4">
        {/* Container 3D Visual - Aumentado */}
        <div className="relative">
        {/* Container Base - Isometric view */}
        <div className="relative w-64 h-40">
          {/* Container walls */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500 border-2 border-slate-600 rounded-lg shadow-lg transform rotate-12 skew-y-3">
            {/* Container floor */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-600 rounded-b-lg"></div>
            
            {/* Fill level animation */}
            <div 
              className="absolute bottom-0 left-0 right-0 rounded-b-lg transition-all duration-1000 ease-out"
              style={{
                height: `${fillHeight}%`,
                background: `linear-gradient(to top, ${getVolumeColor()}CC, ${getVolumeColor()}88, ${getVolumeColor()}44)`,
                boxShadow: `inset 0 0 20px ${getVolumeColor()}66`
              }}
            >
              {/* Cargo blocks simulation */}
              {fillHeight > 0 && (
                <div className="absolute inset-0 opacity-60">
                  <div className="grid grid-cols-4 gap-1 p-2 h-full">
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

            {/* Container door */}
            <div className="absolute right-0 top-0 w-1 h-full bg-slate-700 rounded-r-lg"></div>
            <div className="absolute right-1 top-2 bottom-2 w-0.5 bg-slate-800"></div>
          </div>

          {/* Container label */}
          <div className="absolute -top-8 left-0 right-0 text-center">
            <span className="inline-block bg-slate-700 text-white px-3 py-1 rounded-full text-sm font-mono">
              {containerType}
            </span>
          </div>

          {/* Volume indicator */}
          <div className="absolute -left-16 top-0 bottom-0 flex flex-col justify-end">
            <div className="w-5 bg-slate-200 rounded-full border border-slate-400 relative">
              <div 
                className="w-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  height: `${fillHeight}%`,
                  backgroundColor: getVolumeColor()
                }}
              />
              <div className="absolute -left-10 top-1/2 transform -translate-y-1/2">
                <span className="text-sm font-medium text-slate-600">VOL</span>
              </div>
            </div>
          </div>

          {/* Weight indicator */}
          <div className="absolute -right-16 top-0 bottom-0 flex flex-col justify-end">
            <div className="w-5 bg-slate-200 rounded-full border border-slate-400 relative">
              <div 
                className="w-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  height: `${weightPercentage}%`,
                  backgroundColor: getWeightColor()
                }}
              />
              <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
                <span className="text-sm font-medium text-slate-600">PESO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Aumentado */}
      <div className="grid grid-cols-2 gap-4">
        {/* Volume Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border min-w-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Volume</span>
            <span className={`text-sm font-bold ${volumePercentage >= 100 ? 'text-red-600' : volumePercentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {volumePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {Math.min(totalCBM, maxVolume).toFixed(1)} / {maxVolume} m³
            {containersNeeded > 1 && (
              <span className="text-blue-600 dark:text-blue-400 ml-1">
                (Container 1/{containersNeeded})
              </span>
            )}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${currentContainerVolumePercentage}%`,
                backgroundColor: getVolumeColor()
              }}
            />
          </div>
        </div>

        {/* Weight Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border min-w-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Peso</span>
            <span className={`text-sm font-bold ${currentContainerWeightPercentage >= 100 ? 'text-red-600' : currentContainerWeightPercentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {currentContainerWeightPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {Math.min(totalWeight, maxWeight).toFixed(0)} / {maxWeight.toLocaleString()} kg
            {containersNeeded > 1 && (
              <span className="text-blue-600 dark:text-blue-400 ml-1">
                (Container 1/{containersNeeded})
              </span>
            )}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${currentContainerWeightPercentage}%`,
                backgroundColor: getWeightColor()
              }}
            />
          </div>
        </div>
      </div>

        {/* Status Messages */}
        <div className="flex flex-col gap-2">
          {containersNeeded > 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  📦 Múltiplos containers necessários ({containersNeeded} containers)
                </span>
              </div>
            </div>
          )}

          {(currentContainerVolumePercentage >= 80 || currentContainerWeightPercentage >= 80) && containersNeeded === 1 && (
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
    </div>
  );
};

export default ContainerVisualization;