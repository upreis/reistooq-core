import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ComprasEstoqueIntegration, ItemRecebimento } from '@/services/comprasEstoqueIntegration';

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato_principal?: string;
  observacoes?: string;
  categoria?: string;
  avaliacao: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PedidoCompra {
  id: string;
  numero_pedido: string;
  fornecedor_id: string;
  fornecedor_nome?: string;
  data_pedido: string;
  data_entrega_prevista?: string;
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'concluido_recebido' | 'cancelado';
  valor_total: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Cotacao {
  id: string;
  numero_cotacao: string;
  descricao: string;
  data_abertura: string;
  data_fechamento?: string;
  status: 'aberta' | 'enviada' | 'respondida' | 'fechada' | 'cancelada';
  observacoes?: string;
  created_at: string;
  updated_at: string;
  fornecedores_count?: number;
}

export const useCompras = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // FORNECEDORES
  const getFornecedores = async (): Promise<any[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fornecedores.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createFornecedor = async (fornecedor: any): Promise<any> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .insert([fornecedor])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o fornecedor.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // PEDIDOS DE COMPRA
  const getPedidosCompra = async (): Promise<any[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos_compra')
        .select(`
          *,
          fornecedores!inner(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((pedido: any) => ({
        ...pedido,
        fornecedor_nome: pedido.fornecedores?.nome
      }));
    } catch (error) {
      console.error('Erro ao buscar pedidos de compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos de compra.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createPedidoCompra = async (pedido: any): Promise<any> => {
    try {
      setLoading(true);
      
      // Busca o organization_id do usuário atual
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError || !userData?.organizacao_id) {
        throw new Error('Usuário não possui organização definida');
      }

      const pedidoComOrg = {
        ...pedido,
        organization_id: userData.organizacao_id
      };

      const { data, error } = await supabase
        .from('pedidos_compra')
        .insert([pedidoComOrg])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar pedido de compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido de compra.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePedidoCompra = async (id: string, pedido: any): Promise<any> => {
    try {
      setLoading(true);
      
      // Remove campos que não devem ser atualizados
      const { organization_id, created_at, updated_at, ...pedidoUpdate } = pedido;

      const { data, error } = await supabase
        .from('pedidos_compra')
        .update(pedidoUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar pedido de compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pedido de compra.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // COTAÇÕES
  const getCotacoes = async (): Promise<any[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cotacoes')
        .select(`*`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as cotações.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCotacao = async (cotacao: any): Promise<any> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cotacoes')
        .insert([cotacao])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar cotação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a cotação.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // INTEGRAÇÃO COM ESTOQUE
  const processarRecebimentoPedido = async (pedidoId: string, itens: ItemRecebimento[]) => {
    try {
      setLoading(true);
      const resultado = await ComprasEstoqueIntegration.processarRecebimentoPedido(pedidoId, itens);
      
      if (resultado.success) {
        toast({
          title: "Recebimento processado",
          description: resultado.message,
        });
      } else {
        toast({
          title: "Erro no recebimento",
          description: resultado.message,
          variant: "destructive",
        });
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao processar recebimento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o recebimento.",
        variant: "destructive",
      });
      return { success: false, message: 'Erro interno' };
    } finally {
      setLoading(false);
    }
  };

  const extornarRecebimentoPedido = async (pedidoId: string) => {
    try {
      setLoading(true);
      const resultado = await ComprasEstoqueIntegration.extornarRecebimentoPedido(pedidoId);
      
      if (resultado.success) {
        toast({
          title: "Extorno processado",
          description: resultado.message,
        });
      } else {
        toast({
          title: "Erro no extorno",
          description: resultado.message,
          variant: "destructive",
        });
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro ao processar extorno:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o extorno.",
        variant: "destructive",
      });
      return { success: false, message: 'Erro interno' };
    } finally {
      setLoading(false);
    }
  };

  const buscarProdutosParaReposicao = async () => {
    try {
      return await ComprasEstoqueIntegration.buscarProdutosParaReposicao();
    } catch (error) {
      console.error('Erro ao buscar produtos para reposição:', error);
      return [];
    }
  };

  const gerarSugestaoPedidoCompra = async () => {
    try {
      return await ComprasEstoqueIntegration.gerarSugestaoPedidoCompra();
    } catch (error) {
      console.error('Erro ao gerar sugestão de pedido:', error);
      return [];
    }
  };

  const updateFornecedor = async (id: string, fornecedor: any): Promise<any> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .update(fornecedor)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o fornecedor.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteFornecedor = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fornecedor.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getFornecedores,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    getPedidosCompra,
    createPedidoCompra,
    updatePedidoCompra,
    getCotacoes,
    createCotacao,
    // Integração com estoque
    processarRecebimentoPedido,
    extornarRecebimentoPedido,
    buscarProdutosParaReposicao,
    gerarSugestaoPedidoCompra
  };
};