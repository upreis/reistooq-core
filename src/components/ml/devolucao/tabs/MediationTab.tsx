import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Users, AlertCircle, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { formatDate } from '@/features/devolucoes/utils/extractDevolucaoData';

interface MediationTabProps {
  devolucao: any;
}

export const MediationTab: React.FC<MediationTabProps> = ({ devolucao }) => {
  const claimDetails = devolucao?.claim_details || devolucao?.dados_claim?.claim_details;
  const mediationDetails = devolucao?.mediation_details || devolucao?.dados_claim?.mediation_details;
  const returnsV2 = devolucao?.return_details_v2 || devolucao?.dados_claim?.return_details_v2;
  const returnsV1 = devolucao?.return_details_v1 || devolucao?.dados_claim?.return_details_v1;
  const changeDetails = devolucao?.change_details || devolucao?.dados_claim?.change_details;

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      open: { variant: 'default', label: 'Aberto' },
      closed: { variant: 'secondary', label: 'Fechado' },
      resolved: { variant: 'default', label: 'Resolvido' },
      pending: { variant: 'outline', label: 'Pendente' }
    };
    const config = statusMap[status?.toLowerCase()] || { variant: 'outline', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Status da Mediação */}
      {claimDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Detalhes do Claim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                {getStatusBadge(claimDetails.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                <Badge variant="outline">{claimDetails.type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estágio</p>
                <Badge>{claimDetails.stage}</Badge>
              </div>
              {claimDetails.reason_id && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Motivo</p>
                  <p className="text-sm font-medium">{claimDetails.reason_id}</p>
                </div>
              )}
              {claimDetails.date_created && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data de Criação</p>
                  <p className="text-sm font-medium">{formatDate(claimDetails.date_created)}</p>
                </div>
              )}
              {claimDetails.last_updated && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
                  <p className="text-sm font-medium">{formatDate(claimDetails.last_updated)}</p>
                </div>
              )}
            </div>

            {/* Players/Participantes */}
            {claimDetails.players && claimDetails.players.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participantes
                </p>
                <div className="space-y-2">
                  {claimDetails.players.map((player: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          player.role === 'complainant' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          player.role === 'respondent' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{player.role}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.type === 'buyer' ? 'Comprador' : player.type === 'seller' ? 'Vendedor' : 'Mediador ML'}
                          </p>
                        </div>
                      </div>
                      {player.available_actions && player.available_actions.length > 0 && (
                        <Badge variant="outline">
                          {player.available_actions.length} ações disponíveis
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolução */}
            {claimDetails.resolution && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Resolução
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {claimDetails.resolution.reason && (
                    <div>
                      <p className="text-muted-foreground">Motivo</p>
                      <p className="font-medium">{claimDetails.resolution.reason}</p>
                    </div>
                  )}
                  {claimDetails.resolution.closed_by && (
                    <div>
                      <p className="text-muted-foreground">Fechado por</p>
                      <p className="font-medium capitalize">{claimDetails.resolution.closed_by}</p>
                    </div>
                  )}
                  {claimDetails.resolution.date_created && (
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">{formatDate(claimDetails.resolution.date_created)}</p>
                    </div>
                  )}
                  {claimDetails.resolution.applied_coverage !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Cobertura Aplicada</p>
                      <Badge variant={claimDetails.resolution.applied_coverage ? 'default' : 'secondary'}>
                        {claimDetails.resolution.applied_coverage ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detalhes de Returns V2 */}
      {returnsV2 && returnsV2.results && returnsV2.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Returns (V2)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {returnsV2.results.map((returnItem: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Return ID: {returnItem.id}</p>
                    {getStatusBadge(returnItem.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {returnItem.estimated_delivery_date && (
                      <div>
                        <p className="text-muted-foreground">Data Estimada de Entrega</p>
                        <p className="font-medium">{formatDate(returnItem.estimated_delivery_date)}</p>
                      </div>
                    )}
                    {returnItem.refund_status && (
                      <div>
                        <p className="text-muted-foreground">Status do Reembolso</p>
                        <Badge variant="outline">{returnItem.refund_status}</Badge>
                      </div>
                    )}
                    {returnItem.tracking_number && (
                      <div>
                        <p className="text-muted-foreground">Rastreamento</p>
                        <p className="font-mono text-xs">{returnItem.tracking_number}</p>
                      </div>
                    )}
                    {returnItem.carrier && (
                      <div>
                        <p className="text-muted-foreground">Transportadora</p>
                        <p className="font-medium">{returnItem.carrier}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes de Troca */}
      {changeDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Detalhes da Troca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {changeDetails.status && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(changeDetails.status)}
                </div>
              )}
              {changeDetails.estimated_delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Entrega Estimada</p>
                  <p className="text-sm font-medium">{formatDate(changeDetails.estimated_delivery_date)}</p>
                </div>
              )}
            </div>

            {changeDetails.substitute_product && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="font-semibold mb-2 text-blue-700 dark:text-blue-400">Produto de Troca</p>
                <div className="space-y-2">
                  <p className="font-medium">{changeDetails.substitute_product.title}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {changeDetails.substitute_product.id && (
                      <div>
                        <p className="text-muted-foreground">ID</p>
                        <p className="font-mono">{changeDetails.substitute_product.id}</p>
                      </div>
                    )}
                    {changeDetails.price_difference !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Diferença de Preço</p>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                          R$ {changeDetails.price_difference.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mediação ML */}
      {mediationDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Mediação Mercado Livre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediationDetails.status && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(mediationDetails.status)}
                </div>
              )}
              {devolucao?.mediador_ml && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mediador</p>
                  <p className="text-sm font-medium">{devolucao.mediador_ml}</p>
                </div>
              )}
              {devolucao?.data_inicio_mediacao && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Início da Mediação</p>
                  <p className="text-sm font-medium">{formatDate(devolucao.data_inicio_mediacao)}</p>
                </div>
              )}
              {devolucao?.resultado_mediacao && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Resultado</p>
                  <Badge>{devolucao.resultado_mediacao}</Badge>
                </div>
              )}
            </div>

            {mediationDetails.resolution && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="font-semibold mb-2 text-purple-700 dark:text-purple-400">Resolução da Mediação</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {mediationDetails.resolution.benefited && mediationDetails.resolution.benefited.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">Beneficiado</p>
                      <p className="font-medium capitalize">{mediationDetails.resolution.benefited.join(', ')}</p>
                    </div>
                  )}
                  {mediationDetails.resolution.applied_coverage !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Cobertura Aplicada</p>
                      <Badge variant={mediationDetails.resolution.applied_coverage ? 'default' : 'secondary'}>
                        {mediationDetails.resolution.applied_coverage ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sem dados */}
      {!claimDetails && !mediationDetails && !returnsV2 && !changeDetails && (
        <Card>
          <CardContent className="p-8 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum dado de mediação ou return disponível</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
