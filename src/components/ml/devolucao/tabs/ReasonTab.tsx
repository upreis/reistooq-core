/**
 * 🔍 ABA DE REASONS API - FASE 4
 * Exibe os motivos detalhados das reclamações
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import { DevolucaoAvancada } from "@/features/devolucoes/types/devolucao-avancada.types";

interface ReasonTabProps {
  devolucao: DevolucaoAvancada;
}

export function ReasonTab({ devolucao }: ReasonTabProps) {
  if (!devolucao.reason_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Motivo da Reclamação
          </CardTitle>
          <CardDescription>Dados do motivo não disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta devolução não possui informações detalhadas sobre o motivo.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mapear prioridade para cor
  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Mapear categoria para ícone
  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'arrependimento':
        return <Info className="h-4 w-4" />;
      case 'defeito':
        return <XCircle className="h-4 w-4" />;
      case 'diferente':
        return <AlertCircle className="h-4 w-4" />;
      case 'incompleto':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Traduzir tipo
  const translateType = (type: string | null) => {
    switch (type) {
      case 'buyer_initiated':
        return 'Iniciado pelo Comprador';
      case 'seller_initiated':
        return 'Iniciado pelo Vendedor';
      case 'ml_initiated':
        return 'Iniciado pelo Mercado Livre';
      default:
        return type || 'Não especificado';
    }
  };

  // Traduzir prioridade
  const translatePriority = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority || 'Não especificada';
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getCategoryIcon(devolucao.reason_category)}
            Informações do Motivo
          </CardTitle>
          <CardDescription>Detalhes completos do motivo da reclamação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID do Motivo</p>
              <p className="text-sm mt-1 font-mono">{devolucao.reason_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Técnico</p>
              <p className="text-sm mt-1 font-mono">{devolucao.reason_name || 'Não especificado'}</p>
            </div>
          </div>

          {devolucao.reason_detail && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Descrição Detalhada</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">{devolucao.reason_detail}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Categoria</p>
              <Badge variant="outline" className="capitalize">
                {devolucao.reason_category || 'Não categorizado'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Prioridade</p>
              <Badge variant={getPriorityColor(devolucao.reason_priority)}>
                {translatePriority(devolucao.reason_priority)}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Tipo de Iniciação</p>
            <Badge variant="secondary">
              {translateType(devolucao.reason_type)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Resoluções Esperadas */}
      {devolucao.reason_expected_resolutions && devolucao.reason_expected_resolutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Resoluções Esperadas
            </CardTitle>
            <CardDescription>
              Possíveis formas de resolver esta reclamação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {devolucao.reason_expected_resolutions.map((resolution, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{resolution}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regras do Motor */}
      {devolucao.reason_rules_engine && devolucao.reason_rules_engine.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Regras do Motor
            </CardTitle>
            <CardDescription>
              Regras aplicadas pelo sistema do Mercado Livre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {devolucao.reason_rules_engine.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm font-mono">{rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas e Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Análise do Motivo</CardTitle>
          <CardDescription>Insights sobre este tipo de reclamação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Categoria</p>
              <p className="text-2xl font-bold mt-2 capitalize">
                {devolucao.reason_category || 'N/A'}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
              <p className="text-2xl font-bold mt-2 capitalize">
                {translatePriority(devolucao.reason_priority)}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Resoluções</p>
              <p className="text-2xl font-bold mt-2">
                {devolucao.reason_expected_resolutions?.length || 0}
              </p>
            </div>
          </div>

          {devolucao.reason_category === 'arrependimento' && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Insight: Arrependimento do Comprador
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Este tipo de devolução geralmente indica que o produto estava conforme anunciado, 
                mas o comprador mudou de ideia. Considere melhorar a descrição do produto para 
                reduzir expectativas não atendidas.
              </p>
            </div>
          )}

          {devolucao.reason_category === 'defeito' && (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Alerta: Defeito no Produto
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                Produto reportado com defeito. Verifique o controle de qualidade e considere 
                revisar o fornecedor ou processo de armazenamento.
              </p>
            </div>
          )}

          {devolucao.reason_category === 'diferente' && (
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Atenção: Produto Diferente do Anunciado
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                O produto recebido não corresponde ao anúncio. Revise fotos, título e descrição 
                para garantir que representam fielmente o produto.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
