import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface SidebarTooltipProps {
  content: string;
  children: React.ReactElement;
  delay?: number;
  disabled?: boolean;
  placement?: 'right' | 'top' | 'bottom';
}

export function SidebarTooltip({ 
  content, 
  children, 
  delay = 200,
  disabled = false,
  placement = 'right' 
}: SidebarTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    switch (placement) {
      case 'right':
        return {
          top: rect.top + scrollTop + rect.height / 2,
          left: rect.right + scrollLeft + 8
        };
      case 'top':
        return {
          top: rect.top + scrollTop - 8,
          left: rect.left + scrollLeft + rect.width / 2
        };
      case 'bottom':
        return {
          top: rect.bottom + scrollTop + 8,
          left: rect.left + scrollLeft + rect.width / 2
        };
      default:
        return { top: 0, left: 0 };
    }
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const pos = calculatePosition(triggerRef.current);
        setPosition(pos);
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const pos = calculatePosition(triggerRef.current);
      setPosition(pos);
      setIsVisible(true);
    }
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  // Clone child element with event handlers and ref
  const trigger = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      triggerRef.current = node;
      // Preserve original ref if it exists
      const originalRef = (children as any).ref;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef && 'current' in originalRef) {
        originalRef.current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      handleFocus();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleBlur();
      children.props.onBlur?.(e);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      children.props.onKeyDown?.(e);
    },
    'aria-describedby': isVisible ? tooltipId.current : children.props['aria-describedby']
  });

  const tooltip = isVisible && (
    <div
      id={tooltipId.current}
      role="tooltip"
      className={cn(
        'fixed z-[100] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        {
          'transform -translate-y-1/2': placement === 'right',
          'transform -translate-x-1/2 -translate-y-full': placement === 'top',
          'transform -translate-x-1/2': placement === 'bottom'
        }
      )}
      style={{
        top: position.top,
        left: position.left,
        maxWidth: '200px',
        zIndex: 100
      }}
    >
      {content}
    </div>
  );

  return (
    <>
      {trigger}
      {tooltip && createPortal(tooltip, document.body)}
    </>
  );
}