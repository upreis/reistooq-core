import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { GlassFilter } from './glass-filter';

interface RadioOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface RadioGroupNavProps {
  options: RadioOption[];
  onChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
  fontSize?: string;
  fontWeight?: number;
  fontFamily?: string;
  borderRadius?: string;
  gap?: string;
  rtl?: boolean;
  padding?: string;
}

export function RadioGroupNav({
  options,
  onChange,
  value,
  defaultValue = options[0]?.value,
  fontSize = '0.875rem',
  fontWeight = 500,
  fontFamily = 'inherit',
  borderRadius = '8px',
  gap = '14px',
  rtl = false,
  padding = '0 32px',
}: RadioGroupNavProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalValue;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <GlassFilter />
      <div
        style={{
          display: 'flex',
          flexDirection: rtl ? 'row-reverse' : 'row',
          gap,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 18,
        }}
      >
        {options.map((option) => {
        const isActive = activeTab === option.value;
        const isHovered = hovered === option.value;

        const content = rtl ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
              {option.label}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', marginLeft: 4, zIndex: 2 }}>
              <option.icon color="currentColor" size={20} strokeWidth={2} />
            </span>
          </>
        ) : (
          <>
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 4, zIndex: 2 }}>
              <option.icon color="currentColor" size={20} strokeWidth={2} />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
              {option.label}
            </span>
          </>
        );

        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            onClick={() => {
              if (value === undefined) setInternalValue(option.value);
              onChange?.(option.value);
            }}
            onMouseEnter={() => setHovered(option.value)}
            onMouseLeave={() => setHovered(null)}
            className={`
              flex items-center justify-center gap-1
              h-12 border-none cursor-pointer outline-none select-none
              m-0 box-border min-w-0 min-h-0 relative overflow-hidden
              transition-all duration-300
              ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              ${isHovered && !isActive ? 'bg-accent text-accent-foreground' : ''}
            `}
            style={{
              ...{
                padding,
                borderRadius,
                fontSize,
                fontWeight,
                fontFamily,
              },
              filter: 'url(#radio-glass)',
            }}
          >
            {content}
          </button>
        );
      })}
      </div>
    </>
  );
}
