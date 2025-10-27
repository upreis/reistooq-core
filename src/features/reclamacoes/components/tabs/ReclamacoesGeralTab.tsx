/**
 * 📋 ABA GERAL - Informações básicas da reclamação
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

interface ReclamacoesGeralTabProps {
  claim: any;
}

export function ReclamacoesGeralTab({ claim }: ReclamacoesGeralTabProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (value: number | null, currency: string = 'BRL') => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      opened: { variant: 'default', label: 'Aberta' },
      closed: { variant: 'secondary', label: 'Fechada' },
      under_review: { variant: 'outline', label: 'Em análise' }
    };
    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">ID da Reclamação</p>
            <p className="font-mono text-sm">{claim.claim_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Criação</p>
            <p className="text-sm">{formatDate(claim.date_created)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última Atualização</p>
            <p className="text-sm">{formatDate(claim.last_updated)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status Atual</p>
            <div className="mt-1">{getStatusBadge(claim.status)}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estágio</p>
            <p className="text-sm">{claim.stage || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo</p>
            <Badge variant={claim.type === 'mediation' ? 'destructive' : 'default'}>
              {claim.type === 'mediation' ? 'Mediação' : 'Reclamação'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Motivo da Reclamação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Motivo da Reclamação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">ID do Motivo</p>
            <p className="font-mono text-sm">{claim.reason_id || '-'}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground">Nome do Motivo</p>
            <p className="text-sm font-medium">{claim.reason_name || '-'}</p>
          </div>
          {claim.reason_detail && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Detalhamento</p>
                <p className="text-sm">{claim.reason_detail}</p>
              </div>
            </>
          )}
          {claim.reason_category && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <Badge variant="outline">{claim.reason_category}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Participantes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">👤 Comprador</p>
            <div>
              <p className="text-sm">ID: {claim.buyer_id || '-'}</p>
              <p className="text-sm font-medium">{claim.buyer_nickname || '-'}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">🏪 Vendedor</p>
            <div>
              <p className="text-sm">ID: {claim.seller_id || '-'}</p>
              <p className="text-sm font-medium">{claim.seller_nickname || '-'}</p>
            </div>
          </div>
          {claim.mediator_id && (
            <div className="space-y-2 col-span-2">
              <p className="text-sm font-medium text-muted-foreground">⚖️ Mediador</p>
              <p className="text-sm">ID: {claim.mediator_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Valores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor da Reclamação</p>
            <p className="text-lg font-bold">
              {formatCurrency(claim.amount_value, claim.amount_currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Moeda</p>
            <p className="text-sm">{claim.amount_currency || 'BRL'}</p>
          </div>
          {claim.order_total && (
            <div>
              <p className="text-sm text-muted-foreground">Valor do Pedido Original</p>
              <p className="text-lg font-semibold">
                {formatCurrency(claim.order_total, claim.amount_currency)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pedido Relacionado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pedido Relacionado</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">N.º do Pedido</p>
            <p className="font-mono text-sm">{claim.order_id || '-'}</p>
          </div>
          {claim.order_status && (
            <div>
              <p className="text-sm text-muted-foreground">Status do Pedido</p>
              <Badge variant="outline">{claim.order_status}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolução (se houver) */}
      {claim.resolution_type && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolução</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Resolução</p>
              <Badge variant="secondary">{claim.resolution_type}</Badge>
            </div>
            {claim.resolution_subtype && (
              <div>
                <p className="text-sm text-muted-foreground">Subtipo</p>
                <p className="text-sm">{claim.resolution_subtype}</p>
              </div>
            )}
            {claim.resolution_benefited && (
              <div>
                <p className="text-sm text-muted-foreground">Beneficiado</p>
                <Badge>{claim.resolution_benefited}</Badge>
              </div>
            )}
            {claim.resolution_date && (
              <div>
                <p className="text-sm text-muted-foreground">Data da Resolução</p>
                <p className="text-sm">{formatDate(claim.resolution_date)}</p>
              </div>
            )}
            {claim.resolution_amount && (
              <div>
                <p className="text-sm text-muted-foreground">Valor da Resolução</p>
                <p className="text-lg font-bold">
                  {formatCurrency(claim.resolution_amount, claim.amount_currency)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
