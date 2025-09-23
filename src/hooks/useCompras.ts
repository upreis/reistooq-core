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
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'concluido' | 'cancelado';
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
        .from('fornecedores' as any)
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
        .from('fornecedores' as any)
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
        .from('pedidos_compra' as any)
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

  // COTAÇÕES
  const getCotacoes = async (): Promise<any[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cotacoes' as any)
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
        .from('cotacoes' as any)
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

  return {
    loading,
    getFornecedores,
    createFornecedor,
    getPedidosCompra,
    getCotacoes,
    createCotacao,
    // Integração com estoque
    processarRecebimentoPedido,
    buscarProdutosParaReposicao,
    gerarSugestaoPedidoCompra
  };
};