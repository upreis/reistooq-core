import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterValue {
  [key: string]: any;
}

interface MobileFiltersProps {
  filterOptions: FilterOption[];
  values: FilterValue;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  className?: string;
}

export default function MobileFilters({ 
  filterOptions, 
  values, 
  onChange, 
  onClear, 
  className 
}: MobileFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Count active filters
  const activeFiltersCount = Object.values(values).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (value instanceof Date) return true;
    return value !== undefined && value !== null && value !== "";
  }).length;

  const renderFilterInput = (option: FilterOption) => {
    const value = values[option.key];

    switch (option.type) {
      case "text":
        return (
          <div key={option.key} className="space-y-2">
            <Label htmlFor={option.key}>{option.label}</Label>
            <Input
              id={option.key}
              placeholder={option.placeholder}
              value={value || ""}
              onChange={(e) => onChange(option.key, e.target.value)}
            />
          </div>
        );

      case "select":
        return (
          <div key={option.key} className="space-y-2">
            <Label htmlFor={option.key}>{option.label}</Label>
            <Select value={value || ""} onValueChange={(val) => onChange(option.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={option.placeholder || "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {option.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div key={option.key} className="space-y-2">
            <Label>{option.label}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(value, "PPP", { locale: ptBR }) : option.placeholder}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={(date) => onChange(option.key, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "dateRange":
        return (
          <div key={option.key} className="space-y-2">
            <Label>{option.label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !value?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value?.from ? format(value.from, "dd/MM", { locale: ptBR }) : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value?.from}
                    onSelect={(date) => onChange(option.key, { ...value, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !value?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value?.to ? format(value.to, "dd/MM", { locale: ptBR }) : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value?.to}
                    onSelect={(date) => onChange(option.key, { ...value, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Filter Button */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4 overflow-y-auto max-h-full">
              {filterOptions.map(renderFilterInput)}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={onClear}
                  className="flex-1"
                >
                  Limpar
                </Button>
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filterOptions.map(renderFilterInput)}
        </div>
        
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {activeFiltersCount} filtro(s) ativo(s)
              </span>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClear}
                  className="h-7 px-2"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}