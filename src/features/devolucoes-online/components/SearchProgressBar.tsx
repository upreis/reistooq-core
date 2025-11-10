/**
 * 📊 BARRA DE PROGRESSO - BUSCA DE DEVOLUÇÕES
 * Indicador visual no topo da página durante buscas
 */

import { useEffect, useState } from 'react';

interface SearchProgressBarProps {
  isActive: boolean;
}

export function SearchProgressBar({ isActive }: SearchProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    // Iniciar em 0
    setProgress(0);

    // Simular progresso incremental
    const intervals = [
      { delay: 100, value: 10 },
      { delay: 300, value: 25 },
      { delay: 600, value: 40 },
      { delay: 1000, value: 60 },
      { delay: 1500, value: 75 },
      { delay: 2000, value: 85 },
      { delay: 3000, value: 92 },
      { delay: 4000, value: 95 },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    intervals.forEach(({ delay, value }) => {
      const timeout = setTimeout(() => {
        setProgress(value);
      }, delay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isActive]);

  // Completar quando terminar
  useEffect(() => {
    if (!isActive && progress > 0) {
      setProgress(100);
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isActive, progress]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1">
      <div
        className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)',
        }}
      >
        {/* Efeito de brilho animado */}
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}
