/**
 * 📅 FILTRO DE PERÍODO E TIPO DE DATA
 * Componente para selecionar período (até 90 dias) e tipo de data
 */

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PERIODOS_DISPONIVEIS = [
  { dias: 7, label: 'Últimos 7 dias', badge: '1 semana' },
  { dias: 15, label: 'Últimos 15 dias', badge: '2 semanas' },
  { dias: 30, label: 'Últimos 30 dias', badge: '1 mês' },
  { dias: 60, label: 'Últimos 60 dias', badge: '2 meses', default: true },
  { dias: 90, label: 'Últimos 90 dias', badge: '3 meses (máx)' }
];

// ✅ REMOVIDO: Filtro "Última Atualização" - mantém apenas "Data de Criação"
// Sempre filtra por item.date_created (coluna "Data Criação" na página)

interface PeriodoDataFilterProps {
  periodoDias: number;
  onPeriodoChange: (dias: number) => void;
  hasPendingChanges?: boolean;
  appliedPeriodo?: number;
}

export const PeriodoDataFilter = React.memo(function PeriodoDataFilter({
  periodoDias,
  onPeriodoChange,
  hasPendingChanges = false,
  appliedPeriodo
}: PeriodoDataFilterProps) {
  const [open, setOpen] = React.useState(false);

  const periodoSelecionado = PERIODOS_DISPONIVEIS.find(p => p.dias === periodoDias);
  
  const hasChanged = hasPendingChanges && periodoDias !== appliedPeriodo;

  return (
    <div className="lg:col-span-2 xl:col-span-2">
      <label className="text-sm font-medium mb-1 block flex items-center gap-2">
        Período de Busca
        <Badge variant="secondary" className="text-xs px-1 py-0">Data da Venda</Badge>
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              hasChanged && "border-warning"
            )}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="truncate">
                {periodoSelecionado?.label || `${periodoDias} dias`}
              </span>
            </div>
            <Badge variant="secondary" className="ml-2 text-xs">
              Data da Venda
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0">
          <div className="p-4 space-y-4">
            {/* Seleção de Período */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Selecionar Período
              </h4>
              <RadioGroup 
                value={periodoDias.toString()} 
                onValueChange={(value) => onPeriodoChange(parseInt(value))}
                className="space-y-2"
              >
                {PERIODOS_DISPONIVEIS.map((periodo) => (
                  <div 
                    key={periodo.dias}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      periodoDias === periodo.dias && "bg-muted border-primary"
                    )}
                    onClick={() => {
                      onPeriodoChange(periodo.dias);
                    }}
                  >
                    <RadioGroupItem value={periodo.dias.toString()} id={`periodo-${periodo.dias}`} />
                    <Label 
                      htmlFor={`periodo-${periodo.dias}`} 
                      className="flex-1 cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-medium">{periodo.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {periodo.badge}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Info Box */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>💡 Dica:</strong> O filtro sempre utiliza a coluna "Data da Venda" (data de criação do pedido) exibida na tabela.
              </p>
            </div>

            {/* Botão Aplicar */}
            <Button 
              className="w-full" 
              onClick={() => setOpen(false)}
              size="sm"
            >
              Aplicar Período
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
