/**
 * 🎯 BARRA DE FILTROS AVANÇADA - DEVOLUÇÕES
 * Seleção de múltiplas contas, período e busca
 */

import { useState } from 'react';
import { Search, CalendarIcon, ChevronDown, RefreshCw, Zap, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface MLAccount {
  id: string;
  name: string;
}

interface DevolucaoAdvancedFiltersBarProps {
  accounts: MLAccount[];
  selectedAccountIds: string[];
  onAccountsChange: (ids: string[]) => void;
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBuscar: (fullSync?: boolean) => void;
  isLoading?: boolean;
  onCancel?: () => void;
  apiData?: any[]; // ✅ NOVO: dados brutos da API para exportação
}

export function DevolucaoAdvancedFiltersBar({
  accounts,
  selectedAccountIds,
  onAccountsChange,
  periodo,
  onPeriodoChange,
  searchTerm,
  onSearchChange,
  onBuscar,
  isLoading = false,
  onCancel,
  apiData = []
}: DevolucaoAdvancedFiltersBarProps) {
  const [accountsPopoverOpen, setAccountsPopoverOpen] = useState(false);

  const handleExportJson = () => {
    if (!apiData || apiData.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    const jsonString = JSON.stringify(apiData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devolucoes-ml-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`${apiData.length} devoluções exportadas em JSON`);
  };

  const handleToggleAccount = (accountId: string) => {
    if (selectedAccountIds.includes(accountId)) {
      onAccountsChange(selectedAccountIds.filter(id => id !== accountId));
    } else {
      onAccountsChange([...selectedAccountIds, accountId]);
    }
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccountIds.length === accounts.length) {
      onAccountsChange([]);
    } else {
      onAccountsChange(accounts.map(acc => acc.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Label Filtros */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-60">
          <path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="font-medium">Filtros</span>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
          1
        </span>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Busca Manual */}
        <div className="md:col-span-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Buscar · Manual</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Order ID, Claim ID, Produto..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Contas ML */}
        <div className="md:col-span-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Contas ML · Manual</Label>
          <Popover open={accountsPopoverOpen} onOpenChange={setAccountsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
              >
                <span>
                  {selectedAccountIds.length === 0 
                    ? 'Selecione as contas' 
                    : `${selectedAccountIds.length} selecionada${selectedAccountIds.length > 1 ? 's' : ''}`
                  }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-background" align="start">
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold text-sm">Selecionar Contas</h4>
                  <button
                    onClick={handleSelectAllAccounts}
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedAccountIds.length === accounts.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>

                {/* Lista de Contas */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {accounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(account.id)}
                        onChange={() => handleToggleAccount(account.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {account.name}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t">
                  <Button 
                    onClick={() => setAccountsPopoverOpen(false)}
                    className="w-full"
                    size="sm"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Período de Busca */}
        <div className="md:col-span-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Período de Busca · Data da Venda</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select value={periodo} onValueChange={onPeriodoChange}>
              <SelectTrigger className="pl-9">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="md:col-span-3 space-y-2">
          <Label className="text-xs text-muted-foreground opacity-0">Ação</Label>
          <div className="flex gap-2">
            {/* Botão Exportar JSON */}
            <Button
              onClick={handleExportJson}
              disabled={!apiData || apiData.length === 0}
              variant="outline"
              size="sm"
              className="shrink-0"
              title="Exportar dados brutos JSON"
            >
              <Download className="h-4 w-4" />
            </Button>
            {isLoading && onCancel && (
              <Button
                onClick={onCancel}
                variant="destructive"
                className="flex-1"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </Button>
            )}
            
            {/* Dropdown com opções de sincronização */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isLoading || selectedAccountIds.length === 0}
                  className="flex-1 min-w-[200px] bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                      <span className="font-medium">Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      <span className="font-medium">Sincronizar</span>
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 bg-background">
                <DropdownMenuItem 
                  onClick={() => onBuscar(false)}
                  disabled={isLoading || selectedAccountIds.length === 0}
                  className="cursor-pointer"
                >
                  <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                  <div className="flex-1">
                    <div className="font-medium">Sincronização Rápida</div>
                    <div className="text-xs text-muted-foreground">
                      Busca apenas dados novos (incremental)
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => onBuscar(true)}
                  disabled={isLoading || selectedAccountIds.length === 0}
                  className="cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 mr-2 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">Sincronização Completa</div>
                    <div className="text-xs text-muted-foreground">
                      Recarrega todos os dados (últimos 90 dias)
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
