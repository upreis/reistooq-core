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
  const currentContainer = containers[0]; // Primeiro container para a visualização principal
  
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

  const getContainerStatus = (container: any) => {
    if (container.isFull) {
      return { status: 'cheio', color: 'bg-slate-600', text: 'Cheio' };
    } else {
      const percentage = container.volumePercent;
      if (percentage >= 80) return { status: 'quase-cheio', color: 'bg-amber-500', text: `${percentage.toFixed(1)}%` };
      return { status: 'parcial', color: 'bg-blue-500', text: `${percentage.toFixed(1)}%` };
    }
  };

  return (
    <div className="space-y-6">

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
              {containerType} - Container #1
            </span>
          </div>

          {/* Volume indicator */}
          <div className="absolute -left-16 top-0 bottom-0 flex flex-col justify-end">
            <div className="w-5 bg-slate-200 rounded-full border border-slate-400 relative">
              <div 
                className="w-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  height: `${Math.min(currentContainer.volumePercent, 100)}%`,
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
                  height: `${Math.min(currentContainer.weightPercent, 100)}%`,
                  backgroundColor: getWeightColor(currentContainer.weightPercent)
                }}
              />
              <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
                <span className="text-sm font-medium text-slate-600">PESO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

        {/* Status Messages */}
        <div className="flex flex-col gap-2">
          {containersNeeded > 1 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
              {/* Mostrar apenas o último container não cheio */}
              {(() => {
                const lastIncompleteContainer = containers.find(c => !c.isFull) || containers[containers.length - 1];
                const fullContainersCount = containers.filter(c => c.isFull).length;
                
                return (
                  <div className="flex items-center space-x-4">
                    {/* Mini container visual */}
                    <div className="flex flex-col items-center min-w-max">
                      <div className="w-12 h-8 rounded border-2 border-slate-400 relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-500"
                          style={{ height: `${lastIncompleteContainer.fillLevel}%` }}
                        />
                      </div>
                      <span className="text-xs mt-1 font-medium text-slate-600 dark:text-slate-400">
                        Container #{lastIncompleteContainer.index}
                      </span>
                    </div>
                    
                    {/* Volume info */}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Volume: {lastIncompleteContainer.containerVolume.toFixed(1)}m³ ({lastIncompleteContainer.volumePercent.toFixed(1)}%)
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${lastIncompleteContainer.volumePercent}%`,
                            backgroundColor: getVolumeColor(lastIncompleteContainer.volumePercent)
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Weight info */}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Peso: {lastIncompleteContainer.containerWeight.toFixed(0)}kg ({lastIncompleteContainer.weightPercent.toFixed(1)}%)
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${lastIncompleteContainer.weightPercent}%`,
                            backgroundColor: getWeightColor(lastIncompleteContainer.weightPercent)
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Percentage badge */}
                    <div className="min-w-max">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: getVolumeColor(lastIncompleteContainer.volumePercent) }}>
                        {lastIncompleteContainer.volumePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
              
              {/* Summary info */}
              {containers.filter(c => c.isFull).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {containers.filter(c => c.isFull).length} containers cheios + 1 container em preenchimento
                  </div>
                </div>
              )}
            </div>
          )}

          {(currentContainer.volumePercent >= 80 || currentContainer.weightPercent >= 80) && containersNeeded === 1 && (
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

export default ContainerVisualization;