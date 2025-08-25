// P4.2: Versão acessível da tabela com navegação por teclado
import React, { useState, useRef, useCallback } from 'react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccessibleTableRowProps {
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onFocus?: () => void;
  tabIndex?: number;
  ariaLabel?: string;
}

export function AccessibleTableRow({ 
  children, 
  isSelected, 
  onSelect, 
  onFocus,
  tabIndex = 0,
  ariaLabel 
}: AccessibleTableRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  useKeyboardNavigation({
    onSpace: () => onSelect(!isSelected),
    onEnter: () => onSelect(!isSelected),
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        onSelect(!isSelected);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const nextRow = rowRef.current?.nextElementSibling as HTMLElement;
        nextRow?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevRow = rowRef.current?.previousElementSibling as HTMLElement;
        prevRow?.focus();
        break;
    }
  }, [isSelected, onSelect]);

  return (
    <tr
      ref={rowRef}
      tabIndex={tabIndex}
      role="row"
      aria-selected={isSelected}
      aria-label={ariaLabel}
      className={`
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        cursor-pointer transition-colors
        ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}
      `}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onClick={() => onSelect(!isSelected)}
    >
      <td className="p-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Selecionar linha ${ariaLabel}`}
        />
      </td>
      {children}
    </tr>
  );
}

interface AccessibleTableProps {
  children: React.ReactNode;
  ariaLabel?: string;
  caption?: string;
}

export function AccessibleTable({ children, ariaLabel, caption }: AccessibleTableProps) {
  return (
    <table 
      role="table" 
      aria-label={ariaLabel}
      className="w-full"
    >
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </table>
  );
}

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey?: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string) => void;
  ariaLabel?: string;
}

export function SortableHeader({ 
  children, 
  sortKey, 
  currentSort, 
  onSort,
  ariaLabel 
}: SortableHeaderProps) {
  const isSorted = currentSort?.key === sortKey;
  const direction = isSorted ? currentSort?.direction : undefined;

  const handleSort = useCallback(() => {
    if (sortKey && onSort) {
      onSort(sortKey);
    }
  }, [sortKey, onSort]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSort();
    }
  }, [handleSort]);

  if (!sortKey || !onSort) {
    return <th scope="col" className="text-left p-2">{children}</th>;
  }

  return (
    <th scope="col" className="text-left p-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium justify-start"
        onClick={handleSort}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-sort={
          isSorted 
            ? direction === 'asc' ? 'ascending' : 'descending'
            : 'none'
        }
      >
        {children}
        {isSorted && (
          direction === 'asc' ? 
            <ChevronUp className="ml-1 h-4 w-4" /> : 
            <ChevronDown className="ml-1 h-4 w-4" />
        )}
      </Button>
    </th>
  );
}