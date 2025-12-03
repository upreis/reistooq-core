import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Activity,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InsightStatus = 'pending' | 'approved' | 'rejected' | 'implemented' | 'archived';
type InsightType = 'ui_improvement' | 'feature_request' | 'bug_pattern' | 'user_struggle' | 'workflow_optimization';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface AIInsight {
  id: string;
  insight_type: InsightType;
  priority: Priority;
  title: string;
  description: string;
  affected_route?: string;
  user_actions_analyzed: number;
  confidence_score: number;
  suggested_improvement: string;
  status: InsightStatus;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<InsightStatus>('pending');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const queryClient = useQueryClient();

  // Obter usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Buscar insights
  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Verificar se é erro de permissão RLS
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          setPermissionError(true);
        }
        throw error;
      }
      setPermissionError(false);
      return data as AIInsight[];
    }
  });

  // Rodar análise
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-user-behavior');
      
      if (error) throw error;
      
      toast.success(`Análise concluída! ${data.insights_count} insights gerados`);
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    } catch (error: any) {
      console.error('Erro ao analisar:', error);
      toast.error('Erro ao analisar comportamento dos usuários');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Atualizar status do insight
  const updateInsightMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: InsightStatus; notes?: string }) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({
          status,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      toast.success('Status atualizado!');
    },
    onError: (error: any) => {
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        toast.error('Você não tem permissão para atualizar insights');
      } else {
        toast.error('Erro ao atualizar status');
      }
    }
  });

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };
    return colors[priority];
  };

  const getTypeIcon = (type: InsightType) => {
    const icons = {
      ui_improvement: Sparkles,
      feature_request: TrendingUp,
      bug_pattern: AlertTriangle,
      user_struggle: Activity,
      workflow_optimization: RefreshCw
    };
    return icons[type];
  };

  const getTypeLabel = (type: InsightType) => {
    const labels = {
      ui_improvement: 'Melhoria de UI',
      feature_request: 'Nova Funcionalidade',
      bug_pattern: 'Padrão de Bug',
      user_struggle: 'Dificuldade do Usuário',
      workflow_optimization: 'Otimização de Fluxo'
    };
    return labels[type];
  };

  const filteredInsights = insights?.filter(i => i.status === activeTab) || [];
  const pendingCount = insights?.filter(i => i.status === 'pending').length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Insights da IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises automáticas do comportamento dos usuários
          </p>
        </div>
        <Button 
          onClick={runAnalysis}
          disabled={isAnalyzing}
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analisar Agora
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights?.filter(i => i.status === 'approved').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implementados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights?.filter(i => i.status === 'implemented').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InsightStatus)}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="implemented">Implementados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {permissionError ? (
            <Card className="border-destructive">
              <CardContent className="text-center py-12">
                <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
                <h3 className="font-semibold text-lg mb-2">Acesso Restrito</h3>
                <p className="text-muted-foreground">
                  Você não tem permissão para visualizar os AI Insights.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Entre em contato com o administrador para obter acesso.
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Carregando insights...</p>
            </div>
          ) : filteredInsights.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum insight {activeTab === 'pending' ? 'pendente' : activeTab}</p>
                {activeTab === 'pending' && (
                  <Button onClick={runAnalysis} className="mt-4">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Insights
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredInsights.map((insight) => {
              const TypeIcon = getTypeIcon(insight.insight_type);
              
              return (
                <Card key={insight.id} className="relative overflow-hidden">
                  <div className={cn("absolute top-0 left-0 w-1 h-full", getPriorityColor(insight.priority))} />
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TypeIcon className="h-5 w-5 text-primary" />
                          <Badge variant="outline">{getTypeLabel(insight.insight_type)}</Badge>
                          <Badge className={cn("text-white", getPriorityColor(insight.priority))}>
                            {insight.priority.toUpperCase()}
                          </Badge>
                          {insight.affected_route && (
                            <Badge variant="secondary">{insight.affected_route}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{insight.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {insight.description}
                        </CardDescription>
                      </div>
                      <div className="text-sm text-muted-foreground text-right ml-4">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          {insight.user_actions_analyzed} ações
                        </div>
                        <div className="mt-1">
                          {(insight.confidence_score * 100).toFixed(0)}% confiança
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Sugestão de melhoria */}
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium mb-1">Sugestão de Melhoria</h4>
                          <p className="text-sm text-muted-foreground">
                            {insight.suggested_improvement}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    {insight.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => updateInsightMutation.mutate({ 
                            id: insight.id, 
                            status: 'approved',
                            notes: 'Aprovado para implementação'
                          })}
                          className="flex-1"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => updateInsightMutation.mutate({ 
                            id: insight.id, 
                            status: 'implemented' 
                          })}
                          variant="secondary"
                          className="flex-1"
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Marcar como Implementado
                        </Button>
                        <Button
                          onClick={() => updateInsightMutation.mutate({ 
                            id: insight.id, 
                            status: 'rejected',
                            notes: 'Não será implementado'
                          })}
                          variant="destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeitar
                        </Button>
                      </div>
                    )}

                    {insight.status === 'approved' && (
                      <Button
                        onClick={() => updateInsightMutation.mutate({ 
                          id: insight.id, 
                          status: 'implemented' 
                        })}
                        className="w-full"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Marcar como Implementado
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
