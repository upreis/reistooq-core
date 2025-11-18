import { RefObject } from 'react';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';

interface CustomHorizontalScrollbarProps {
  scrollWidth: number;
  containerRef: RefObject<HTMLDivElement>;
  className?: string;
}

/**
 * 📜 Scrollbar Horizontal Customizado
 * 
 * Componente visual de scrollbar sempre visível e clicável
 * - Track: barra de fundo
 * - Thumb: parte arrastável (cor primary)
 * - Sincronização automática com tabela via hook
 * - Navegação por teclado (acessibilidade)
 * - Performance otimizada com debounce
 */
export function CustomHorizontalScrollbar({ 
  scrollWidth, 
  containerRef,
  className = ''
}: CustomHorizontalScrollbarProps) {
  const { 
    thumbPosition, 
    thumbWidth, 
    handleThumbMouseDown,
    handleKeyDown,
    isDragging,
    showScrollbar 
  } = useCustomScrollbar({ containerRef, scrollWidth });

  // Não renderiza se não há necessidade de scroll
  if (!showScrollbar || thumbWidth === 0) {
    return null;
  }

  return (
    <div 
      className={`relative h-4 bg-muted/20 border-b ${className}`}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      role="region"
      aria-label="Barra de rolagem horizontal"
    >
      {/* Track - Barra de fundo */}
      <div 
        className="absolute inset-0 bg-muted/40 transition-colors duration-150"
        aria-hidden="true"
      />

      {/* Thumb - Parte arrastável */}
      <div
        className={`
          absolute top-0 h-full rounded-sm
          transition-all duration-150 ease-out
          ${isDragging 
            ? 'bg-primary shadow-lg' 
            : 'bg-primary/60 hover:bg-primary/80 hover:shadow-md'
          }
        `}
        style={{
          left: `${thumbPosition}px`,
          width: `${thumbWidth}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          minWidth: '50px', // Mínimo para usabilidade
          // ✅ CORREÇÃO PROBLEMA 3: Transform unificado (scale + translateY)
          transform: isDragging 
            ? 'translateY(-1px) scale(1.05)' 
            : 'translateY(0) scale(1)',
        }}
        onMouseDown={handleThumbMouseDown}
        onKeyDown={handleKeyDown}
        role="scrollbar"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(thumbPosition)}
        aria-valuemin={0}
        aria-valuemax={Math.round(containerRef.current?.clientWidth || 0)}
        aria-label="Arraste para rolar horizontalmente ou use as setas do teclado"
        tabIndex={0}
      >
        {/* Indicador visual central (3 linhas verticais) */}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none">
          <div className={`w-0.5 h-3 rounded-full transition-colors ${
            isDragging ? 'bg-primary-foreground/60' : 'bg-primary-foreground/40'
          }`} />
          <div className={`w-0.5 h-3 rounded-full transition-colors ${
            isDragging ? 'bg-primary-foreground/60' : 'bg-primary-foreground/40'
          }`} />
          <div className={`w-0.5 h-3 rounded-full transition-colors ${
            isDragging ? 'bg-primary-foreground/60' : 'bg-primary-foreground/40'
          }`} />
        </div>

        {/* Sombra extra ao arrastar para feedback visual */}
        {isDragging && (
          <div className="absolute inset-0 rounded-sm shadow-[0_0_12px_rgba(var(--primary)/0.4)] pointer-events-none" />
        )}
      </div>

      {/* Tooltip de instruções ao fazer hover (accessibility) */}
      <div className="sr-only" aria-live="polite">
        Use as setas do teclado (← →) ou arraste o thumb para rolar a tabela horizontalmente
      </div>
    </div>
  );
}
