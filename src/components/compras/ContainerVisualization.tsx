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
  // Calcular quantos containers são necessários baseado apenas no VOLUME
  const containersNeeded = Math.ceil(totalCBM / maxVolume);
  
  // Calcular detalhes de cada container
  const getContainerDetails = () => {
    const containers = [];
    let remainingVolume = totalCBM;
    
    for (let i = 0; i < containersNeeded; i++) {
      const containerVolume = Math.min(remainingVolume, maxVolume);
      const volumePercent = (containerVolume / maxVolume) * 100;
      
      // Calcular peso proporcional ao volume ocupado neste container
      const volumeRatio = containerVolume / totalCBM;
      const containerWeight = totalWeight * volumeRatio;
      const weightPercent = (containerWeight / maxWeight) * 100;
      
      const isFull = volumePercent >= 100;
      
      containers.push({
        index: i + 1,
        volumePercent,
        weightPercent,
        containerVolume,
        containerWeight,
        isFull,
        fillLevel: volumePercent // O fill level é sempre baseado no volume
      });
      
      remainingVolume -= containerVolume;
    }
    
    return containers;
  };
  
  const containers = getContainerDetails();
  // Sempre usar o último container que não está cheio (o que está sendo preenchido)
  const currentContainer = containers.find(c => !c.isFull) || containers[containers.length - 1];
  
  // Calcular altura do enchimento baseado no maior percentual do primeiro container
  const fillHeight = Math.min(currentContainer.fillLevel, 100);
  
  // Determinar cores baseadas nos percentuais
  const getVolumeColor = (percent: number = currentContainer.volumePercent) => {
    if (percent >= 100) return '#ef4444'; // red-500
    if (percent >= 80) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  const getWeightColor = (percent: number = currentContainer.weightPercent) => {
    if (percent >= 100) return '#ef4444'; // red-500
    if (percent >= 80) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 p-4">
        {/* Container 3D Visual */}
        <div className="relative flex-shrink-0">
          {/* Container Base - Isometric view */}
          <div className="relative w-48 h-32">
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
                      {Array.from({ length: Math.ceil((fillHeight / 100) * 8) }).map((_, i) => (
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
            <div className="absolute -top-6 left-0 right-0 text-center">
              <span className="inline-block bg-slate-700 text-white px-3 py-1 rounded-full text-xs font-mono">
                {containerType} - Container #{currentContainer.index}
              </span>
            </div>

          </div>
        </div>

        {/* Container Information */}
        <div className="flex-1 space-y-4">
          {/* Volume and Weight Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-4">
              {/* Mini container visual */}
              <div className="flex flex-col items-center min-w-max">
                <div className="w-12 h-8 rounded border-2 border-slate-400 relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-500"
                    style={{ height: `${currentContainer.fillLevel}%` }}
                  />
                </div>
                <span className="text-xs mt-1 font-medium text-slate-600 dark:text-slate-400">
                  Container #{currentContainer.index}
                </span>
              </div>
              
              {/* Volume info */}
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Volume: {currentContainer.containerVolume.toFixed(1)}m³ ({currentContainer.volumePercent.toFixed(1)}%)
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${currentContainer.volumePercent}%`,
                      backgroundColor: getVolumeColor(currentContainer.volumePercent)
                    }}
                  />
                </div>
              </div>
              
              {/* Weight info */}
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Peso: {currentContainer.containerWeight.toFixed(0)}kg ({currentContainer.weightPercent.toFixed(1)}%)
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${currentContainer.weightPercent}%`,
                      backgroundColor: getWeightColor(currentContainer.weightPercent)
                    }}
                  />
                </div>
              </div>
              
              {/* Percentage badge */}
              <div className="min-w-max">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getVolumeColor(currentContainer.volumePercent) }}>
                  {currentContainer.volumePercent.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* Summary info for multiple containers */}
            {containersNeeded > 1 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {containers.filter(c => c.isFull).length} containers cheios + 1 container em preenchimento
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ContainerVisualization;