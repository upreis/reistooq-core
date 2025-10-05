import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalesFiltersProps {
  onFilterChange: (filters: SalesFilterState) => void;
  onReset: () => void;
}

export interface SalesFilterState {
  dataInicio?: string;
  dataFim?: string;
  periodo?: 'hoje' | 'semana' | 'mes' | '3meses' | '6meses' | 'ano' | 'custom';
}

export function SalesFilters({ onFilterChange, onReset }: SalesFiltersProps) {
  const [filters, setFilters] = useState<SalesFilterState>({
    periodo: 'mes'
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handlePeriodoChange = (periodo: string) => {
    const now = new Date();
    let dataInicio: Date | undefined;
    let dataFim = now;

    switch (periodo) {
      case 'hoje':
        dataInicio = now;
        break;
      case 'semana':
        dataInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        dataInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3meses':
        dataInicio = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6meses':
        dataInicio = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'ano':
        dataInicio = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const newFilters: SalesFilterState = {
      periodo: periodo as any,
      ...(dataInicio && { dataInicio: format(dataInicio, 'yyyy-MM-dd') }),
      ...(dataFim && { dataFim: format(dataFim, 'yyyy-MM-dd') })
    };

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      const newFilters: SalesFilterState = {
        periodo: 'custom',
        dataInicio: format(startDate, 'yyyy-MM-dd'),
        dataFim: format(endDate, 'yyyy-MM-dd')
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    setFilters({ periodo: 'mes' });
    setStartDate(undefined);
    setEndDate(undefined);
    onReset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Período Rápido</Label>
            <Select value={filters.periodo} onValueChange={handlePeriodoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="mes">Último Mês</SelectItem>
                <SelectItem value="3meses">Últimos 3 Meses</SelectItem>
                <SelectItem value="6meses">Últimos 6 Meses</SelectItem>
                <SelectItem value="ano">Último Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filters.periodo === 'custom' && (
            <>
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        if (date && endDate) handleCustomDateChange();
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        if (startDate && date) handleCustomDateChange();
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          <div className="flex items-end">
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
