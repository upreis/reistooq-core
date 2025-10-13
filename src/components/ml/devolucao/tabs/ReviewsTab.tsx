import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Package, FileCheck, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/features/devolucoes/utils/extractDevolucaoData';

interface ReviewsTabProps {
  devolucao: any;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ devolucao }) => {
  const hasReview = devolucao?.review_id || devolucao?.review_status || devolucao?.review_result;
  
  if (!hasReview) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum review disponível para esta devolução.
        </AlertDescription>
      </Alert>
    );
  }

  const getResultIcon = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'rejected':
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'rejected':
      case 'denied':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'partial':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Geral do Review */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Status do Review</p>
                <Badge variant="outline" className="mt-1">
                  {devolucao.review_status || 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {getResultIcon(devolucao.review_result)}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Resultado</p>
                <Badge 
                  variant={devolucao.review_result === 'approved' ? 'default' : 
                          devolucao.review_result === 'rejected' ? 'destructive' : 'secondary'}
                  className="mt-1"
                >
                  {devolucao.review_result || 'Pendente'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Score de Qualidade</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-semibold text-lg">{devolucao.score_qualidade || devolucao.review_quality_score || 'N/A'}</p>
                  {(devolucao.score_qualidade || devolucao.review_quality_score) && (
                    <div className={`h-2 w-16 rounded-full ${
                      (devolucao.score_qualidade || devolucao.review_quality_score) >= 80 ? 'bg-green-500' :
                      (devolucao.score_qualidade || devolucao.review_quality_score) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data de Início */}
      {devolucao.data_inicio_review && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Início do Review</p>
                <p className="font-medium">{formatDate(devolucao.data_inicio_review)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Problemas Encontrados */}
      {devolucao.problemas_encontrados && devolucao.problemas_encontrados.length > 0 && (
        <Card className={getResultColor('rejected')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Problemas Encontrados ({devolucao.problemas_encontrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devolucao.problemas_encontrados.map((problema: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-red-600 dark:text-red-400">{problema.type || 'Problema'}</p>
                    <Badge variant="outline" className="text-xs">
                      {problema.severity || 'medium'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{problema.description}</p>
                  {problema.evidence && (
                    <a 
                      href={problema.evidence} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                    >
                      Ver evidência →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Necessárias */}
      {devolucao.acoes_necessarias_review && devolucao.acoes_necessarias_review.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Ações Necessárias ({devolucao.acoes_necessarias_review.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devolucao.acoes_necessarias_review.map((acao: any, index: number) => (
                <div key={index} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{acao.action}</p>
                    <Badge 
                      variant={acao.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {acao.priority || 'normal'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{acao.description}</p>
                  {acao.deadline && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      Prazo: {formatDate(acao.deadline)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Ação Manual */}
      {devolucao.necessita_acao_manual && (
        <Alert className="border-orange-500">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            ⚠️ Esta devolução requer ação manual do vendedor. Verifique as ações necessárias acima.
          </AlertDescription>
        </Alert>
      )}

      {/* Review ID */}
      {devolucao.review_id && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Review ID</p>
            <p className="font-mono text-sm mt-1">{devolucao.review_id}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
