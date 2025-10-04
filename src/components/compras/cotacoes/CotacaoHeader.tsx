import React, { memo } from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, AlertCircle } from "lucide-react";
import ContainerVisualization from '../ContainerVisualization';
import type { CotacaoInternacional } from '@/utils/cotacaoTypeGuards';

interface CotacaoHeaderProps {
  cotacao: CotacaoInternacional;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  selectedCurrency: string;
  onCurrencyChange: (value: string) => void;
  selectedContainer: string;
  onContainerChange: (value: string) => void;
  totaisGerais: {
    total_valor_origem: number;
    total_valor_usd: number;
    total_valor_brl: number;
  };
  dadosBasicos: {
    moeda_origem: string;
  };
  getContainerUsage: (type: 'volume' | 'weight') => number;
  getTotalCBM: () => number;
  getTotalWeight: () => number;
  getStatusColor: (status: string) => string;
  getCurrencySymbol: (code: string) => string;
  availableCurrencies: Array<{ code: string; name: string; flag: string; symbol: string }>;
  containerTypes: Record<string, { name: string; volume: number; maxWeight: number }>;
  onCotacaoChange?: (field: string, value: any) => void;
}

const CotacaoHeaderComponent: React.FC<CotacaoHeaderProps> = ({
  cotacao,
  hasUnsavedChanges,
  isSaving,
  onSave,
  selectedCurrency,
  onCurrencyChange,
  selectedContainer,
  onContainerChange,
  totaisGerais,
  dadosBasicos,
  getContainerUsage,
  getTotalCBM,
  getTotalWeight,
  getStatusColor,
  getCurrencySymbol,
  availableCurrencies,
  containerTypes,
  onCotacaoChange
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex gap-6">
          {/* Coluna esquerda - Informações */}
          <div className="bg-slate-800 text-white p-3 rounded-lg w-80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{cotacao.numero_cotacao}</h3>
                {hasUnsavedChanges && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Alterações não salvas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-white ${getStatusColor(cotacao.status)}`}>
                  {cotacao.status}
                </Badge>
                {hasUnsavedChanges && (
                  <Button
                    onClick={onSave}
                    disabled={isSaving}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-3">{cotacao.descricao}</p>
            
            {/* Resumo de Totais */}
            <div className="space-y-3 text-xs">
              {/* País e Moeda */}
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">País:</span>
                  <span className="font-medium text-white">{cotacao.pais_origem}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Moeda:</span>
                  <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
                    <SelectTrigger className="w-20 h-6 text-xs bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {availableCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <span className="flex items-center gap-2">
                            <span>{currency.flag}</span>
                            <span>{currency.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Previsão de Chegada - Editável */}
              {onCotacaoChange && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="data_fechamento_edit" className="text-slate-400 text-xs whitespace-nowrap">
                    Previsão de Chegada:
                  </Label>
                  <Input
                    id="data_fechamento_edit"
                    type="date"
                    value={cotacao.data_fechamento || ''}
                    onChange={(e) => onCotacaoChange('data_fechamento', e.target.value)}
                    className="h-6 text-xs bg-slate-700 border-slate-600 text-white flex-1"
                  />
                </div>
              )}
        
              {/* Total na moeda de origem */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total {dadosBasicos.moeda_origem}:</span>
                <div className="font-semibold text-blue-400 text-sm">
                  {getCurrencySymbol(dadosBasicos.moeda_origem)} {totaisGerais.total_valor_origem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
        
              {/* Total USD */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total USD:</span>
                <div className="font-semibold text-green-400 text-sm">
                  $ {totaisGerais.total_valor_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              
              {/* Total BRL */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total BRL:</span>
                <div className="font-semibold text-orange-400 text-sm">
                  R$ {totaisGerais.total_valor_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Coluna direita - Container Visualization */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-muted-foreground">Simulação de Contêiner</h4>
              <div className="w-36">
                <Select value={selectedContainer} onValueChange={onContainerChange}>
                  <SelectTrigger className="w-full h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {Object.entries(containerTypes).map(([key, container]) => (
                      <SelectItem key={key} value={key}>
                        {container.name} ({container.volume}m³, {container.maxWeight.toLocaleString()}kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ContainerVisualization
              containerType={containerTypes[selectedContainer].name}
              volumePercentage={getContainerUsage('volume')}
              weightPercentage={getContainerUsage('weight')}
              totalCBM={getTotalCBM()}
              totalWeight={getTotalWeight()}
              maxVolume={containerTypes[selectedContainer].volume}
              maxWeight={containerTypes[selectedContainer].maxWeight}
            />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

// Memoizar para evitar re-renders desnecessários
export const CotacaoHeader = memo(CotacaoHeaderComponent);
