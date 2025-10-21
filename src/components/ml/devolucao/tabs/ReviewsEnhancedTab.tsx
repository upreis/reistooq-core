/**
 * 🆕 ABA DE REVIEWS ENRIQUECIDA
 * Mostra dados de reviews salvos em dados_reviews (JSONB)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ReviewsEnhancedTabProps {
  devolucao: any;
}

export const ReviewsEnhancedTab: React.FC<ReviewsEnhancedTabProps> = ({ devolucao }) => {
  const reviewsData = devolucao.dados_reviews;
  
  if (!reviewsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado de review disponível para esta devolução</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Informações de Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviewsData.review_id && (
            <div>
              <span className="text-sm font-semibold">Review ID:</span>
              <p className="font-mono text-sm">{reviewsData.review_id}</p>
            </div>
          )}
          
          {reviewsData.status && (
            <div>
              <span className="text-sm font-semibold">Status:</span>
              <div className="mt-1">
                <Badge variant={reviewsData.status === 'approved' ? 'default' : 'secondary'}>
                  {reviewsData.status}
                </Badge>
              </div>
            </div>
          )}
          
          {reviewsData.result && (
            <div>
              <span className="text-sm font-semibold">Resultado:</span>
              <p className="mt-1">{reviewsData.result}</p>
            </div>
          )}
          
          {reviewsData.observations && (
            <div>
              <span className="text-sm font-semibold">Observações:</span>
              <p className="text-sm text-muted-foreground mt-1">{reviewsData.observations}</p>
            </div>
          )}

          {/* Dados brutos completos */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Ver dados completos (JSON)
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
              {JSON.stringify(reviewsData, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};
