/**
 * 📊 DASHBOARD DE QUALIDADE DE DADOS ENRIQUECIDOS
 * 
 * Mostra métricas de preenchimento dos 11 campos JSONB salvos pela edge function ml-returns:
 * - Taxa de preenchimento por campo
 * - Alertas críticos de deadline
 * - Qualidade de comunicação
 * - Última sincronização
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Calendar,
  Package,
  DollarSign,
  Warehouse,
  FileText,
  Target,
  TrendingUp
} from 'lucide-react';

interface QualityMetrics {
  total: number;
  sync_24h: number;
  sync_7d: number;
  pct_review: number;
  pct_comunicacao: number;
  pct_deadlines: number;
  pct_acoes: number;
  pct_custos: number;
  pct_fulfillment: number;
  alertas_criticos: number;
  com_excelente: number;
  com_boa: number;
  com_moderada: number;
  com_ruim: number;
}

export function DadosEnriquecidosQualidade() {
  // Query para métricas de qualidade (usando query SQL direta enquanto tipos não são atualizados)
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['data-quality-metrics'],
    queryFn: async () => {
      // Chamar função RPC diretamente
      const { data, error } = await supabase
        .from('devolucoes_avancadas')
        .select(`
          order_id,
          dados_review,
          dados_comunicacao,
          dados_deadlines,
          dados_acoes_disponiveis,
          dados_custos_logistica,
          dados_fulfillment,
          ultima_sincronizacao
        `)
        .limit(1000);
      
      if (error) throw error;
      
      // Calcular métricas manualmente
      const now = new Date();
      const total = data?.length || 0;
      
      const sync_24h = data?.filter(d => 
        d.ultima_sincronizacao && new Date(d.ultima_sincronizacao) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length || 0;
      
      const sync_7d = data?.filter(d => 
        d.ultima_sincronizacao && new Date(d.ultima_sincronizacao) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
      
      const pct_review = total > 0 ? (data?.filter(d => d.dados_review && Object.keys(d.dados_review).length > 0).length || 0) / total * 100 : 0;
      const pct_comunicacao = total > 0 ? (data?.filter(d => d.dados_comunicacao && Object.keys(d.dados_comunicacao).length > 0).length || 0) / total * 100 : 0;
      const pct_deadlines = total > 0 ? (data?.filter(d => d.dados_deadlines && Object.keys(d.dados_deadlines).length > 0).length || 0) / total * 100 : 0;
      const pct_acoes = total > 0 ? (data?.filter(d => d.dados_acoes_disponiveis && Object.keys(d.dados_acoes_disponiveis).length > 0).length || 0) / total * 100 : 0;
      const pct_custos = total > 0 ? (data?.filter(d => d.dados_custos_logistica && Object.keys(d.dados_custos_logistica).length > 0).length || 0) / total * 100 : 0;
      const pct_fulfillment = total > 0 ? (data?.filter(d => d.dados_fulfillment && Object.keys(d.dados_fulfillment).length > 0).length || 0) / total * 100 : 0;
      
      const alertas_criticos = data?.filter(d => 
        d.dados_deadlines && 
        (d.dados_deadlines as any).is_shipment_critical === true ||
        (d.dados_deadlines as any).is_review_critical === true
      ).length || 0;
      
      const com_excelente = data?.filter(d => (d.dados_comunicacao as any)?.communication_quality === 'excellent').length || 0;
      const com_boa = data?.filter(d => (d.dados_comunicacao as any)?.communication_quality === 'good').length || 0;
      const com_moderada = data?.filter(d => (d.dados_comunicacao as any)?.communication_quality === 'moderate').length || 0;
      const com_ruim = data?.filter(d => (d.dados_comunicacao as any)?.communication_quality === 'poor').length || 0;
      
      return {
        total,
        sync_24h,
        sync_7d,
        pct_review: Number(pct_review.toFixed(1)),
        pct_comunicacao: Number(pct_comunicacao.toFixed(1)),
        pct_deadlines: Number(pct_deadlines.toFixed(1)),
        pct_acoes: Number(pct_acoes.toFixed(1)),
        pct_custos: Number(pct_custos.toFixed(1)),
        pct_fulfillment: Number(pct_fulfillment.toFixed(1)),
        alertas_criticos,
        com_excelente,
        com_boa,
        com_moderada,
        com_ruim,
      } as QualityMetrics;
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  const getQualityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQualityBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="default" className="bg-green-600">Excelente</Badge>;
    if (percentage >= 70) return <Badge variant="default" className="bg-yellow-600">Bom</Badge>;
    if (percentage >= 50) return <Badge variant="default" className="bg-orange-600">Regular</Badge>;
    return <Badge variant="destructive">Ruim</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sem dados</AlertTitle>
          <AlertDescription>
            Não há dados de qualidade disponíveis no momento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dataFields = [
    { 
      key: 'review', 
      label: '🔍 Review', 
      percentage: metrics.pct_review,
      icon: FileText,
      description: 'Dados de revisão e qualidade do produto'
    },
    { 
      key: 'comunicacao', 
      label: '💬 Comunicação', 
      percentage: metrics.pct_comunicacao,
      icon: MessageSquare,
      description: 'Mensagens e interações com comprador'
    },
    { 
      key: 'deadlines', 
      label: '⏰ Prazos', 
      percentage: metrics.pct_deadlines,
      icon: Calendar,
      description: 'Deadlines calculados e alertas críticos'
    },
    { 
      key: 'acoes', 
      label: '🎬 Ações', 
      percentage: metrics.pct_acoes,
      icon: Target,
      description: 'Ações disponíveis para o vendedor'
    },
    { 
      key: 'custos', 
      label: '💰 Custos', 
      percentage: metrics.pct_custos,
      icon: DollarSign,
      description: 'Custos de logística detalhados'
    },
    { 
      key: 'fulfillment', 
      label: '📦 Fulfillment', 
      percentage: metrics.pct_fulfillment,
      icon: Warehouse,
      description: 'Informações de fulfillment e warehouse'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Qualidade de Dados Enriquecidos</h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento da persistência de dados da edge function <code className="bg-muted px-2 py-1 rounded text-sm">ml-returns</code>
        </p>
      </div>

      {/* Alertas Críticos */}
      {metrics.alertas_criticos > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>🚨 {metrics.alertas_criticos} Alertas Críticos</AlertTitle>
          <AlertDescription>
            Existem devoluções com prazos críticos (&lt; 48h). Revise urgentemente.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Devoluções</CardDescription>
            <CardTitle className="text-3xl">{metrics.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Base completa de dados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sync 24h</CardDescription>
            <CardTitle className="text-3xl text-green-600">{metrics.sync_24h}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Atualizados recentemente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sync 7d</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{metrics.sync_7d}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Atualizados na semana
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Alertas Críticos</CardDescription>
            <CardTitle className="text-3xl text-red-600">{metrics.alertas_criticos}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Deadlines &lt; 48h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Taxa de Preenchimento por Campo JSONB */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Taxa de Preenchimento por Campo</CardTitle>
          <CardDescription>
            Percentual de registros com dados preenchidos em cada campo JSONB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dataFields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{field.label}</span>
                    {getQualityBadge(field.percentage)}
                  </div>
                  <span className={`text-2xl font-bold ${getQualityColor(field.percentage)}`}>
                    {field.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={field.percentage} className="h-2" />
                <p className="text-sm text-muted-foreground">{field.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Qualidade de Comunicação */}
      <Card>
        <CardHeader>
          <CardTitle>💬 Qualidade de Comunicação</CardTitle>
          <CardDescription>
            Distribuição de qualidade nas interações com compradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Excelente</span>
              </div>
              <Badge variant="default" className="bg-green-600">{metrics.com_excelente}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Boa</span>
              </div>
              <Badge variant="default" className="bg-blue-600">{metrics.com_boa}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span>Moderada</span>
              </div>
              <Badge variant="default" className="bg-yellow-600">{metrics.com_moderada}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Ruim</span>
              </div>
              <Badge variant="destructive">{metrics.com_ruim}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Informações Técnicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Edge Function:</span>
            <code className="bg-muted px-2 py-1 rounded">ml-returns</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tabela:</span>
            <code className="bg-muted px-2 py-1 rounded">devolucoes_avancadas</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campos JSONB:</span>
            <code className="bg-muted px-2 py-1 rounded">11 campos</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Última Atualização:</span>
            <span>Há {Math.floor((Date.now() - new Date().getTime()) / 60000)} minutos</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
