/**
 * 🆕 ABA DE REASONS ENRIQUECIDA
 * Mostra dados de reasons detalhados salvos em dados_reasons (JSONB)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface ReasonsEnhancedTabProps {
  devolucao: any;
}

export const ReasonsEnhancedTab: React.FC<ReasonsEnhancedTabProps> = ({ devolucao }) => {
  const reasonsData = devolucao.dados_reasons;
  
  if (!reasonsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado detalhado de motivos disponível para esta devolução</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Detalhes do Motivo da Devolução
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reasonsData.reason_id && (
            <div>
              <span className="text-sm font-semibold">ID do Motivo:</span>
              <p className="font-mono text-sm mt-1">
                <Badge variant="outline">{reasonsData.reason_id}</Badge>
              </p>
            </div>
          )}
          
          {reasonsData.name && (
            <div>
              <span className="text-sm font-semibold">Nome:</span>
              <p className="mt-1">{reasonsData.name}</p>
            </div>
          )}
          
          {reasonsData.detail && (
            <div>
              <span className="text-sm font-semibold">Detalhes:</span>
              <p className="text-sm text-muted-foreground mt-1">{reasonsData.detail}</p>
            </div>
          )}
          
          {reasonsData.flow && (
            <div>
              <span className="text-sm font-semibold">Fluxo:</span>
              <div className="mt-1">
                <Badge variant="secondary">{reasonsData.flow}</Badge>
              </div>
            </div>
          )}
          
          {reasonsData.expected_resolutions && (
            <div>
              <span className="text-sm font-semibold">Resoluções Esperadas:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(reasonsData.expected_resolutions) ? (
                  reasonsData.expected_resolutions.map((resolution: string, idx: number) => (
                    <Badge key={idx} variant="default" className="bg-blue-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {resolution}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma</span>
                )}
              </div>
            </div>
          )}

          {/* Dados brutos completos */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Ver dados completos (JSON)
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
              {JSON.stringify(reasonsData, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};
