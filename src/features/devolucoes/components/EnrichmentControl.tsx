/**
 * 🎛️ COMPONENTE DE CONTROLE DE ENRIQUECIMENTO
 * Interface para monitorar e controlar o sistema de enriquecimento real
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';

interface EnrichmentControlProps {
  integrationAccountIds: string[];
  onEnrichmentComplete?: () => void;
}

interface EnrichmentStatus {
  isRunning: boolean;
  progress: number;
  totalClaims: number;
  enrichedCount: number;
  errors: any[];
  lastRun?: string;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
}

export function EnrichmentControl({ integrationAccountIds, onEnrichmentComplete }: EnrichmentControlProps) {
  const [status, setStatus] = useState<EnrichmentStatus>({
    isRunning: false,
    progress: 0,
    totalClaims: 0,
    enrichedCount: 0,
    errors: [],
    connectionStatus: 'disconnected'
  });

  const [missingDataAnalysis, setMissingDataAnalysis] = useState<any>(null);

  // 🧪 TESTAR CONEXÃO ML API
  const testConnection = useCallback(async () => {
    if (integrationAccountIds.length === 0) {
      toast.error('Nenhuma conta de integração configurada');
      return;
    }

    setStatus(prev => ({ ...prev, connectionStatus: 'checking' }));

    try {
      const { data, error } = await supabase.functions.invoke('ml-enrichment-real', {
        body: {
          action: 'test_ml_connection',
          integration_account_id: integrationAccountIds[0]
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setStatus(prev => ({ ...prev, connectionStatus: 'connected' }));
        toast.success(`✅ Conexão ML estabelecida: ${data.user_data.nickname}`);
      } else {
        setStatus(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        toast.error(`❌ Falha na conexão: ${data.error}`);
      }

    } catch (error: any) {
      console.error('❌ Erro no teste de conexão:', error);
      setStatus(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      toast.error(`Erro no teste: ${error.message}`);
    }
  }, [integrationAccountIds]);

  // 🔍 VERIFICAR DADOS FALTANTES
  const checkMissingData = useCallback(async () => {
    if (integrationAccountIds.length === 0) return;

    try {
      const { data, error } = await supabase.functions.invoke('ml-enrichment-real', {
        body: {
          action: 'check_missing_data',
          integration_account_id: integrationAccountIds[0]
        }
      });

      if (error) {
        throw error;
      }

      setMissingDataAnalysis(data.analysis);
      setStatus(prev => ({ 
        ...prev, 
        totalClaims: data.total_claims 
      }));

      console.log('📊 Análise de dados faltantes:', data.analysis);

    } catch (error: any) {
      console.error('❌ Erro na verificação:', error);
      toast.error(`Erro na verificação: ${error.message}`);
    }
  }, [integrationAccountIds]);

  // 🚀 INICIAR ENRIQUECIMENTO REAL
  const startRealEnrichment = useCallback(async () => {
    if (integrationAccountIds.length === 0) {
      toast.error('Nenhuma conta de integração configurada');
      return;
    }

    setStatus(prev => ({ 
      ...prev, 
      isRunning: true, 
      progress: 0, 
      enrichedCount: 0, 
      errors: [] 
    }));

    try {
      toast.info('🚀 Iniciando enriquecimento real com ML API...');

      const { data, error } = await supabase.functions.invoke('ml-enrichment-real', {
        body: {
          action: 'batch_enrich',
          integration_account_id: integrationAccountIds[0],
          limit: 20
        }
      });

      if (error) {
        throw error;
      }

      setStatus(prev => ({
        ...prev,
        isRunning: false,
        progress: 100,
        enrichedCount: data.total_enriched || 0,
        lastRun: new Date().toISOString()
      }));

      if (data.success) {
        toast.success(`✅ ${data.total_enriched} claims enriquecidos com dados reais!`);
        onEnrichmentComplete?.();
        await checkMissingData(); // Atualizar análise
      } else {
        toast.error(`❌ Erro no enriquecimento: ${data.error}`);
      }

    } catch (error: any) {
      console.error('❌ Erro no enriquecimento:', error);
      setStatus(prev => ({ 
        ...prev, 
        isRunning: false, 
        errors: [error.message] 
      }));
      toast.error(`Erro no enriquecimento: ${error.message}`);
    }
  }, [integrationAccountIds, onEnrichmentComplete, checkMissingData]);

  // 🔄 ENRIQUECIMENTO ESPECÍFICO
  const enrichSpecificClaims = useCallback(async () => {
    if (integrationAccountIds.length === 0) return;

    setStatus(prev => ({ ...prev, isRunning: true }));

    try {
      const { data, error } = await supabase.functions.invoke('ml-enrichment-real', {
        body: {
          action: 'real_enrich_claims',
          integration_account_id: integrationAccountIds[0],
          limit: 10,
          force_refresh: false
        }
      });

      if (error) throw error;

      setStatus(prev => ({
        ...prev,
        isRunning: false,
        enrichedCount: prev.enrichedCount + (data.enriched_count || 0)
      }));

      toast.success(`✅ ${data.enriched_count} claims processados com dados ML`);
      onEnrichmentComplete?.();

    } catch (error: any) {
      setStatus(prev => ({ ...prev, isRunning: false }));
      toast.error(`Erro: ${error.message}`);
    }
  }, [integrationAccountIds, onEnrichmentComplete]);

  // Carregar análise inicial
  React.useEffect(() => {
    if (integrationAccountIds.length > 0) {
      checkMissingData();
    }
  }, [integrationAccountIds, checkMissingData]);

  return (
    <div className="space-y-4">
      {/* STATUS DA CONEXÃO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistema de Enriquecimento ML API
          </CardTitle>
          <CardDescription>
            Controle e monitoramento do enriquecimento real com dados do Mercado Livre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da Conexão */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status da Conexão:</span>
              <Badge variant={
                status.connectionStatus === 'connected' ? 'default' :
                status.connectionStatus === 'checking' ? 'secondary' : 'destructive'
              }>
                {status.connectionStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                {status.connectionStatus === 'checking' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                {status.connectionStatus === 'disconnected' && <AlertCircle className="h-3 w-3 mr-1" />}
                {status.connectionStatus === 'connected' ? 'Conectado' : 
                 status.connectionStatus === 'checking' ? 'Verificando...' : 'Desconectado'}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testConnection}
              disabled={status.connectionStatus === 'checking'}
            >
              {status.connectionStatus === 'checking' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Testar Conexão
            </Button>
          </div>

          {/* Análise de Dados Faltantes */}
          {missingDataAnalysis && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {missingDataAnalysis.claims_needing_enrichment}
                </div>
                <div className="text-xs text-muted-foreground">Claims Pendentes</div>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {missingDataAnalysis.missing_timeline}
                </div>
                <div className="text-xs text-muted-foreground">Sem Mensagens</div>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {missingDataAnalysis.missing_attachments}
                </div>
                <div className="text-xs text-muted-foreground">Sem Anexos</div>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {missingDataAnalysis.missing_priority}
                </div>
                <div className="text-xs text-muted-foreground">Sem Prioridade</div>
              </div>
            </div>
          )}

          {/* Progresso */}
          {status.isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando...</span>
                <span>{status.enrichedCount} processados</span>
              </div>
              <Progress value={status.progress} className="h-2" />
            </div>
          )}

          {/* Controles */}
          <div className="flex gap-2">
            <Button
              onClick={startRealEnrichment}
              disabled={status.isRunning || status.connectionStatus !== 'connected'}
              className="flex-1"
            >
              {status.isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Enriquecimento Completo
            </Button>
            
            <Button
              variant="outline"
              onClick={enrichSpecificClaims}
              disabled={status.isRunning || status.connectionStatus !== 'connected'}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Processar Pendentes
            </Button>
            
            <Button
              variant="outline"
              onClick={checkMissingData}
              disabled={status.isRunning}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Último processamento */}
          {status.lastRun && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Último processamento: {new Date(status.lastRun).toLocaleString()}
            </div>
          )}

          {/* Erros */}
          {status.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {status.errors[0]}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}