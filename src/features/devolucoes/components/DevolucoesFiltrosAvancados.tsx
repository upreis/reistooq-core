/**
 * 🎯 COMPONENTE DE FILTROS AVANÇADOS - DEVOLUÇÕES
 * Sistema completo de filtros organizados por categoria
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FilterSheet } from "@/components/mobile/standard/FilterSheet";
import { Filter, Search, DollarSign, Calendar, Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FiltrosAvancados {
  // 🔍 BUSCA TEXTUAL
  searchTerm: string;
  
  // 📊 CONTAS ML
  contasSelecionadas: string[];
  
  // 📅 DATAS
  dataInicio: string;
  dataFim: string;
  
  // 🎯 STATUS E CLASSIFICAÇÃO
  statusClaim: string;
  tipoClaim: string;
  subtipoClaim: string;
  motivoCategoria: string;
  
  // 💰 FINANCEIRO
  valorRetidoMin: string;
  valorRetidoMax: string;
  tipoReembolso: string;
  responsavelCusto: string;
  
  // 🚚 RASTREAMENTO
  temRastreamento: string;
  statusRastreamento: string;
  transportadora: string;
  
  // 📎 ANEXOS E COMUNICAÇÃO
  temAnexos: string;
  mensagensNaoLidasMin: string;
  
  // ⚠️ PRIORIDADE E AÇÃO
  nivelPrioridade: string;
  acaoSellerNecessaria: string;
  escaladoParaML: string;
  emMediacao: string;
  
  // ⏰ PRAZOS
  prazoVencido: string;
  slaNaoCumprido: string;
  
  // 📈 MÉTRICAS
  eficienciaResolucao: string;
  scoreQualidadeMin: string;
}

interface DevolucoesFiltrosAvancadosProps {
  filtros: FiltrosAvancados;
  onFiltrosChange: (filtros: Partial<FiltrosAvancados>) => void;
  onLimpar: () => void;
  mlAccounts: any[];
}

export function DevolucoesFiltrosAvancados({
  filtros,
  onFiltrosChange,
  onLimpar,
  mlAccounts
}: DevolucoesFiltrosAvancadosProps) {
  // Contar filtros ativos
  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.searchTerm) count++;
    if (filtros.contasSelecionadas.length > 0) count++;
    if (filtros.dataInicio) count++;
    if (filtros.dataFim) count++;
    if (filtros.statusClaim) count++;
    if (filtros.tipoClaim) count++;
    if (filtros.nivelPrioridade) count++;
    if (filtros.acaoSellerNecessaria) count++;
    if (filtros.valorRetidoMin) count++;
    if (filtros.valorRetidoMax) count++;
    if (filtros.temRastreamento) count++;
    if (filtros.temAnexos) count++;
    if (filtros.subtipoClaim) count++;
    if (filtros.responsavelCusto) count++;
    if (filtros.statusRastreamento) count++;
    if (filtros.emMediacao) count++;
    if (filtros.escaladoParaML) count++;
    if (filtros.prazoVencido) count++;
    return count;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  return (
    <div className="space-y-4">
      {/* Desktop: Filtros sempre visíveis */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-card">
          {/* Busca */}
          <div className="lg:col-span-3">
            <Label htmlFor="searchTerm" className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4" />
              Busca Geral
            </Label>
            <Input
              id="searchTerm"
              placeholder="Order ID, Claim ID, SKU, Comprador, Rastreio..."
              value={filtros.searchTerm}
              onChange={(e) => onFiltrosChange({ searchTerm: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Período */}
          <div>
            <Label htmlFor="dataInicio" className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              Data Início
            </Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => onFiltrosChange({ dataInicio: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="dataFim" className="mb-2 block">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => onFiltrosChange({ dataFim: e.target.value })}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="statusClaim" className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4" />
              Status
            </Label>
            <Select value={filtros.statusClaim} onValueChange={(value) => onFiltrosChange({ statusClaim: value })}>
              <SelectTrigger id="statusClaim">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Claim */}
          <div>
            <Label htmlFor="tipoClaim" className="mb-2 block">Tipo de Claim</Label>
            <Select value={filtros.tipoClaim} onValueChange={(value) => onFiltrosChange({ tipoClaim: value })}>
              <SelectTrigger id="tipoClaim">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="mediations">Mediação</SelectItem>
                <SelectItem value="claim">Reclamação</SelectItem>
                <SelectItem value="return">Devolução</SelectItem>
                <SelectItem value="cancellation">Cancelamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div>
            <Label htmlFor="nivelPrioridade" className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              Prioridade
            </Label>
            <Select value={filtros.nivelPrioridade} onValueChange={(value) => onFiltrosChange({ nivelPrioridade: value })}>
              <SelectTrigger id="nivelPrioridade">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ação Necessária */}
          <div>
            <Label htmlFor="acaoSellerNecessaria" className="mb-2 block">Ação Necessária</Label>
            <Select value={filtros.acaoSellerNecessaria} onValueChange={(value) => onFiltrosChange({ acaoSellerNecessaria: value })}>
              <SelectTrigger id="acaoSellerNecessaria">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="lg:col-span-3 my-2" />

          {/* Valores Financeiros */}
          <div>
            <Label htmlFor="valorRetidoMin" className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              Valor Mínimo (R$)
            </Label>
            <Input
              id="valorRetidoMin"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.valorRetidoMin}
              onChange={(e) => onFiltrosChange({ valorRetidoMin: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="valorRetidoMax" className="mb-2 block">Valor Máximo (R$)</Label>
            <Input
              id="valorRetidoMax"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.valorRetidoMax}
              onChange={(e) => onFiltrosChange({ valorRetidoMax: e.target.value })}
            />
          </div>

          {/* Contas ML */}
          <div>
            <Label className="mb-2 block">Contas ML ({filtros.contasSelecionadas.length})</Label>
            <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-2">
              {mlAccounts.map(account => (
                <label key={account.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={filtros.contasSelecionadas.includes(account.id)}
                    onChange={(e) => {
                      const newContas = e.target.checked
                        ? [...filtros.contasSelecionadas, account.id]
                        : filtros.contasSelecionadas.filter(id => id !== account.id);
                      onFiltrosChange({ contasSelecionadas: newContas });
                    }}
                    className="rounded"
                  />
                  <span>{account.name}</span>
                </label>
              ))}
            </div>
          </div>

          {filtrosAtivos > 0 && (
            <div className="lg:col-span-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={onLimpar}>
                Limpar Filtros ({filtrosAtivos})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: FilterSheet */}
      <div className="md:hidden">
        <FilterSheet
          title="Filtros de Devoluções"
          activeFiltersCount={filtrosAtivos}
          onClear={onLimpar}
          applyButtonText="Aplicar"
          clearButtonText="Limpar"
        >
          <div className="space-y-6">
            {/* Busca */}
            <div>
              <Label htmlFor="searchTermMobile" className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4" />
                Busca Geral
              </Label>
              <Input
                id="searchTermMobile"
                placeholder="Order ID, Claim ID, SKU..."
                value={filtros.searchTerm}
                onChange={(e) => onFiltrosChange({ searchTerm: e.target.value })}
              />
            </div>

            {/* Datas */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dataInicioMobile" className="text-xs text-muted-foreground">Início</Label>
                  <Input
                    id="dataInicioMobile"
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => onFiltrosChange({ dataInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dataFimMobile" className="text-xs text-muted-foreground">Fim</Label>
                  <Input
                    id="dataFimMobile"
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => onFiltrosChange({ dataFim: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div>
              <Label htmlFor="statusClaimMobile" className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                Status
              </Label>
              <Select value={filtros.statusClaim} onValueChange={(value) => onFiltrosChange({ statusClaim: value })}>
                <SelectTrigger id="statusClaimMobile">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="with_claims">Com Claims</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div>
              <Label htmlFor="tipoClaimMobile" className="mb-2 block">Tipo de Claim</Label>
              <Select value={filtros.tipoClaim} onValueChange={(value) => onFiltrosChange({ tipoClaim: value })}>
                <SelectTrigger id="tipoClaimMobile">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="mediations">Mediação</SelectItem>
                  <SelectItem value="claim">Reclamação</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                  <SelectItem value="cancellation">Cancelamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div>
              <Label htmlFor="nivelPrioridadeMobile" className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Prioridade
              </Label>
              <Select value={filtros.nivelPrioridade} onValueChange={(value) => onFiltrosChange({ nivelPrioridade: value })}>
                <SelectTrigger id="nivelPrioridadeMobile">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ação Necessária */}
            <div>
              <Label htmlFor="acaoSellerNecessariaMobile" className="mb-2 block">Ação Necessária</Label>
              <Select value={filtros.acaoSellerNecessaria} onValueChange={(value) => onFiltrosChange({ acaoSellerNecessaria: value })}>
                <SelectTrigger id="acaoSellerNecessariaMobile">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Valores */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Faixa de Valor
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="valorRetidoMinMobile" className="text-xs text-muted-foreground">Mínimo</Label>
                  <Input
                    id="valorRetidoMinMobile"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filtros.valorRetidoMin}
                    onChange={(e) => onFiltrosChange({ valorRetidoMin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valorRetidoMaxMobile" className="text-xs text-muted-foreground">Máximo</Label>
                  <Input
                    id="valorRetidoMaxMobile"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filtros.valorRetidoMax}
                    onChange={(e) => onFiltrosChange({ valorRetidoMax: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contas ML */}
            <div>
              <Label className="mb-2 block">Contas ML ({filtros.contasSelecionadas.length})</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-3">
                {mlAccounts.map(account => (
                  <label key={account.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filtros.contasSelecionadas.includes(account.id)}
                      onChange={(e) => {
                        const newContas = e.target.checked
                          ? [...filtros.contasSelecionadas, account.id]
                          : filtros.contasSelecionadas.filter(id => id !== account.id);
                        onFiltrosChange({ contasSelecionadas: newContas });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{account.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </FilterSheet>
      </div>
    </div>
  );
}
