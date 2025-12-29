/**
 * 🛍️ Gerenciador de Uploads Shopee
 * Permite visualizar e excluir o último upload feito
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import toast from 'react-hot-toast';
import { Trash2, History, FileSpreadsheet, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ImportacaoShopee {
  id: string;
  nome_arquivo: string;
  created_at: string;
  status: string;
  pedidos_novos: number;
  pedidos_duplicados: number;
  linhas_processadas: number;
}

interface ShopeeUploadManagerProps {
  onDeleteComplete?: () => void;
}

export function ShopeeUploadManager({ onDeleteComplete }: ShopeeUploadManagerProps) {
  const [uploads, setUploads] = useState<ImportacaoShopee[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  
  const { profile } = useCurrentProfile();
  const organizationId = profile?.organizacao_id;

  // Carregar últimos uploads
  const loadUploads = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('importacoes_shopee')
        .select('id, nome_arquivo, created_at, status, pedidos_novos, pedidos_duplicados, linhas_processadas')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Erro ao carregar uploads:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open && organizationId) {
      loadUploads();
    }
  }, [open, organizationId, loadUploads]);

  // Excluir upload e seus pedidos
  const handleDeleteUpload = useCallback(async (upload: ImportacaoShopee) => {
    if (!organizationId) return;
    setDeleting(true);
    
    try {
      // 1. Contar pedidos que serão excluídos
      const { count: pedidosCount } = await supabase
        .from('pedidos_shopee')
        .select('*', { count: 'exact', head: true })
        .eq('importacao_id', upload.id);

      // 2. Excluir todos os pedidos deste upload
      const { error: deletePedidosError } = await supabase
        .from('pedidos_shopee')
        .delete()
        .eq('importacao_id', upload.id);

      if (deletePedidosError) throw deletePedidosError;

      // 3. Excluir o registro de importação
      const { error: deleteImportError } = await supabase
        .from('importacoes_shopee')
        .delete()
        .eq('id', upload.id);

      if (deleteImportError) throw deleteImportError;

      toast.success(`Upload excluído! ${pedidosCount || 0} pedido(s) removidos.`);
      
      // Atualizar lista
      setUploads(prev => prev.filter(u => u.id !== upload.id));
      
      // Callback para refetch
      onDeleteComplete?.();
    } catch (error: any) {
      console.error('Erro ao excluir upload:', error);
      toast.error(error?.message || 'Não foi possível excluir o upload.');
    } finally {
      setDeleting(false);
    }
  }, [organizationId, onDeleteComplete]);

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs gap-1.5 border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          <History className="h-3 w-3" />
          Uploads
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-orange-500" />
            Últimos Uploads Shopee
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Exclua uploads incorretos para reimportar
          </p>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum upload encontrado
            </div>
          ) : (
            <div className="divide-y">
              {uploads.map((upload) => (
                <div key={upload.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" title={upload.nome_arquivo}>
                        {upload.nome_arquivo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(upload.created_at)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {upload.pedidos_novos || 0} novos
                        </Badge>
                        {(upload.pedidos_duplicados || 0) > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {upload.pedidos_duplicados} atualizados
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleting}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir upload?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso irá remover permanentemente todos os pedidos importados neste upload:
                            <br />
                            <strong className="text-foreground">{upload.nome_arquivo}</strong>
                            <br /><br />
                            Você pode reimportar o arquivo depois, se necessário.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteUpload(upload)}
                              disabled={deleting}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deleting ? 'Excluindo...' : 'Excluir Upload'}
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
