/**
 * 📋 PÁGINA DE DEVOLUÇÕES COM AUTO-REFRESH E ANÁLISE
 * Sistema completo com tabs, highlights e detecção automática de mudanças
 */

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoRefreshDevolucoes } from '../hooks/useAutoRefreshDevolucoes';
import { StatusAnalise } from '../types/devolucao-analise.types';
import { DevolucaoTableRowEnhanced } from '../components/DevolucaoTableRowEnhanced';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DevolucoesMelhoradaPageProps {
  selectedAccountIds: string[];
}

export function DevolucoesMelhoradaPage({ selectedAccountIds }: DevolucoesMelhoradaPageProps) {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const {
    devolucoesAtivas,
    devolucoesHistorico,
    isLoadingAtivas,
    isLoadingHistorico,
    errorAtivas,
    errorHistorico,
    refetchAtivas,
    refetchHistorico,
    refetchAll
  } = useAutoRefreshDevolucoes({
    accountIds: selectedAccountIds,
    autoRefreshEnabled,
    refreshIntervalMs: 30000
  });

  // Handler para mudança de status
  const handleStatusChange = async (devolucaoId: string, newStatus: StatusAnalise) => {
    try {
      const { error } = await supabase
        .from('devolucoes_avancadas')
        .update({
          status_analise: newStatus,
          data_status_analise: new Date().toISOString(),
          usuario_status_analise: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', devolucaoId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso');
      
      // Refetch para atualizar a lista
      refetchAll();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header com controles */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Auto-refresh toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={setAutoRefreshEnabled}
                />
                <Label htmlFor="auto-refresh" className="cursor-pointer">
                  Auto-atualização (30s)
                </Label>
              </div>

              {/* Refresh manual */}
              <Button
                variant="outline"
                size="sm"
                onClick={refetchAll}
                disabled={isLoadingAtivas || isLoadingHistorico}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isLoadingAtivas || isLoadingHistorico ? 'animate-spin' : ''
                  }`}
                />
                Atualizar
              </Button>
            </div>

            {/* Legenda de cores */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-500" />
                <span className="text-muted-foreground">Hoje</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-400" />
                <span className="text-muted-foreground">1-2 dias</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400" />
                <span className="text-muted-foreground">3-5 dias</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs: Ativas / Histórico */}
        <Tabs defaultValue="ativas" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ativas" className="gap-2">
              <Clock className="h-4 w-4" />
              Ativas
              <Badge variant="secondary">{devolucoesAtivas.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Histórico
              <Badge variant="secondary">{devolucoesHistorico.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Ativas */}
          <TabsContent value="ativas" className="mt-6">
            <Card>
              {errorAtivas ? (
                <div className="p-8 text-center text-red-500">
                  Erro ao carregar devoluções ativas: {errorAtivas.message}
                </div>
              ) : isLoadingAtivas ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Carregando devoluções ativas...
                  </p>
                </div>
              ) : devolucoesAtivas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma devolução ativa encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ordem</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Rastreamento</TableHead>
                      <TableHead>Atualização</TableHead>
                      <TableHead>Análise</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devolucoesAtivas.map((devolucao) => (
                      <DevolucaoTableRowEnhanced
                        key={devolucao.id}
                        devolucao={devolucao}
                        onStatusChange={handleStatusChange}
                        showAccount={true}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="mt-6">
            <Card>
              {errorHistorico ? (
                <div className="p-8 text-center text-red-500">
                  Erro ao carregar histórico: {errorHistorico.message}
                </div>
              ) : isLoadingHistorico ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Carregando histórico...
                  </p>
                </div>
              ) : devolucoesHistorico.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma devolução no histórico
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ordem</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Rastreamento</TableHead>
                      <TableHead>Atualização</TableHead>
                      <TableHead>Análise</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devolucoesHistorico.map((devolucao) => (
                      <DevolucaoTableRowEnhanced
                        key={devolucao.id}
                        devolucao={devolucao}
                        onStatusChange={handleStatusChange}
                        showAccount={true}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
