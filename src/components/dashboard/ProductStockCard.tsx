import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ProductWithStock } from '@/hooks/useEstoqueProducts';
import { Package } from 'lucide-react';

interface ProductStockCardProps {
  products: ProductWithStock[];
  title: string;
  type: 'high' | 'low';
  cardWidth?: number;
  cardHeight?: number;
  className?: string;
}

export const ProductStockCard: React.FC<ProductStockCardProps> = ({
  products,
  title,
  type,
  cardWidth = 220,
  cardHeight = 300,
  className = ''
}) => {
  const cardStackRef = useRef<HTMLDivElement>(null);
  const isSwiping = useRef(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const [cardOrder, setCardOrder] = useState<number[]>(() =>
    Array.from({ length: products.length }, (_, i) => i)
  );

  const getDurationFromCSS = useCallback((): number => 300, []);

  const getCards = useCallback((): HTMLElement[] => {
    if (!cardStackRef.current) return [];
    return [...cardStackRef.current.querySelectorAll('.stock-card')] as HTMLElement[];
  }, []);

  const getActiveCard = useCallback((): HTMLElement | null => {
    const cards = getCards();
    return cards[0] || null;
  }, [getCards]);

  const updatePositions = useCallback(() => {
    const cards = getCards();
    cards.forEach((card, i) => {
      card.style.setProperty('--i', (i + 1).toString());
      card.style.setProperty('--swipe-x', '0px');
      card.style.setProperty('--swipe-rotate', '0deg');
      card.style.opacity = '1';
    });
  }, [getCards]);

  const applySwipeStyles = useCallback((deltaX: number) => {
    const card = getActiveCard();
    if (!card) return;
    card.style.setProperty('--swipe-x', `${deltaX}px`);
    card.style.setProperty('--swipe-rotate', `${deltaX * 0.2}deg`);
    card.style.opacity = (1 - Math.min(Math.abs(deltaX) / 100, 1) * 0.75).toString();
  }, [getActiveCard]);

  const handleStart = useCallback((clientX: number) => {
    if (isSwiping.current) return;
    isSwiping.current = true;
    startX.current = clientX;
    currentX.current = clientX;
    const card = getActiveCard();
    if (card) card.style.transition = 'none';
  }, [getActiveCard]);

  const handleEnd = useCallback(() => {
    if (!isSwiping.current) return;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    const deltaX = currentX.current - startX.current;
    const threshold = 50;
    const duration = getDurationFromCSS();
    const card = getActiveCard();

    if (card) {
      card.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;

      if (Math.abs(deltaX) > threshold) {
        const direction = Math.sign(deltaX);
        card.style.setProperty('--swipe-x', `${direction * 300}px`);
        card.style.setProperty('--swipe-rotate', `${direction * 20}deg`);

        setTimeout(() => {
          if (getActiveCard() === card) {
            card.style.setProperty('--swipe-rotate', `${-direction * 20}deg`);
          }
        }, duration * 0.5);

        setTimeout(() => {
          setCardOrder(prev => {
            if (prev.length === 0) return [];
            return [...prev.slice(1), prev[0]];
          });
        }, duration);
      } else {
        applySwipeStyles(0);
      }
    }

    isSwiping.current = false;
    startX.current = 0;
    currentX.current = 0;
  }, [getDurationFromCSS, getActiveCard, applySwipeStyles]);

  const handleMove = useCallback((clientX: number) => {
    if (!isSwiping.current) return;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(() => {
      currentX.current = clientX;
      const deltaX = currentX.current - startX.current;
      applySwipeStyles(deltaX);

      if (Math.abs(deltaX) > 50) {
        handleEnd();
      }
    });
  }, [applySwipeStyles, handleEnd]);

  useEffect(() => {
    const cardStackElement = cardStackRef.current;
    if (!cardStackElement) return;

    const handlePointerDown = (e: PointerEvent) => {
      handleStart(e.clientX);
    };
    const handlePointerMove = (e: PointerEvent) => {
      handleMove(e.clientX);
    };
    const handlePointerUp = () => {
      handleEnd();
    };

    cardStackElement.addEventListener('pointerdown', handlePointerDown);
    cardStackElement.addEventListener('pointermove', handlePointerMove);
    cardStackElement.addEventListener('pointerup', handlePointerUp);

    return () => {
      cardStackElement.removeEventListener('pointerdown', handlePointerDown);
      cardStackElement.removeEventListener('pointermove', handlePointerMove);
      cardStackElement.removeEventListener('pointerup', handlePointerUp);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleStart, handleMove, handleEnd]);

  useEffect(() => {
    updatePositions();
  }, [cardOrder, updatePositions]);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {type === 'high' && <h3 className="text-sm font-semibold mb-3">{title}</h3>}
      <section
        className={`relative grid place-content-center select-none ${className}`}
        ref={cardStackRef}
        style={{
          width: cardWidth + 32,
          height: cardHeight + 32,
          touchAction: 'none',
          transformStyle: 'preserve-3d',
          '--card-perspective': '700px',
          '--card-z-offset': '12px',
          '--card-y-offset': '7px',
          '--card-max-z-index': products.length.toString(),
          '--card-swap-duration': '0.3s',
        } as React.CSSProperties}
      >
        {cardOrder.map((originalIndex, displayIndex) => {
          const product = products[originalIndex];
          if (!product) return null;

          return (
            <article
              key={`${product.id}-${originalIndex}`}
              className="stock-card absolute cursor-grab active:cursor-grabbing
                         place-self-center border-2 border-border rounded-xl
                         shadow-md overflow-hidden will-change-transform bg-background"
              style={{
                '--i': (displayIndex + 1).toString(),
                zIndex: products.length - displayIndex,
                width: cardWidth,
                height: cardHeight,
                transform: `perspective(var(--card-perspective))
                           translateZ(calc(-1 * var(--card-z-offset) * var(--i)))
                           translateY(calc(var(--card-y-offset) * var(--i)))
                           translateX(var(--swipe-x, 0px))
                           rotateY(var(--swipe-rotate, 0deg))`
              } as React.CSSProperties}
            >
              <div className="w-full h-full p-4 flex flex-col">
                {/* Imagem do produto */}
                <div className="w-full h-48 bg-muted rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  {product.url_imagem ? (
                    <img
                      src={product.url_imagem}
                      alt={product.nome}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <Package className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                {/* Informações do produto */}
                <div className="flex-1 space-y-2">
                  <h4 className="text-xs font-semibold truncate">{product.nome}</h4>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">SKU:</span>
                      <span className="font-mono font-medium">{product.sku_interno}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Quantidade:</span>
                      <span className={`font-bold text-lg ${
                        type === 'high' 
                          ? 'text-green-500' 
                          : product.quantidade < 10 
                            ? 'text-destructive' 
                            : 'text-amber-500'
                      }`}>
                        {product.quantidade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge indicador */}
                <div className={`mt-2 text-center text-xs font-medium py-1 px-2 rounded-full ${
                  type === 'high' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {type === 'high' ? 'Alto Estoque' : 'Baixo Estoque'}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
