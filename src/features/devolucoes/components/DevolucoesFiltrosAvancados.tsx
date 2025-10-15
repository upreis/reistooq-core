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
  onAplicar: () => void;
  mlAccounts: any[];
}

export function DevolucoesFiltrosAvancados({
  filtros,
  onFiltrosChange,
  onLimpar,
  onAplicar,
  mlAccounts
}: DevolucoesFiltrosAvancadosProps) {
  // Estado local para os filtros (rascunho)
  const [draftFilters, setDraftFilters] = React.useState<DevolucaoAdvancedFilters>(filtros);
  // Ref para rastrear se acabamos de aplicar os filtros
  const [filtrosAplicados, setFiltrosAplicados] = React.useState(false);

  // Sincronizar draft quando filtros externos mudarem (reset, limpar, etc)
  React.useEffect(() => {
    setDraftFilters(filtros);
  }, [filtros]);
  
  // ⚡ Executar busca automaticamente após atualização de estado confirmada
  React.useEffect(() => {
    if (filtrosAplicados) {
      onAplicar();
      setFiltrosAplicados(false);
    }
  }, [filtrosAplicados, onAplicar]);

  // Atualizar apenas o draft local
  const updateDraft = (updates: Partial<DevolucaoAdvancedFilters>) => {
    setDraftFilters(prev => ({ ...prev, ...updates }));
  };
  
  // 🎯 ATALHOS DE DATA - SEMPRE RECALCULA BASEADO NA DATA ATUAL
  const aplicarAtalhoData = (preset: string) => {
    const hoje = new Date();
    let dataInicio = '';
    let dataFim = hoje.toISOString().split('T')[0];

    switch(preset) {
      case 'hoje':
        dataInicio = dataFim;
        break;
      case 'ultimos7dias':
        const seteAtras = new Date(hoje);
        seteAtras.setDate(hoje.getDate() - 7);
        dataInicio = seteAtras.toISOString().split('T')[0];
        break;
      case 'ultimos30dias':
        const trintaAtras = new Date(hoje);
        trintaAtras.setDate(hoje.getDate() - 30);
        dataInicio = trintaAtras.toISOString().split('T')[0];
        break;
      case 'ultimos90dias':
        const noventaAtras = new Date(hoje);
        noventaAtras.setDate(hoje.getDate() - 90);
        dataInicio = noventaAtras.toISOString().split('T')[0];
        break;
      case 'ultimos180dias':
        const centoOitentaAtras = new Date(hoje);
        centoOitentaAtras.setDate(hoje.getDate() - 180);
        dataInicio = centoOitentaAtras.toISOString().split('T')[0];
        break;
      case 'esteAno':
        dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
    }

    console.log(`[Filtros] 📅 Preset "${preset}" aplicado: ${dataInicio} até ${dataFim}`);
    updateDraft({ dataInicio, dataFim });
  };

  // Limpar apenas datas
  const limparDatas = () => {
    updateDraft({ dataInicio: '', dataFim: '' });
  };

  // Contar filtros ativos no draft
  const contarFiltrosAtivos = () => {
    let count = 0;
    if (draftFilters.searchTerm) count++;
    if (draftFilters.dataInicio) count++;
    if (draftFilters.dataFim) count++;
    if (draftFilters.statusClaim) count++;
    if (draftFilters.tipoClaim) count++;
    if (draftFilters.valorRetidoMin) count++;
    if (draftFilters.valorRetidoMax) count++;
    if (draftFilters.temRastreamento) count++;
    if (draftFilters.nivelPrioridade) count++;
    if (draftFilters.acaoSellerNecessaria) count++;
    if (draftFilters.emMediacao) count++;
    return count;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  // Verificar se há mudanças pendentes
  const temMudancasPendentes = JSON.stringify(draftFilters) !== JSON.stringify(filtros);

  // Aplicar os filtros do draft
  const handleAplicar = () => {
    // ⚡ SOLUÇÃO DEFINITIVA: Sincroniza estado e marca para aplicar
    onFiltrosChange(draftFilters);
    
    // Marca que os filtros foram aplicados para disparar o useEffect
    // que executará a busca após o React processar a atualização
    setFiltrosAplicados(true);
  };

  // Limpar todos os filtros
  const handleLimpar = () => {
    const filtrosVazios: Partial<DevolucaoAdvancedFilters> = {
      searchTerm: '',
      dataInicio: '',
      dataFim: '',
      statusClaim: '',
      tipoClaim: '',
      valorRetidoMin: '',
      valorRetidoMax: '',
      temRastreamento: '',
      nivelPrioridade: '',
      acaoSellerNecessaria: '',
      emMediacao: ''
    };
    setDraftFilters(prev => ({ ...prev, ...filtrosVazios }));
    onFiltrosChange(filtrosVazios);
    onLimpar();
  };

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
          <div className="flex gap-2">
            {temMudancasPendentes && (
              <Badge variant="outline" className="text-orange-600">
                Alterações pendentes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimpar}
              disabled={filtrosAtivos === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Todos
            </Button>
          </div>
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
              value={draftFilters.searchTerm}
              onChange={(e) => updateDraft({ searchTerm: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros de Data */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Período</Label>
            {(draftFilters.dataInicio || draftFilters.dataFim) && (
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
                      !draftFilters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {draftFilters.dataInicio ? (
                      format(new Date(draftFilters.dataInicio + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data inicial</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={draftFilters.dataInicio ? new Date(draftFilters.dataInicio + 'T12:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateDraft({ dataInicio: format(date, 'yyyy-MM-dd') });
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
                      !draftFilters.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {draftFilters.dataFim ? (
                      format(new Date(draftFilters.dataFim + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data final</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={draftFilters.dataFim ? new Date(draftFilters.dataFim + 'T12:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateDraft({ dataFim: format(date, 'yyyy-MM-dd') });
                      }
                    }}
                    disabled={(date) => {
                      if (!draftFilters.dataInicio) return false;
                      return date < new Date(draftFilters.dataInicio + 'T12:00:00');
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
              value={draftFilters.statusClaim}
              onValueChange={(value) => updateDraft({ statusClaim: value })}
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
              value={draftFilters.tipoClaim}
              onValueChange={(value) => updateDraft({ tipoClaim: value })}
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
              value={draftFilters.valorRetidoMin}
              onChange={(e) => updateDraft({ valorRetidoMin: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMax">Valor Retido Máximo (R$)</Label>
            <Input
              id="valorMax"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={draftFilters.valorRetidoMax}
              onChange={(e) => updateDraft({ valorRetidoMax: e.target.value })}
            />
          </div>
        </div>

        {/* Filtros Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rastreamento">Rastreamento</Label>
            <Select
              value={draftFilters.temRastreamento}
              onValueChange={(value) => updateDraft({ temRastreamento: value })}
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
              value={draftFilters.nivelPrioridade}
              onValueChange={(value) => updateDraft({ nivelPrioridade: value })}
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
              value={draftFilters.emMediacao}
              onValueChange={(value) => updateDraft({ emMediacao: value })}
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
            <p className="text-sm text-muted-foreground mb-2">Filtros selecionados:</p>
            <div className="flex flex-wrap gap-2">
              {draftFilters.searchTerm && (
                <Badge variant="secondary">
                  Busca: {draftFilters.searchTerm.substring(0, 20)}
                  {draftFilters.searchTerm.length > 20 ? '...' : ''}
                </Badge>
              )}
              {draftFilters.dataInicio && (
                <Badge variant="secondary">
                  De: {format(new Date(draftFilters.dataInicio + 'T12:00:00'), "dd/MM/yyyy")}
                </Badge>
              )}
              {draftFilters.dataFim && (
                <Badge variant="secondary">
                  Até: {format(new Date(draftFilters.dataFim + 'T12:00:00'), "dd/MM/yyyy")}
                </Badge>
              )}
              {draftFilters.statusClaim && (
                <Badge variant="secondary">Status: {draftFilters.statusClaim}</Badge>
              )}
              {draftFilters.tipoClaim && (
                <Badge variant="secondary">Tipo: {draftFilters.tipoClaim}</Badge>
              )}
              {draftFilters.valorRetidoMin && (
                <Badge variant="secondary">Mín: R$ {draftFilters.valorRetidoMin}</Badge>
              )}
              {draftFilters.valorRetidoMax && (
                <Badge variant="secondary">Máx: R$ {draftFilters.valorRetidoMax}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Botão Aplicar Filtros */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleAplicar}
            className="w-full"
            disabled={!temMudancasPendentes && filtrosAtivos === 0}
          >
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros e Buscar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}