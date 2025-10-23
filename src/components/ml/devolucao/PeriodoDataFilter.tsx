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

const TIPOS_DATA = [
  { 
    value: 'date_created', 
    label: 'Última Sincronização', 
    description: 'Data da venda do pedido',
    icon: Calendar
  },
  { 
    value: 'last_updated', 
    label: 'Data da Venda', 
    description: 'Quando aconteceu a venda',
    icon: Clock
  }
];

interface PeriodoDataFilterProps {
  periodoDias: number;
  tipoData: 'date_created' | 'last_updated';
  onPeriodoChange: (dias: number) => void;
  onTipoDataChange: (tipo: 'date_created' | 'last_updated') => void;
  hasPendingChanges?: boolean;
  appliedPeriodo?: number;
  appliedTipoData?: 'date_created' | 'last_updated';
}

export const PeriodoDataFilter = React.memo(function PeriodoDataFilter({
  periodoDias,
  tipoData,
  onPeriodoChange,
  onTipoDataChange,
  hasPendingChanges = false,
  appliedPeriodo,
  appliedTipoData
}: PeriodoDataFilterProps) {
  const [open, setOpen] = React.useState(false);

  const periodoSelecionado = PERIODOS_DISPONIVEIS.find(p => p.dias === periodoDias);
  const tipoDataSelecionado = TIPOS_DATA.find(t => t.value === tipoData);
  
  const hasChanged = hasPendingChanges && (
    periodoDias !== appliedPeriodo || 
    tipoData !== appliedTipoData
  );

  return (
    <div className="lg:col-span-2 xl:col-span-2">
      <label className="text-sm font-medium mb-1 block flex items-center gap-2">
        Período de Busca
        <Badge variant="secondary" className="text-xs px-1 py-0">API</Badge>
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
              {React.createElement(tipoDataSelecionado?.icon || Calendar, { className: "h-4 w-4" })}
              <span className="truncate">
                {periodoSelecionado?.label || `${periodoDias} dias`}
              </span>
            </div>
            <Badge variant="secondary" className="ml-2 text-xs">
              {tipoDataSelecionado?.label || tipoData}
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

            {/* Separador */}
            <div className="border-t" />

            {/* Seleção de Tipo de Data */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tipo de Data
              </h4>
              <RadioGroup 
                value={tipoData} 
                onValueChange={(value) => onTipoDataChange(value as 'date_created' | 'last_updated')}
                className="space-y-2"
              >
                {TIPOS_DATA.map((tipo) => (
                  <div 
                    key={tipo.value}
                    className={cn(
                      "flex items-start space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      tipoData === tipo.value && "bg-muted border-primary"
                    )}
                    onClick={() => {
                      onTipoDataChange(tipo.value as 'date_created' | 'last_updated');
                    }}
                  >
                    <RadioGroupItem value={tipo.value} id={`tipo-${tipo.value}`} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={`tipo-${tipo.value}`} className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          {React.createElement(tipo.icon, { className: "h-4 w-4" })}
                          <span className="font-medium">{tipo.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tipo.description}
                        </p>
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Info Box */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>💡 Dica:</strong> Use "Última Atualização" para ver claims que foram modificados recentemente, 
                mesmo que sejam antigos. Use "Última Sincronização" para ver claims por data de venda.
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
      
      {/* Resumo abaixo do botão */}
      {periodoSelecionado && (
        <p className="text-xs text-muted-foreground mt-1">
          Buscando claims dos últimos <strong>{periodoSelecionado.dias} dias</strong> por{' '}
          <strong>{tipoDataSelecionado?.label.toLowerCase()}</strong>
        </p>
      )}
    </div>
  );
});
