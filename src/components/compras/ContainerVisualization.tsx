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
      {/* Indicador de múltiplos containers - Melhorado */}
      {containersNeeded > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                📦 {containersNeeded} Containers necessários
              </span>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Volume total: {totalCBM.toFixed(1)}m³ | Peso total: {totalWeight.toFixed(0)}kg
            </div>
          </div>
          
          {/* Visualização apenas dos containers não cheios */}
          <div className="grid grid-cols-1 gap-3">
            {containers
              .filter(container => !container.isFull) // Mostrar apenas containers não cheios
              .map((container, index) => {
                const status = getContainerStatus(container);
                return (
                  <div key={container.index} className="flex items-center space-x-4 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                    {/* Mini container visual */}
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-8 rounded border-2 ${status.color} border-slate-400 relative overflow-hidden`}>
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-600 to-slate-400 transition-all duration-500"
                          style={{ height: `${container.fillLevel}%` }}
                        />
                      </div>
                      <span className="text-xs mt-1 font-medium text-slate-600 dark:text-slate-400">
                        Container #{container.index}
                      </span>
                    </div>
                    
                    {/* Detalhes do container */}
                    <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Volume:</span>
                        <div className="text-slate-600 dark:text-slate-400">
                          {container.containerVolume.toFixed(1)}m³ ({container.volumePercent.toFixed(1)}%)
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${container.volumePercent}%`,
                              backgroundColor: getVolumeColor(container.volumePercent)
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Peso:</span>
                        <div className="text-slate-600 dark:text-slate-400">
                          {container.containerWeight.toFixed(0)}kg ({container.weightPercent.toFixed(1)}%)
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${container.weightPercent}%`,
                              backgroundColor: getWeightColor(container.weightPercent)
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {/* Mostrar containers cheios de forma resumida */}
            {containers.filter(c => c.isFull).length > 0 && (
              <div className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-6 rounded bg-slate-600 border border-slate-400"></div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {containers.filter(c => c.isFull).length} containers cheios
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Resumo melhorado */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span>Eficiência de empacotamento:</span>
                <span className="font-medium">
                  Volume: {((totalCBM / (containersNeeded * maxVolume)) * 100).toFixed(1)}% | 
                  Peso: {((totalWeight / (containersNeeded * maxWeight)) * 100).toFixed(1)}%
                </span>
              </div>
              {/* Mostrar apenas informações do último container se não estiver cheio */}
              {containers.length > 0 && !containers[containers.length - 1].isFull && (
                <div className="mt-2 text-xs">
                  <span className="text-amber-600 dark:text-amber-400">
                    💡 Último container: {containers[containers.length - 1].fillLevel.toFixed(1)}% preenchido - Espaço disponível: {(100 - containers[containers.length - 1].fillLevel).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
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

      {/* Stats Grid - Aumentado */}
      <div className="grid grid-cols-2 gap-4">
        {/* Volume Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border min-w-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Volume</span>
            <span className={`text-sm font-bold ${currentContainer.volumePercent >= 100 ? 'text-red-600' : currentContainer.volumePercent >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {currentContainer.volumePercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {currentContainer.containerVolume.toFixed(1)} / {maxVolume} m³
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
                width: `${Math.min(currentContainer.volumePercent, 100)}%`,
                backgroundColor: getVolumeColor()
              }}
            />
          </div>
        </div>

        {/* Weight Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border min-w-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Peso</span>
            <span className={`text-sm font-bold ${currentContainer.weightPercent >= 100 ? 'text-red-600' : currentContainer.weightPercent >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {currentContainer.weightPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {currentContainer.containerWeight.toFixed(0)} / {maxWeight.toLocaleString()} kg
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
                width: `${Math.min(currentContainer.weightPercent, 100)}%`,
                backgroundColor: getWeightColor(currentContainer.weightPercent)
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
    </div>
  );
};

export default ContainerVisualization;