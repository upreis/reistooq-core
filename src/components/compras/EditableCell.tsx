import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number | undefined | null;
  type?: 'text' | 'number';
  onSave: (newValue: string | number) => void;
  onCancel: () => void;
  isEditing: boolean;
  onDoubleClick: () => void;
  className?: string;
  prefix?: string;
  suffix?: string;
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
}

export function EditableCell({
  value,
  type = 'text',
  onSave,
  onCancel,
  isEditing,
  onDoubleClick,
  className,
  prefix = '',
  suffix = '',
  step,
  min,
  max,
  placeholder
}: EditableCellProps) {
  const safeValue = value ?? (type === 'number' ? 0 : '');
  const [inputValue, setInputValue] = useState(safeValue.toString());
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const safeValue = value ?? (type === 'number' ? 0 : '');
    setInputValue(safeValue.toString());
  }, [value, type]);

  const validateInput = (val: string) => {
    if (type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num)) return false;
      if (min && num < parseFloat(min)) return false;
      if (max && num > parseFloat(max)) return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!isValid) return;
    
    let processedValue: string | number = inputValue;
    if (type === 'number') {
      processedValue = parseFloat(inputValue) || 0;
    }
    
    onSave(processedValue);
  };

  const handleCancel = () => {
    const safeValue = value ?? (type === 'number' ? 0 : '');
    setInputValue(safeValue.toString());
    setIsValid(true);
    onCancel();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValid(validateInput(newValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Pequeno delay para permitir clique nos botões
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 150);
  };

  const displayValue = () => {
    if (type === 'number' && typeof value === 'number') {
      return `${prefix}${value.toFixed(2)}${suffix}`;
    }
    return `${prefix}${value}${suffix}`;
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <Input
          ref={inputRef}
          type={type}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            "h-8 text-xs",
            !isValid && "border-destructive focus:border-destructive"
          )}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={!isValid}
            className="h-6 w-6 p-0 hover:bg-green-100"
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-6 w-6 p-0 hover:bg-red-100"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 min-h-[20px] flex items-center",
        className
      )}
      onDoubleClick={onDoubleClick}
      title="Duplo clique para editar"
    >
      {displayValue()}
    </div>
  );
}