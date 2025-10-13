import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, TrendingUp, Percent, CreditCard, Calendar, AlertCircle, Package, Truck } from "lucide-react";
import { DevolucaoAvancada } from "@/features/devolucoes/types/devolucao-avancada.types";

interface FinancialDetailsTabProps {
  devolucao: DevolucaoAvancada;
}

export function FinancialDetailsTab({ devolucao }: FinancialDetailsTabProps) {
  // Verificar se há dados financeiros detalhados
  const hasAdvancedFinancialData = devolucao.descricao_custos && typeof devolucao.descricao_custos === 'object';

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: devolucao.moeda_reembolso || 'BRL'
    }).format(value);
  };

  const getImpactColor = (value: number | null) => {
    if (!value) return 'text-gray-600 dark:text-gray-400';
    return value < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  };

  const getImpactIcon = (value: number | null) => {
    if (!value) return null;
    return value < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />;
  };

  if (!hasAdvancedFinancialData) {
    // Exibir dados financeiros básicos
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Informações Financeiras Básicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor Retido</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(devolucao.valor_retido)}
                </p>
              </div>
              
              {devolucao.valor_compensacao && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor de Compensação</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(devolucao.valor_compensacao)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 Sincronize novamente para obter dados financeiros detalhados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extrair dados do breakdown detalhado
  const breakdown = devolucao.descricao_custos as any;
  const produto = breakdown.produto || {};
  const frete = breakdown.frete || {};
  const taxas = breakdown.taxas || {};
  const resumo = breakdown.resumo || {};

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor Total Reembolsado</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(devolucao.valor_reembolso_total)}
              </p>
              <Badge variant="secondary" className="mt-2">
                {devolucao.moeda_reembolso || 'BRL'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Impacto para o Vendedor
                {devolucao.impacto_financeiro_vendedor && devolucao.impacto_financeiro_vendedor < 0 && (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
              </p>
              <p className={`text-3xl font-bold flex items-center gap-2 ${getImpactColor(devolucao.impacto_financeiro_vendedor)}`}>
                {getImpactIcon(devolucao.impacto_financeiro_vendedor)}
                {formatCurrency(Math.abs(devolucao.impacto_financeiro_vendedor || 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(devolucao.impacto_financeiro_vendedor || 0) < 0 ? 'Prejuízo' : 'Benefício'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custo Logístico Total</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(devolucao.custo_logistico_total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown de Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalhamento do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor Original</p>
                <p className="text-xl font-bold">
                  {formatCurrency(produto.valor_original)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor Reembolsado</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(produto.valor_reembolsado)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Percent className="w-4 h-4" />
                  Percentual Reembolsado
                </p>
                <p className="text-xl font-bold">
                  {produto.percentual_reembolsado || 0}%
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(produto.percentual_reembolsado || 0, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown de Frete */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Custos de Logística e Frete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Frete Original</p>
              <p className="text-lg font-bold">
                {formatCurrency(frete.valor_original)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Frete Reembolsado</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(frete.valor_reembolsado)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Custo Devolução</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(frete.custo_devolucao)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Logística</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(frete.custo_total_logistica)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown de Taxas ML */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Taxas Mercado Livre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxa ML Original</p>
              <p className="text-lg font-bold">
                {formatCurrency(taxas.taxa_ml_original)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxa ML Reembolsada</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(taxas.taxa_ml_reembolsada)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxa ML Retida</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(taxas.taxa_ml_retida)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Taxas reembolsadas são devolvidas ao vendedor pelo Mercado Livre
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Informações de Reembolso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Método de Reembolso</p>
              <Badge variant="outline" className="text-sm">
                {devolucao.metodo_reembolso || 'N/A'}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Moeda</p>
              <Badge variant="secondary">
                {devolucao.moeda_reembolso || 'BRL'}
              </Badge>
            </div>

            {devolucao.data_processamento_reembolso && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Data de Processamento
                </p>
                <p className="text-sm font-medium">
                  {new Date(devolucao.data_processamento_reembolso).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
