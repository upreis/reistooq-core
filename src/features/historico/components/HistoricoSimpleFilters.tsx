// Filtros simples para histórico
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, Calendar } from 'lucide-react';
import { HistoricoFilters } from '../services/HistoricoSimpleService';

interface HistoricoSimpleFiltersProps {
  filters: HistoricoFilters;
  onFiltersChange: (filters: Partial<HistoricoFilters>) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

export function HistoricoSimpleFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  hasFilters 
}: HistoricoSimpleFiltersProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca geral */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Busca</label>
            <Input
              placeholder="Pedido, SKU, produto, cliente..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="baixado">Baixado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data início */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Início</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-10"
                value={filters.dataInicio || ''}
                onChange={(e) => onFiltersChange({ dataInicio: e.target.value })}
              />
            </div>
          </div>

          {/* Data fim */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Fim</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-10"
                value={filters.dataFim || ''}
                onChange={(e) => onFiltersChange({ dataFim: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFiltersChange({
              dataInicio: new Date().toISOString().split('T')[0],
              dataFim: new Date().toISOString().split('T')[0]
            })}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const ontem = new Date();
              ontem.setDate(ontem.getDate() - 1);
              const ontemStr = ontem.toISOString().split('T')[0];
              onFiltersChange({
                dataInicio: ontemStr,
                dataFim: ontemStr
              });
            }}
          >
            Ontem
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const hoje = new Date();
              const seteDiasAtras = new Date();
              seteDiasAtras.setDate(hoje.getDate() - 7);
              onFiltersChange({
                dataInicio: seteDiasAtras.toISOString().split('T')[0],
                dataFim: hoje.toISOString().split('T')[0]
              });
            }}
          >
            Últimos 7 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const hoje = new Date();
              const trintaDiasAtras = new Date();
              trintaDiasAtras.setDate(hoje.getDate() - 30);
              onFiltersChange({
                dataInicio: trintaDiasAtras.toISOString().split('T')[0],
                dataFim: hoje.toISOString().split('T')[0]
              });
            }}
          >
            Últimos 30 dias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}