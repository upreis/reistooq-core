import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ImageOff, Box } from 'lucide-react';

interface HoverableProductImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  fallbackImages?: string[];
  className?: string;
}

export const HoverableProductImage: React.FC<HoverableProductImageProps> = ({
  src,
  alt,
  size = 'md',
  fallbackImages = [],
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allImages = [src, ...fallbackImages].filter(Boolean) as string[];
  const currentImage = allImages[currentImageIndex];

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Animação suave para seguir o mouse
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isHovered && currentImage) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePosition, isHovered, currentImage]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setSmoothPosition({ x: e.clientX, y: e.clientY });
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleError = () => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  const showFallbackIcon = !currentImage || imageError;

  return (
    <>
      <div
        ref={containerRef}
        className={`relative ${sizeClasses[size]} shrink-0 overflow-hidden rounded-md border border-border bg-muted cursor-pointer ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Fallback icon */}
        <div className="absolute inset-0 grid place-items-center">
          {showFallbackIcon && (
            size === 'sm' ? (
              <ImageOff className={iconSizes[size] + ' text-muted-foreground'} />
            ) : (
              <Box className={iconSizes[size] + ' text-muted-foreground'} />
            )
          )}
        </div>
        
        {/* Actual image */}
        {currentImage && !imageError && (
          <img
            src={currentImage}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={handleError}
          />
        )}
      </div>

      {/* Floating preview via portal */}
      {isHovered && currentImage && !imageError && createPortal(
        <div
          className="pointer-events-none fixed z-[9999] overflow-hidden rounded-xl shadow-2xl"
          style={{
            left: 0,
            top: 0,
            transform: `translate3d(${smoothPosition.x + 20}px, ${smoothPosition.y - 100}px, 0)`,
            opacity: 1,
            transition: "transform 0.05s ease-out",
          }}
        >
          <div className="relative w-[200px] h-[200px] bg-background rounded-xl overflow-hidden shadow-xl border border-border">
            <img
              src={currentImage}
              alt={`Preview: ${alt}`}
              className="w-full h-full object-contain bg-background"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
