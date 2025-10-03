import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, Eye, Container, DollarSign, TrendingUp } from "lucide-react";
import type { CotacaoInternacional } from '@/utils/cotacaoTypeGuards';

interface CotacaoCardProps {
  cotacao: CotacaoInternacional;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClick: () => void;
  formatCurrency: (value: number, currency?: string) => string;
  getStatusColor: (status: string) => string;
}

const CotacaoCardComponent: React.FC<CotacaoCardProps> = ({
  cotacao,
  isSelectMode,
  isSelected,
  onSelect,
  onClick,
  formatCurrency,
  getStatusColor
}) => {
  // Calcular quantidade de containers baseado no tipo salvo na cotação
  const calcularContainers = () => {
    const totalCBM = cotacao.total_cbm || 0;
    const containerTipo = cotacao.container_tipo || '40';
    
    // Volumes dos containers
    const containerVolumes: Record<string, number> = {
      '20': 33.2,
      '40': 67.7
    };
    
    const containerVolume = containerVolumes[containerTipo] || 67.7;
    return totalCBM > 0 ? Math.ceil(totalCBM / containerVolume) : 0;
  };

  const containers = calcularContainers();
  const containerTipo = cotacao.container_tipo || '40';

  return (
    <Card 
      className={`relative cursor-pointer hover:shadow-md transition-all ${
        isSelectMode 
          ? isSelected 
            ? 'ring-2 ring-primary bg-primary/5' 
            : 'hover:ring-1 hover:ring-border'
          : ''
      }`}
      onClick={(e) => {
        if (isSelectMode) {
          e.stopPropagation();
          onSelect(cotacao.id!);
        } else {
          onClick();
        }
      }}
    >
      {isSelectMode && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(cotacao.id!);
            }}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{cotacao.numero_cotacao}</CardTitle>
          <Badge className={`text-white ${getStatusColor(cotacao.status)}`}>
            {cotacao.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {cotacao.descricao}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Datas e Quantidades */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Abertura</span>
              <span className="font-medium">{new Date(cotacao.data_abertura).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          
          {cotacao.data_fechamento && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Previsão</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{new Date(cotacao.data_fechamento).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Produtos e Containers */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-500 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Produtos</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">{(cotacao.total_quantidade || 0).toLocaleString('pt-BR')} itens</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Container className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Containers {containerTipo}'</span>
              <span className="font-semibold text-orange-600">{containers}</span>
            </div>
          </div>
        </div>
        
        {/* Valores */}
        <div className="space-y-2 pt-2 border-t">
          {/* Moeda de Origem */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-muted-foreground">{cotacao.moeda_origem}:</span>
            </div>
            <span className="font-medium">{formatCurrency(cotacao.total_valor_origem || 0, cotacao.moeda_origem)}</span>
          </div>

          {/* USD */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">USD:</span>
            </div>
            <span className="font-semibold text-green-600">
              $ {(cotacao.total_valor_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* BRL */}
          <div className="flex items-center justify-between text-sm bg-primary/5 -mx-4 px-4 py-2 rounded">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Total BRL:</span>
            </div>
            <span className="font-bold text-primary text-base">
              {formatCurrency(cotacao.total_valor_brl || 0)}
            </span>
          </div>
        </div>
        
        {!isSelectMode && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              Ver Produtos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Memoizar para evitar re-renders desnecessários
export const CotacaoCard = memo(CotacaoCardComponent);
