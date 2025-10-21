/**
 * 🆕 ABA DE CUSTOS ENRIQUECIDA
 * Mostra dados de custos detalhados salvos em dados_costs (JSONB)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

interface CostsEnhancedTabProps {
  devolucao: any;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const CostsEnhancedTab: React.FC<CostsEnhancedTabProps> = ({ devolucao }) => {
  const costsData = devolucao.dados_costs;
  
  if (!costsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado detalhado de custos disponível para esta devolução</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Custos de Envio Detalhados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {costsData.shipping_cost && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold">Custo de Envio</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(costsData.shipping_cost)}
                </p>
              </div>
            )}
            
            {costsData.handling_cost && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold">Custo de Manuseio</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(costsData.handling_cost)}
                </p>
              </div>
            )}
            
            {costsData.total_cost && (
              <div className="p-4 border rounded-lg col-span-2 bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold">Custo Total</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(costsData.total_cost)}
                </p>
              </div>
            )}
          </div>

          {/* Dados brutos completos */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Ver dados completos (JSON)
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
              {JSON.stringify(costsData, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};
