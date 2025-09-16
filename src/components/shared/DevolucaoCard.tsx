import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevolucaoCardProps {
  devolucao: {
    id: string;
    order_id: string;
    produto_titulo?: string;
    sku?: string;
    status_devolucao?: string;
    valor_retido?: number;
    comprador_nickname?: string;
    data_criacao: string;
    quantidade?: number;
  };
  onClick?: () => void;
}

const statusStyles = {
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  with_claims: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
};

const getStatusVariant = (status?: string) => {
  return statusStyles[status as keyof typeof statusStyles] || statusStyles.default;
};

export function DevolucaoCard({ devolucao, onClick }: DevolucaoCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md",
        onClick && "hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-medium truncate">
              {devolucao.order_id}
            </span>
          </div>
          <Badge className={cn("text-xs", getStatusVariant(devolucao.status_devolucao))}>
            {devolucao.status_devolucao || 'N/A'}
          </Badge>
        </div>
        <h3 className="font-medium text-sm leading-tight line-clamp-2" title={devolucao.produto_titulo}>
          {devolucao.produto_titulo || 'Produto não identificado'}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0 pb-2">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="h-3 w-3" />
              <span className="text-xs">SKU</span>
            </div>
            <p className="font-mono text-xs truncate" title={devolucao.sku}>
              {devolucao.sku || 'N/A'}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">Valor</span>
            </div>
            <p className="font-medium text-xs">
              R$ {Number(devolucao.valor_retido || 0).toFixed(2)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="text-xs">Comprador</span>
            </div>
            <p className="text-xs truncate" title={devolucao.comprador_nickname}>
              {devolucao.comprador_nickname || 'N/A'}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="h-3 w-3" />
              <span className="text-xs">Qtd</span>
            </div>
            <p className="text-xs">
              {devolucao.quantidade || 0}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(devolucao.data_criacao).toLocaleDateString('pt-BR')}
        </div>
        <Badge variant="outline" className="text-xs">
          {devolucao.status_devolucao === 'cancelled' ? 'Cancelamento' : 
           devolucao.status_devolucao === 'with_claims' ? 'Com Claims' : 
           'Concluída'}
        </Badge>
      </CardFooter>
    </Card>
  );
}