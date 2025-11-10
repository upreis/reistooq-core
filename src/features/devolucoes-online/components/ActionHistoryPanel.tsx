/**
 * 📜 PAINEL - HISTÓRICO DE AÇÕES
 * Exibe histórico de ações executadas na devolução
 */

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Scale, 
  Package, 
  DollarSign,
  Clock,
  User,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActionHistory {
  id: string;
  action_type: string;
  action_name: string;
  action_status: string;
  action_data: any;
  executed_at: string;
  executed_by: string | null;
  user_name?: string;
}

interface ActionHistoryPanelProps {
  returnId: number;
  claimId: number;
  integrationAccountId: string;
}

export const ActionHistoryPanel: React.FC<ActionHistoryPanelProps> = ({
  returnId,
  claimId,
  integrationAccountId
}) => {
  const [history, setHistory] = useState<ActionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [returnId, claimId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ml_devolucoes_historico_acoes')
        .select('*')
        .eq('return_id', returnId)
        .eq('claim_id', claimId)
        .eq('integration_account_id', integrationAccountId)
        .order('executed_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos usuários separadamente
      const userIds = [...new Set((data || []).map(item => item.executed_by).filter(Boolean))];
      const userNames: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome_exibicao')
          .in('id', userIds);
        
        profiles?.forEach(profile => {
          userNames[profile.id] = profile.nome_exibicao || 'Usuário';
        });
      }

      const formattedData = (data || []).map(item => ({
        ...item,
        user_name: item.executed_by ? userNames[item.executed_by] || 'Sistema' : 'Sistema'
      }));

      setHistory(formattedData);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'review_ok': return CheckCircle2;
      case 'review_fail': return XCircle;
      case 'print_label': return Printer;
      case 'appeal': return Scale;
      case 'ship': return Package;
      case 'refund': return DollarSign;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'error': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Ações</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma ação executada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de Ações ({history.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {history.map((item) => {
              const Icon = getActionIcon(item.action_type);
              
              return (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{item.action_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.executed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(item.action_status)}>
                      {item.action_status === 'success' ? 'Sucesso' : 'Erro'}
                    </Badge>
                  </div>

                  {/* Usuário */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{item.user_name}</span>
                  </div>

                  {/* Dados adicionais */}
                  {item.action_data && Object.keys(item.action_data).length > 0 && (
                    <div className="text-xs bg-muted rounded p-2 space-y-1">
                      {item.action_data.reasonId && (
                        <div>
                          <span className="font-medium">Razão:</span> {item.action_data.reasonId}
                        </div>
                      )}
                      {item.action_data.message && (
                        <div>
                          <span className="font-medium">Mensagem:</span> {item.action_data.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
