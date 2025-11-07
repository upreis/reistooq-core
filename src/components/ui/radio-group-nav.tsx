import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

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
  borderRadius = '0.5rem',
  gap = '0.875rem',
  rtl = false,
  padding = '0 1.5rem',
}: RadioGroupNavProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalValue;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: rtl ? 'row-reverse' : 'row',
        gap,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '1.125rem',
      }}
    >
      {options.map((option) => {
        const isActive = activeTab === option.value;
        const isHovered = hovered === option.value;

        const content = rtl ? (
          <>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              {option.label}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: 4,
                zIndex: 2,
              }}
            >
              <option.icon color="currentColor" size={20} strokeWidth={2} />
            </span>
          </>
        ) : (
          <>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: 4,
                zIndex: 2,
              }}
            >
              <option.icon color="currentColor" size={20} strokeWidth={2} />
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
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
              border-none outline-none cursor-pointer
              relative overflow-hidden
              transition-all duration-300
              ${isActive ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}
              ${!isActive && isHovered ? 'bg-primary text-primary-foreground' : ''}
            `}
            style={{
              padding,
              height: '3rem',
              borderRadius,
              fontSize,
              fontWeight,
              fontFamily,
              userSelect: 'none',
              margin: 0,
              boxSizing: 'border-box',
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
