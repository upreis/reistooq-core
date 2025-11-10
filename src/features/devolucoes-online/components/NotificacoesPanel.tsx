/**
 * 🔔 PAINEL DE NOTIFICAÇÕES - Devoluções Críticas
 * 
 * Exibe notificações de prazos críticos e ações necessárias
 * ⚡ OTIMIZADO: React Query + Real-time subscriptions
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell, X, Check, Clock, AlertTriangle, Package, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notificacao {
  id: string;
  order_id: string;
  return_id: number;
  claim_id: number;
  tipo_notificacao: string;
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  titulo: string;
  mensagem: string;
  dados_contexto: any;
  deadline_date?: string;
  horas_restantes?: number;
  lida: boolean;
  created_at: string;
}

export function NotificacoesPanel() {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<string>('todas');
  const queryClient = useQueryClient();

  // 📊 Buscar notificações
  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['devolucoes-notificacoes', filtro],
    queryFn: async () => {
      let query = supabase
        .from('devolucoes_notificacoes')
        .select('*')
        .order('prioridade', { ascending: true }) // crítica primeiro
        .order('created_at', { ascending: false })
        .limit(50);

      if (filtro === 'nao_lidas') {
        query = query.eq('lida', false);
      } else if (filtro === 'criticas') {
        query = query.eq('prioridade', 'critica');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Notificacao[];
    },
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // 📊 Contagem de não lidas
  const { data: naoLidasCount } = useQuery({
    queryKey: ['notificacoes-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_notificacoes_nao_lidas_count');
      if (error) throw error;
      return data as number;
    },
    refetchInterval: 30000,
  });

  // ✅ Marcar como lida
  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('marcar_notificacao_lida', {
        p_notificacao_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devolucoes-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] });
    },
  });

  // ✅ Marcar todas como lidas
  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('marcar_todas_notificacoes_lidas');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Todas as notificações foram marcadas como lidas');
      queryClient.invalidateQueries({ queryKey: ['devolucoes-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] });
    },
  });

  // 🔄 Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('devolucoes-notificacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devolucoes_notificacoes',
        },
        (payload) => {
          console.log('📡 Notificação atualizada:', payload);
          queryClient.invalidateQueries({ queryKey: ['devolucoes-notificacoes'] });
          queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] });

          // Toast para novas notificações críticas
          if (payload.eventType === 'INSERT' && payload.new) {
            const notif = payload.new as Notificacao;
            if (notif.prioridade === 'critica') {
              toast.error(notif.titulo, {
                description: notif.mensagem,
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 🎨 Helpers
  const getPrioridadeBadge = (prioridade: string) => {
    const configs = {
      critica: { label: 'Crítica', className: 'bg-red-500 text-white' },
      alta: { label: 'Alta', className: 'bg-orange-500 text-white' },
      media: { label: 'Média', className: 'bg-yellow-500 text-white' },
      baixa: { label: 'Baixa', className: 'bg-blue-500 text-white' },
    };
    const config = configs[prioridade as keyof typeof configs] || configs.media;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getIcon = (tipo: string) => {
    const icons = {
      prazo_envio_critico: <Clock className="h-4 w-4 text-red-500" />,
      prazo_envio_urgente: <Clock className="h-4 w-4 text-orange-500" />,
      prazo_review_critico: <AlertTriangle className="h-4 w-4 text-red-500" />,
      prazo_review_urgente: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      prazo_recebimento: <Package className="h-4 w-4 text-blue-500" />,
      acao_necessaria: <Bell className="h-4 w-4 text-yellow-500" />,
    };
    return icons[tipo as keyof typeof icons] || <Bell className="h-4 w-4" />;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidasCount && naoLidasCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {naoLidasCount > 99 ? '99+' : naoLidasCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notificações</span>
            {naoLidasCount && naoLidasCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => marcarTodasComoLidas.mutate()}
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Acompanhe devoluções críticas e ações necessárias
          </SheetDescription>
        </SheetHeader>

        {/* Filtros */}
        <div className="flex items-center gap-2 my-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="nao_lidas">Não lidas</SelectItem>
              <SelectItem value="criticas">Críticas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Notificações */}
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando notificações...
            </div>
          ) : !notificacoes || notificacoes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificacoes.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border ${
                    notif.lida ? 'bg-muted/30 border-border' : 'bg-background border-primary/30'
                  } hover:bg-accent/50 transition-colors cursor-pointer`}
                  onClick={() => !notif.lida && marcarComoLida.mutate(notif.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIcon(notif.tipo_notificacao)}
                      {getPrioridadeBadge(notif.prioridade)}
                    </div>
                    {!notif.lida && (
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm mb-1">{notif.titulo}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{notif.mensagem}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Pedido #{notif.order_id} • Dev #{notif.return_id}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  {notif.horas_restantes !== null && notif.horas_restantes !== undefined && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {notif.horas_restantes}h restantes
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
