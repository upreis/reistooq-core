/**
 * 🛠️ UTILITÁRIO PARA CORREÇÃO DE HISTÓRICO ÓRFÃO
 * Componente para corrigir integration_account_id ausente
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HistoricoFixManager() {
  const [isFixing, setIsFixing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkOrphanedRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('id, status, integration_account_id')
        .eq('status', 'baixado')
        .is('integration_account_id', null);

      if (error) throw error;

      setStats({
        orphanedCount: data?.length || 0,
        total: await getTotalHistoricoCount()
      });
    } catch (error: any) {
      console.error('Erro ao verificar registros órfãos:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalHistoricoCount = async () => {
    try {
      const { count, error } = await supabase
        .from('historico_vendas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'baixado');
      
      if (error) throw error;
      return count || 0;
    } catch {
      return 0;
    }
  };

  const fixOrphanedRecords = async () => {
    if (!stats || stats.orphanedCount === 0) {
      toast({
        title: "Nenhuma correção necessária",
        description: "Não há registros órfãos para corrigir.",
      });
      return;
    }

    setIsFixing(true);
    try {
      // Buscar account padrão da organização
      const { data: accounts } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('is_active', true)
        .limit(1);

      const defaultAccountId = accounts?.[0]?.id;
      
      if (!defaultAccountId) {
        throw new Error('Nenhuma conta de integração encontrada');
      }

      // Atualizar registros órfãos
      const { error: updateError } = await supabase
        .from('historico_vendas')
        .update({ integration_account_id: defaultAccountId })
        .eq('status', 'baixado')
        .is('integration_account_id', null);

      if (updateError) throw updateError;

      // Verificar novamente
      await checkOrphanedRecords();

      toast({
        title: "✅ Correção concluída",
        description: `${stats.orphanedCount} registros corrigidos com sucesso!`,
      });

    } catch (error: any) {
      console.error('Erro ao corrigir registros:', error);
      toast({
        title: "Erro na correção",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <Database className="h-5 w-5" />
          Correção de Histórico Órfão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problema identificado:</strong> Alguns registros de baixa de estoque 
            não aparecem no histórico devido ao `integration_account_id` ausente.
          </AlertDescription>
        </Alert>

        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-white">
              <div className="text-2xl font-bold text-red-600">{stats.orphanedCount}</div>
              <div className="text-sm text-muted-foreground">Registros órfãos</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total de baixas</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={checkOrphanedRecords}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Verificar Status
          </Button>

          {stats && stats.orphanedCount > 0 && (
            <Button 
              onClick={fixOrphanedRecords}
              disabled={isFixing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className={`h-4 w-4 mr-2 ${isFixing ? 'animate-spin' : ''}`} />
              {isFixing ? 'Corrigindo...' : 'Corrigir Agora'}
            </Button>
          )}
        </div>

        {stats && stats.orphanedCount === 0 && (
          <Badge variant="default" className="bg-green-100 text-green-800">
            ✅ Todos os registros estão corretos
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}