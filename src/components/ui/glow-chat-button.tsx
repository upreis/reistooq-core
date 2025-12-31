import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface GlowChatButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isPulsing?: boolean;
}

const GlowChatButton = ({ children, onClick, className, isPulsing }: GlowChatButtonProps) => {
  const id = useId().replace(/:/g, '');
  const filters = {
    unopaq: `unopaq-${id}`,
    unopaq2: `unopaq2-${id}`,
    unopaq3: `unopaq3-${id}`,
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {/* SVG Filters */}
      <svg className="absolute w-0 h-0">
        <filter id={filters.unopaq}>
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 0" />
        </filter>
        <filter id={filters.unopaq2}>
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 9 0" />
        </filter>
        <filter id={filters.unopaq3}>
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 0" />
        </filter>
      </svg>

      {/* Hidden Button for accessibility */}
      <button
        onClick={onClick}
        className="absolute inset-0 z-10 opacity-0 cursor-pointer rounded-full"
        aria-label="Abrir assistente"
      />

      {/* Backdrop */}
      <div
        className="absolute rounded-full"
        style={{
          inset: '-1px',
          background: 'hsl(var(--background))',
        }}
      />

      {/* Button Container */}
      <div
        className="relative w-14 h-14 flex items-center justify-center"
        style={{
          filter: `url(#${filters.unopaq})`,
        }}
      >
        {/* Outer Glow Layer */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            filter: 'blur(4px)',
          }}
        >
          <div
            className={cn(
              "absolute rounded-full",
              isPulsing && "animate-[woah_3s_ease-in-out_infinite]"
            )}
            style={{
              inset: '-100%',
              background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary)/0.6), hsl(var(--primary)), hsl(var(--primary)/0.6), hsl(var(--primary)))',
              animation: isPulsing 
                ? 'speen 4s linear infinite, woah 3s ease-in-out infinite' 
                : 'speen 4s linear infinite',
            }}
          />
        </div>

        {/* Middle Glow Layer */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            inset: '1px',
            filter: `blur(1.5px) url(#${filters.unopaq2})`,
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: '-100%',
              background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary)/0.4), hsl(var(--primary)), hsl(var(--primary)/0.4), hsl(var(--primary)))',
              animation: 'speen 4s linear infinite',
            }}
          />
        </div>

        {/* Button Border */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            inset: '2px',
            filter: `url(#${filters.unopaq3})`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: 'hsl(var(--background))',
            }}
          >
            {/* Inner Glow Layer */}
            <div
              className="absolute rounded-full overflow-hidden"
              style={{
                inset: '-1px',
                filter: 'blur(6px)',
                opacity: 0.5,
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  inset: '-100%',
                  background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary)/0.3), hsl(var(--primary)), hsl(var(--primary)/0.3), hsl(var(--primary)))',
                  animation: 'speen 4s linear infinite',
                }}
              />
            </div>

            {/* Button Surface */}
            <div
              className="absolute inset-[3px] rounded-full flex items-center justify-center text-primary-foreground"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.85) 100%)',
                boxShadow: 'inset 0 1px 2px hsl(var(--primary)/0.3), 0 2px 8px hsl(var(--primary)/0.4)',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes speen {
          0% { transform: rotate(10deg); }
          50% { transform: rotate(190deg); }
          100% { transform: rotate(370deg); }
        }
        @keyframes woah {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
};

export { GlowChatButton };
