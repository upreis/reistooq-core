/**
 * ⚖️ ABA DE RESOLUÇÃO
 * FASE 4.2: Informações sobre a resolução do claim
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReclamacoesResolucaoTabProps {
  claim: any;
}

export function ReclamacoesResolucaoTab({ claim }: ReclamacoesResolucaoTabProps) {
  if (!claim.resolution_type) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Esta reclamação ainda não foi resolvida</p>
      </div>
    );
  }

  const getResolutionIcon = () => {
    if (claim.resolution_benefited === 'buyer') {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (claim.resolution_benefited === 'seller') {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    return <Clock className="h-6 w-6 text-yellow-500" />;
  };

  const getBenefitedBadge = (benefited: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      buyer: { label: 'Comprador', variant: 'default' },
      seller: { label: 'Vendedor', variant: 'secondary' },
      mediator: { label: 'Mediador', variant: 'outline' }
    };
    
    const data = config[benefited] || { label: benefited, variant: 'outline' };
    return <Badge variant={data.variant}>{data.label}</Badge>;
  };

  const getResolutionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      refund: 'Reembolso',
      replacement: 'Substituição',
      return: 'Devolução',
      discount: 'Desconto',
      none: 'Sem Resolução'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
        {getResolutionIcon()}
        <div>
          <h3 className="font-semibold text-lg">Reclamação Resolvida</h3>
          <p className="text-sm text-muted-foreground">
            Resolução aplicada em {format(new Date(claim.resolution_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Informações principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipo de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {getResolutionTypeLabel(claim.resolution_type)}
              </span>
            </div>
            {claim.resolution_subtype && (
              <p className="text-sm text-muted-foreground mt-1">
                Subtipo: {claim.resolution_subtype}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Beneficiado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getBenefitedBadge(claim.resolution_benefited)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valores */}
      {claim.resolution_amount && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor da Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {claim.amount_currency} {claim.resolution_amount.toFixed(2)}
            </p>
            {claim.amount_value && (
              <p className="text-sm text-muted-foreground mt-1">
                Valor original da reclamação: {claim.amount_currency} {claim.amount_value.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Motivo da resolução */}
      {claim.resolution_reason && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Motivo da Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{claim.resolution_reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="text-sm font-medium">Reclamação Criada</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(claim.date_created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {claim.last_updated && claim.last_updated !== claim.date_created && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Última Atualização</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(claim.last_updated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-medium">Resolução Aplicada</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(claim.resolution_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações adicionais do claim */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Informações da Reclamação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">ID do Claim</p>
              <p className="font-medium">{claim.claim_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge>{claim.status}</Badge>
            </div>
            {claim.reason_name && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Motivo da Reclamação</p>
                <p className="font-medium">{claim.reason_name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
