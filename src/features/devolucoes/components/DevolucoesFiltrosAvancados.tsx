import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, X, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DevolucaoAdvancedFilters } from '@/features/devolucoes/hooks/useDevolucoes';

interface DevolucoesFiltrosAvancadosProps {
  filtros: DevolucaoAdvancedFilters;
  onFiltrosChange: (filtros: Partial<DevolucaoAdvancedFilters>) => void;
  onLimpar: () => void;
  mlAccounts: any[];
}

export function DevolucoesFiltrosAvancados({
  filtros,
  onFiltrosChange,
  onLimpar,
  mlAccounts
}: DevolucoesFiltrosAvancadosProps) {
  
  // Atalhos de data
  const aplicarAtalhoData = (tipo: string) => {
    const hoje = new Date();
    let dataInicio = '';
    let dataFim = hoje.toISOString().split('T')[0];

    switch(tipo) {
      case 'hoje':
        dataInicio = dataFim;
        break;
      case 'ultimos7dias':
        dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'ultimos30dias':
        dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'ultimos90dias':
        dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'ultimos180dias':
        dataInicio = new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'esteAno':
        dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
    }

    onFiltrosChange({ dataInicio, dataFim });
  };

  // Limpar apenas datas
  const limparDatas = () => {
    onFiltrosChange({ dataInicio: '', dataFim: '' });
  };

  // Contar filtros ativos
  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.searchTerm) count++;
    if (filtros.dataInicio) count++;
    if (filtros.dataFim) count++;
    if (filtros.statusClaim) count++;
    if (filtros.tipoClaim) count++;
    if (filtros.valorRetidoMin) count++;
    if (filtros.valorRetidoMax) count++;
    if (filtros.temRastreamento) count++;
    if (filtros.nivelPrioridade) count++;
    if (filtros.acaoSellerNecessaria) count++;
    if (filtros.emMediacao) count++;
    return count;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros de Busca</CardTitle>
            {filtrosAtivos > 0 && (
              <Badge variant="secondary">{filtrosAtivos} ativo{filtrosAtivos > 1 ? 's' : ''}</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLimpar}
            disabled={filtrosAtivos === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Busca Textual */}
        <div className="space-y-2">
          <Label htmlFor="search">Busca Textual</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por produto, order ID, claim ID, SKU, comprador..."
              value={filtros.searchTerm}
              onChange={(e) => onFiltrosChange({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros de Data */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Período</Label>
            {(filtros.dataInicio || filtros.dataFim) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparDatas}
                className="h-auto p-1 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar datas
              </Button>
            )}
          </div>

          {/* Atalhos rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => aplicarAtalhoData('hoje')}
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => aplicarAtalhoData('ultimos7dias')}
            >
              Últimos 7 dias
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => aplicarAtalhoData('ultimos30dias')}
            >
              Últimos 30 dias
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => aplicarAtalhoData('ultimos90dias')}
            >
              Últimos 90 dias
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => aplicarAtalhoData('ultimos180dias')}
            >
              Últimos 180 dias
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => aplicarAtalhoData('esteAno')}
            >
              Este Ano
            </Button>
          </div>

          {/* Seletores de data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data Início */}
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtros.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.dataInicio ? (
                      format(new Date(filtros.dataInicio), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data inicial</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtros.dataInicio ? new Date(filtros.dataInicio) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        onFiltrosChange({ dataInicio: format(date, 'yyyy-MM-dd') });
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtros.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.dataFim ? (
                      format(new Date(filtros.dataFim), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data final</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtros.dataFim ? new Date(filtros.dataFim) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        onFiltrosChange({ dataFim: format(date, 'yyyy-MM-dd') });
                      }
                    }}
                    disabled={(date) => {
                      if (!filtros.dataInicio) return false;
                      return date < new Date(filtros.dataInicio);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Filtros de Status e Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status do Claim */}
          <div className="space-y-2">
            <Label htmlFor="statusClaim">Status do Claim</Label>
            <Select
              value={filtros.statusClaim}
              onValueChange={(value) => onFiltrosChange({ statusClaim: value })}
            >
              <SelectTrigger id="statusClaim">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="opened">Aberto</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
                <SelectItem value="processing">Em Processamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Claim */}
          <div className="space-y-2">
            <Label htmlFor="tipoClaim">Tipo de Claim</Label>
            <Select
              value={filtros.tipoClaim}
              onValueChange={(value) => onFiltrosChange({ tipoClaim: value })}
            >
              <SelectTrigger id="tipoClaim">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="return">Devolução</SelectItem>
                <SelectItem value="refund">Reembolso</SelectItem>
                <SelectItem value="not_received">Não Recebido</SelectItem>
                <SelectItem value="damaged">Produto Danificado</SelectItem>
                <SelectItem value="different">Produto Diferente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Financeiros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valorMin">Valor Retido Mínimo (R$)</Label>
            <Input
              id="valorMin"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.valorRetidoMin}
              onChange={(e) => onFiltrosChange({ valorRetidoMin: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMax">Valor Retido Máximo (R$)</Label>
            <Input
              id="valorMax"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.valorRetidoMax}
              onChange={(e) => onFiltrosChange({ valorRetidoMax: e.target.value })}
            />
          </div>
        </div>

        {/* Filtros Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rastreamento">Rastreamento</Label>
            <Select
              value={filtros.temRastreamento}
              onValueChange={(value) => onFiltrosChange({ temRastreamento: value })}
            >
              <SelectTrigger id="rastreamento">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Com Rastreamento</SelectItem>
                <SelectItem value="nao">Sem Rastreamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select
              value={filtros.nivelPrioridade}
              onValueChange={(value) => onFiltrosChange({ nivelPrioridade: value })}
            >
              <SelectTrigger id="prioridade">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediacao">Em Mediação</Label>
            <Select
              value={filtros.emMediacao}
              onValueChange={(value) => onFiltrosChange({ emMediacao: value })}
            >
              <SelectTrigger id="mediacao">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resumo dos Filtros Ativos */}
        {filtrosAtivos > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Filtros aplicados:</p>
            <div className="flex flex-wrap gap-2">
              {filtros.searchTerm && (
                <Badge variant="secondary">
                  Busca: {filtros.searchTerm.substring(0, 20)}
                  {filtros.searchTerm.length > 20 ? '...' : ''}
                </Badge>
              )}
              {filtros.dataInicio && (
                <Badge variant="secondary">
                  De: {format(new Date(filtros.dataInicio), "dd/MM/yyyy")}
                </Badge>
              )}
              {filtros.dataFim && (
                <Badge variant="secondary">
                  Até: {format(new Date(filtros.dataFim), "dd/MM/yyyy")}
                </Badge>
              )}
              {filtros.statusClaim && (
                <Badge variant="secondary">Status: {filtros.statusClaim}</Badge>
              )}
              {filtros.tipoClaim && (
                <Badge variant="secondary">Tipo: {filtros.tipoClaim}</Badge>
              )}
              {filtros.valorRetidoMin && (
                <Badge variant="secondary">Mín: R$ {filtros.valorRetidoMin}</Badge>
              )}
              {filtros.valorRetidoMax && (
                <Badge variant="secondary">Máx: R$ {filtros.valorRetidoMax}</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}