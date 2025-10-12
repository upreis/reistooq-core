import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp, Award, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReputationTabProps {
  devolucao: any;
}

export const ReputationTab: React.FC<ReputationTabProps> = ({ devolucao }) => {
  const sellerRep = devolucao?.seller_reputation || {};
  const buyerRep = devolucao?.buyer_reputation || {};

  const getReputationColor = (level: string) => {
    const colors: any = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      'light_green': 'bg-lime-500',
      orange: 'bg-orange-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  const ReputationCard = ({ title, reputation, type }: { title: string; reputation: any; type: 'seller' | 'buyer' }) => {
    if (!reputation || Object.keys(reputation).length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Dados de reputação não disponíveis</p>
          </CardContent>
        </Card>
      );
    }

    const transactions = reputation.transactions || {};
    const metrics = reputation.metrics || {};
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nível de Reputação */}
          {reputation.level_id && (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getReputationColor(reputation.level_id)} flex items-center justify-center`}>
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold capitalize">{reputation.level_id.replace('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">Nível de Reputação</p>
              </div>
            </div>
          )}

          {/* Score de Reputação */}
          {reputation.power_seller_status && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Power Seller</p>
                <Badge variant={reputation.power_seller_status === 'platinum' ? 'default' : 'secondary'}>
                  {reputation.power_seller_status}
                </Badge>
              </div>
            </div>
          )}

          {/* Transações */}
          {transactions.total && (
            <div className="space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Histórico de Transações
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{transactions.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                {transactions.completed && (
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{transactions.completed}</p>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                  </div>
                )}
                {transactions.canceled && (
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{transactions.canceled}</p>
                    <p className="text-sm text-muted-foreground">Canceladas</p>
                  </div>
                )}
                {transactions.ratings && (
                  <div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <p className="text-2xl font-bold">{transactions.ratings.positive || 0}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Avaliações Positivas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Métricas de Performance */}
          {metrics.sales && (
            <div className="space-y-3">
              <p className="font-semibold">Métricas de Vendas</p>
              <div className="space-y-2">
                {metrics.sales.period && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Vendas ({metrics.sales.period})</span>
                      <span className="font-semibold">{metrics.sales.completed || 0}</span>
                    </div>
                    <Progress value={Math.min((metrics.sales.completed / 100) * 100, 100)} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Claims e Disputas */}
          {metrics.claims && (
            <div className="space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Claims
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-semibold">{metrics.claims.rate || 0}%</p>
                    <p className="text-muted-foreground">Taxa de Claims</p>
                  </div>
                </div>
                {metrics.claims.value !== undefined && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-semibold">{metrics.claims.value}</p>
                      <p className="text-muted-foreground">Total</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reclamações Mediadas */}
          {metrics.mediations && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="font-semibold text-orange-600 dark:text-orange-400">Mediações</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{metrics.mediations.total || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taxa</p>
                  <p className="font-semibold">{metrics.mediations.rate || 0}%</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ReputationCard title="Reputação do Vendedor" reputation={sellerRep} type="seller" />
      <ReputationCard title="Reputação do Comprador" reputation={buyerRep} type="buyer" />
    </div>
  );
};
