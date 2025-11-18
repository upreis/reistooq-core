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
    >
      {/* Track - Barra de fundo */}
      <div 
        className="absolute inset-0 bg-muted/40"
        aria-label="Scrollbar track"
      />

      {/* Thumb - Parte arrastável */}
      <div
        className={`
          absolute top-0 h-full rounded
          transition-colors duration-150
          ${isDragging 
            ? 'bg-primary shadow-lg' 
            : 'bg-primary/60 hover:bg-primary/80'
          }
        `}
        style={{
          left: `${thumbPosition}px`,
          width: `${thumbWidth}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          minWidth: '50px' // Mínimo para usabilidade
        }}
        onMouseDown={handleThumbMouseDown}
        role="scrollbar"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(thumbPosition)}
        aria-valuemin={0}
        aria-valuemax={Math.round(containerRef.current?.clientWidth || 0)}
        tabIndex={0}
      >
        {/* Indicador visual central (3 linhas) */}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none">
          <div className="w-0.5 h-3 bg-primary-foreground/40 rounded-full" />
          <div className="w-0.5 h-3 bg-primary-foreground/40 rounded-full" />
          <div className="w-0.5 h-3 bg-primary-foreground/40 rounded-full" />
        </div>
      </div>

      {/* Debug info (remover em produção) */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded shadow-lg pointer-events-none">
          Arrastando scrollbar
        </div>
      )}
    </div>
  );
}
