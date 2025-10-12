/**
 * 🎯 COMPONENTE DE FILTROS AVANÇADOS - DEVOLUÇÕES
 * Sistema completo de filtros organizados por categoria
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter, X, Search } from "lucide-react";
import { useState } from "react";

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
  const [categoriasAbertas, setCategoriasAbertas] = useState<string[]>(['busca', 'contas', 'datas']);

  const toggleCategoria = (categoria: string) => {
    setCategoriasAbertas(prev =>
      prev.includes(categoria)
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

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
    return count;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filtros Avançados</h3>
          {filtrosAtivos > 0 && (
            <Badge variant="secondary">{filtrosAtivos} ativos</Badge>
          )}
        </div>
        {filtrosAtivos > 0 && (
          <Button variant="ghost" size="sm" onClick={onLimpar}>
            <X className="h-4 w-4 mr-1" />
            Limpar Todos
          </Button>
        )}
      </div>

      {/* 🔍 BUSCA TEXTUAL */}
      <Collapsible
        open={categoriasAbertas.includes('busca')}
        onOpenChange={() => toggleCategoria('busca')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="font-medium">Busca Textual</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('busca') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="searchTerm">Buscar</Label>
            <Input
              id="searchTerm"
              placeholder="Order ID, Claim ID, SKU, Comprador, Rastreio..."
              value={filtros.searchTerm}
              onChange={(e) => onFiltrosChange({ searchTerm: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Busca em: Order ID, Claim ID, SKU, Nome do Comprador, Código de Rastreamento, Transportadora
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 📊 CONTAS MERCADO LIVRE */}
      <Collapsible
        open={categoriasAbertas.includes('contas')}
        onOpenChange={() => toggleCategoria('contas')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <div className="flex items-center gap-2">
            <span className="font-medium">Contas Mercado Livre</span>
            {filtros.contasSelecionadas.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {filtros.contasSelecionadas.length}
              </Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('contas') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-2">
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
        </CollapsibleContent>
      </Collapsible>

      {/* 📅 FILTROS DE DATA */}
      <Collapsible
        open={categoriasAbertas.includes('datas')}
        onOpenChange={() => toggleCategoria('datas')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Período</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('datas') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => onFiltrosChange({ dataInicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => onFiltrosChange({ dataFim: e.target.value })}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 🎯 STATUS E CLASSIFICAÇÃO */}
      <Collapsible
        open={categoriasAbertas.includes('status')}
        onOpenChange={() => toggleCategoria('status')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Status e Classificação</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('status') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="statusClaim">Status</Label>
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

          <div>
            <Label htmlFor="tipoClaim">Tipo de Claim</Label>
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
        </CollapsibleContent>
      </Collapsible>

      {/* 💰 FILTROS FINANCEIROS */}
      <Collapsible
        open={categoriasAbertas.includes('financeiro')}
        onOpenChange={() => toggleCategoria('financeiro')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Financeiro</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('financeiro') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valorRetidoMin">Valor Mínimo (R$)</Label>
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
              <Label htmlFor="valorRetidoMax">Valor Máximo (R$)</Label>
              <Input
                id="valorRetidoMax"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filtros.valorRetidoMax}
                onChange={(e) => onFiltrosChange({ valorRetidoMax: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="responsavelCusto">Responsável pelo Custo</Label>
            <Select value={filtros.responsavelCusto} onValueChange={(value) => onFiltrosChange({ responsavelCusto: value })}>
              <SelectTrigger id="responsavelCusto">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="seller">Vendedor</SelectItem>
                <SelectItem value="buyer">Comprador</SelectItem>
                <SelectItem value="meli">Mercado Livre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 🚚 RASTREAMENTO */}
      <Collapsible
        open={categoriasAbertas.includes('rastreamento')}
        onOpenChange={() => toggleCategoria('rastreamento')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Rastreamento</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('rastreamento') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="temRastreamento">Tem Rastreamento?</Label>
            <Select value={filtros.temRastreamento} onValueChange={(value) => onFiltrosChange({ temRastreamento: value })}>
              <SelectTrigger id="temRastreamento">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="statusRastreamento">Status do Rastreamento</Label>
            <Select value={filtros.statusRastreamento} onValueChange={(value) => onFiltrosChange({ statusRastreamento: value })}>
              <SelectTrigger id="statusRastreamento">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="in_transit">Em Trânsito</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ⚠️ PRIORIDADE E AÇÃO */}
      <Collapsible
        open={categoriasAbertas.includes('prioridade')}
        onOpenChange={() => toggleCategoria('prioridade')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Prioridade e Ação</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('prioridade') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="nivelPrioridade">Nível de Prioridade</Label>
            <Select value={filtros.nivelPrioridade} onValueChange={(value) => onFiltrosChange({ nivelPrioridade: value })}>
              <SelectTrigger id="nivelPrioridade">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="acaoSellerNecessaria">Ação do Vendedor Necessária?</Label>
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

          <div>
            <Label htmlFor="emMediacao">Em Mediação?</Label>
            <Select value={filtros.emMediacao} onValueChange={(value) => onFiltrosChange({ emMediacao: value })}>
              <SelectTrigger id="emMediacao">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="escaladoParaML">Escalado para ML?</Label>
            <Select value={filtros.escaladoParaML} onValueChange={(value) => onFiltrosChange({ escaladoParaML: value })}>
              <SelectTrigger id="escaladoParaML">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ⏰ PRAZOS */}
      <Collapsible
        open={categoriasAbertas.includes('prazos')}
        onOpenChange={() => toggleCategoria('prazos')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Prazos</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('prazos') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="prazoVencido">Prazo Vencido?</Label>
            <Select value={filtros.prazoVencido} onValueChange={(value) => onFiltrosChange({ prazoVencido: value })}>
              <SelectTrigger id="prazoVencido">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="slaNaoCumprido">SLA Não Cumprido?</Label>
            <Select value={filtros.slaNaoCumprido} onValueChange={(value) => onFiltrosChange({ slaNaoCumprido: value })}>
              <SelectTrigger id="slaNaoCumprido">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 📈 MÉTRICAS */}
      <Collapsible
        open={categoriasAbertas.includes('metricas')}
        onOpenChange={() => toggleCategoria('metricas')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Métricas</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('metricas') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="eficienciaResolucao">Eficiência de Resolução</Label>
            <Select value={filtros.eficienciaResolucao} onValueChange={(value) => onFiltrosChange({ eficienciaResolucao: value })}>
              <SelectTrigger id="eficienciaResolucao">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="excelente">Excelente</SelectItem>
                <SelectItem value="boa">Boa</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="ruim">Ruim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scoreQualidadeMin">Score de Qualidade Mínimo</Label>
            <Input
              id="scoreQualidadeMin"
              type="number"
              min="0"
              max="100"
              placeholder="0-100"
              value={filtros.scoreQualidadeMin}
              onChange={(e) => onFiltrosChange({ scoreQualidadeMin: e.target.value })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 📎 ANEXOS E COMUNICAÇÃO */}
      <Collapsible
        open={categoriasAbertas.includes('comunicacao')}
        onOpenChange={() => toggleCategoria('comunicacao')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
          <span className="font-medium">Anexos e Comunicação</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas.includes('comunicacao') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div>
            <Label htmlFor="temAnexos">Tem Anexos?</Label>
            <Select value={filtros.temAnexos} onValueChange={(value) => onFiltrosChange({ temAnexos: value })}>
              <SelectTrigger id="temAnexos">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mensagensNaoLidasMin">Mínimo de Mensagens Não Lidas</Label>
            <Input
              id="mensagensNaoLidasMin"
              type="number"
              min="0"
              placeholder="0"
              value={filtros.mensagensNaoLidasMin}
              onChange={(e) => onFiltrosChange({ mensagensNaoLidasMin: e.target.value })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
