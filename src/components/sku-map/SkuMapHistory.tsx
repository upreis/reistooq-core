import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, Calendar, Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface HistoryEntry {
  id: string;
  acao: string;
  created_at: string;
  usuario_id: string | null;
  valores_anteriores: any;
  valores_novos: any;
  motivo: string | null;
}

export function SkuMapHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('historico_depara')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar histórico:', error);
      } else {
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'criacao':
        return <Plus className="w-4 h-4 text-success" />;
      case 'edicao':
        return <Edit className="w-4 h-4 text-warning" />;
      case 'exclusao':
        return <Trash2 className="w-4 h-4 text-destructive" />;
      default:
        return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'criacao':
        return 'Criado';
      case 'edicao':
        return 'Editado';
      case 'exclusao':
        return 'Excluído';
      default:
        return action;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'criacao':
        return 'default' as const;
      case 'edicao':
        return 'outline' as const;
      case 'exclusao':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                  <div className="p-2 rounded-full bg-muted">
                    {getActionIcon(entry.acao)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActionVariant(entry.acao)} className="text-xs">
                        {getActionLabel(entry.acao)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {entry.valores_novos?.sku_pedido || entry.valores_anteriores?.sku_pedido || 'Mapeamento'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Sistema</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    </div>

                    {entry.motivo && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {entry.motivo}
                      </div>
                    )}

                    {/* Mostrar mudanças para edições */}
                    {entry.acao === 'edicao' && entry.valores_anteriores && entry.valores_novos && (
                      <div className="mt-2 text-xs">
                        {Object.keys(entry.valores_novos).map((key) => {
                          const oldValue = entry.valores_anteriores[key];
                          const newValue = entry.valores_novos[key];
                          
                          if (oldValue !== newValue && key !== 'updated_at') {
                            return (
                              <div key={key} className="flex gap-2">
                                <span className="capitalize font-medium">{key}:</span>
                                <span className="text-destructive line-through">{oldValue || 'vazio'}</span>
                                <span>→</span>
                                <span className="text-success">{newValue || 'vazio'}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}