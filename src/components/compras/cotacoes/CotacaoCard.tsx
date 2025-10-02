import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, Eye } from "lucide-react";
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
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(cotacao.data_abertura).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{cotacao.total_quantidade || 0} itens</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Origem ({cotacao.moeda_origem}):</span>
            <span>{formatCurrency(cotacao.total_valor_origem || 0, cotacao.moeda_origem)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Total BRL:</span>
            <span>{formatCurrency(cotacao.total_valor_brl || 0)}</span>
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
