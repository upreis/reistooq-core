import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Calendar, DollarSign, Globe, Package } from "lucide-react";

interface CotacaoCardProps {
  cotacao: {
    id?: string;
    numero_cotacao: string;
    descricao: string;
    pais_origem: string;
    moeda_origem: string;
    status: string;
    data_abertura: string;
    data_fechamento?: string;
    total_quantidade?: number;
    total_valor_usd?: number;
    total_peso_kg?: number;
    total_cbm?: number;
  };
  onView: (cotacao: any) => void;
  onEdit: (cotacao: any) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isSelectMode?: boolean;
}

/**
 * Componente otimizado para exibir informações de uma cotação internacional
 * Memoizado para evitar re-renders desnecessários
 */
export const CotacaoCard = memo<CotacaoCardProps>(({
  cotacao,
  onView,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  isSelectMode = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'rascunho': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'enviada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'aprovada': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejeitada': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelada': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value?: number, currency = 'USD') => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatNumber = (value?: number, unit = '') => {
    if (!value) return 'N/A';
    return `${new Intl.NumberFormat('pt-BR').format(value)}${unit}`;
  };

  return (
    <Card 
      className={`relative transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary shadow-md' : ''
      } ${isSelectMode ? 'cursor-pointer' : ''}`}
      onClick={isSelectMode && onSelect ? () => onSelect(cotacao.id!) : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground truncate">
              {cotacao.numero_cotacao}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {cotacao.descricao}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`ml-2 shrink-0 ${getStatusColor(cotacao.status)}`}
          >
            {cotacao.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe className="w-4 h-4 mr-2" />
              <span className="font-medium">{cotacao.pais_origem}</span>
              <span className="ml-1">({cotacao.moeda_origem})</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(cotacao.data_abertura).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-end text-sm text-muted-foreground">
              <Package className="w-4 h-4 mr-2" />
              <span>{formatNumber(cotacao.total_quantidade)} itens</span>
            </div>
            <div className="flex items-center justify-end text-sm font-medium text-foreground">
              <DollarSign className="w-4 h-4 mr-1" />
              <span>{formatCurrency(cotacao.total_valor_usd)}</span>
            </div>
          </div>
        </div>

        {/* Resumo físico */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg text-xs">
          <div>
            <span className="text-muted-foreground">Peso:</span>
            <span className="ml-1 font-medium">{formatNumber(cotacao.total_peso_kg, ' kg')}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Volume:</span>
            <span className="ml-1 font-medium">{formatNumber(cotacao.total_cbm, ' m³')}</span>
          </div>
        </div>

        {/* Ações */}
        {!isSelectMode && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(cotacao)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(cotacao)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(cotacao.id!)}
              className="px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CotacaoCard.displayName = 'CotacaoCard';