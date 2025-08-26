import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class HistoricoDeleteService {
  static async deleteItem(id: string): Promise<boolean> {
    try {
      // Usar a função RPC segura para excluir
      const { error } = await supabase.rpc('hv_delete', { _id: id });
      
      if (error) {
        console.error('Erro ao excluir item do histórico:', error);
        toast.error('Erro ao excluir item', {
          description: error.message || 'Erro desconhecido'
        });
        return false;
      }

      toast.success('Item excluído com sucesso');
      return true;
    } catch (error) {
      console.error('Erro inesperado ao excluir:', error);
      toast.error('Erro inesperado ao excluir item');
      return false;
    }
  }

  static async deleteMultiple(ids: string[]): Promise<boolean> {
    try {
      // Usar a função RPC segura para excluir múltiplos
      const { error } = await supabase.rpc('hv_delete_many', { _ids: ids });
      
      if (error) {
        console.error('Erro ao excluir itens do histórico:', error);
        toast.error('Erro ao excluir itens', {
          description: error.message || 'Erro desconhecido'
        });
        return false;
      }

      toast.success(`${ids.length} itens excluídos com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro inesperado ao excluir itens:', error);
      toast.error('Erro inesperado ao excluir itens');
      return false;
    }
  }
}