import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { DevolucaoAvancada } from "@/features/devolucoes/types/devolucao-avancada.types";

interface SLAMetricsTabProps {
  devolucao: DevolucaoAvancada;
}

export function SLAMetricsTab({ devolucao }: SLAMetricsTabProps) {
  // Verificar se há dados de SLA
  const hasSLAData = devolucao.sla_cumprido !== null || 
                     devolucao.tempo_primeira_resposta_vendedor !== null ||
                     devolucao.dias_ate_resolucao !== null;

  if (!hasSLAData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma métrica de SLA disponível</p>
          <p className="text-sm mt-2">Sincronize novamente para obter dados atualizados</p>
        </div>
      </div>
    );
  }

  const formatHours = (hours: number | null) => {
    if (!hours) return 'N/A';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getSLAIcon = (cumprido: boolean | null) => {
    if (cumprido === null) return <Clock className="w-5 h-5" />;
    return cumprido ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getEficienciaColor = (eficiencia: string | null) => {
    switch (eficiencia) {
      case 'excelente': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'boa': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'regular': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ruim': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const isApproachingDeadline = () => {
    if (!devolucao.tempo_limite_acao) return false;
    const deadline = new Date(devolucao.tempo_limite_acao);
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining > 0 && hoursRemaining < 24;
  };

  return (
    <div className="space-y-6">
      {/* SLA Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSLAIcon(devolucao.sla_cumprido)}
            Status de SLA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Compliance</p>
              <Badge variant={devolucao.sla_cumprido ? "default" : "destructive"}>
                {devolucao.sla_cumprido ? "SLA Cumprido ✓" : "SLA Violado ✗"}
              </Badge>
            </div>
            {devolucao.eficiencia_resolucao && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Eficiência</p>
                <Badge className={getEficienciaColor(devolucao.eficiencia_resolucao)}>
                  {devolucao.eficiencia_resolucao}
                </Badge>
              </div>
            )}
          </div>

          {isApproachingDeadline() && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Prazo se aproximando
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Ação necessária até {new Date(devolucao.tempo_limite_acao).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas de Tempo de Resposta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tempos de Resposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Primeira Resposta Vendedor</p>
              <p className="text-2xl font-bold">
                {formatHours(devolucao.tempo_primeira_resposta_vendedor)}
              </p>
              <p className="text-xs text-muted-foreground">
                Meta: 48h
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Resposta Comprador</p>
              <p className="text-2xl font-bold">
                {formatHours(devolucao.tempo_resposta_comprador)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Análise ML</p>
              <p className="text-2xl font-bold">
                {formatHours(devolucao.tempo_analise_ml)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Resolução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Métricas de Resolução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dias até Resolução</p>
              <p className="text-2xl font-bold">
                {devolucao.dias_ate_resolucao !== null ? `${devolucao.dias_ate_resolucao}d` : 'Em andamento'}
              </p>
              <p className="text-xs text-muted-foreground">
                Meta: 7 dias
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tempo Total</p>
              <p className="text-2xl font-bold">
                {formatHours(devolucao.tempo_total_resolucao)}
              </p>
            </div>

            {devolucao.data_primeira_acao && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Primeira Ação</p>
                <p className="text-sm font-medium">
                  {new Date(devolucao.data_primeira_acao).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(devolucao.data_primeira_acao).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Consolidado */}
      {devolucao.timeline_consolidado && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devolucao.timeline_consolidado.data_inicio && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Início</span>
                  <span className="text-sm font-medium">
                    {new Date(devolucao.timeline_consolidado.data_inicio).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {devolucao.timeline_consolidado.data_fim && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fim</span>
                  <span className="text-sm font-medium">
                    {new Date(devolucao.timeline_consolidado.data_fim).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {devolucao.timeline_consolidado.duracao_total_dias !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duração Total</span>
                  <span className="text-sm font-medium">
                    {devolucao.timeline_consolidado.duracao_total_dias} dias
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
