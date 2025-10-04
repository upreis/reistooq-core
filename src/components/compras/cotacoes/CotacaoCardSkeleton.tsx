import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader para CotacaoCard
 * Usado durante carregamento de cotações internacionais
 */
export const CotacaoCardSkeleton: React.FC = () => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Número da cotação */}
            <Skeleton className="h-5 w-32" />
            {/* Descrição */}
            <Skeleton className="h-4 w-full" />
          </div>
          {/* Badge de status */}
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* País e moeda */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Informações adicionais */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        
        {/* Fator multiplicador */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Grid de skeletons para múltiplos cards
 */
export const CotacoesGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CotacaoCardSkeleton key={i} />
      ))}
    </div>
  );
};
