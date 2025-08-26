import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/types/pedido';
import { buildIdUnico } from '@/utils/idUnico';

export class SimpleBaixaService {
  /**
   * Processa baixa de estoque e salva no histórico - SUPER SIMPLES
   */
  static async processarBaixaPedido(pedido: Pedido): Promise<boolean> {
    try {
      console.log('📦 Processando baixa simples para pedido:', pedido.numero);
      
      // Preparar dados para histórico - TODOS os campos da imagem
      const historicoData = {
        id_unico: buildIdUnico(pedido),
        numero_pedido: pedido.numero || pedido.id,
        sku_produto: 'BAIXA_ESTOQUE', // SKU genérico para baixas
        descricao: `Baixa automática - Pedido ${pedido.numero}`,
        quantidade: pedido.total_itens || 1,
        valor_unitario: pedido.valor_total || 0,
        valor_total: pedido.valor_total || 0,
        cliente_nome: pedido.nome_cliente || 'Cliente',
        cliente_documento: pedido.cpf_cnpj || '',
        status: 'baixado',
        data_pedido: pedido.data_pedido || new Date().toISOString().split('T')[0],
        observacoes: `Baixa automática via sistema - ${new Date().toLocaleString()}`,
        
        // Todos os campos extras da imagem
        ncm: '',
        codigo_barras: '',
        pedido_id: pedido.id,
        cpf_cnpj: pedido.cpf_cnpj || '',
        valor_frete: pedido.valor_frete || 0,
        data_prevista: null,
        obs: '',
        obs_interna: '',
        cidade: pedido.cidade || '',
        uf: pedido.uf || '',
        url_rastreamento: '',
        situacao: pedido.situacao || '',
        codigo_rastreamento: '',
        numero_ecommerce: pedido.numero_ecommerce || '',
        valor_desconto: pedido.valor_desconto || 0,
        numero_venda: pedido.numero_venda || pedido.id,
        sku_estoque: '',
        sku_kit: '',
        qtd_kit: 0,
        total_itens: pedido.total_itens || 1,
        empresa: pedido.empresa || 'Sistema',
        integration_account_id: pedido.integration_account_id || null
      };

      // Salvar DIRETO no histórico usando RPC
      const { error } = await supabase.rpc('hv_insert', { p: historicoData });
      
      if (error) {
        console.error('❌ Erro ao salvar no histórico:', error);
        return false;
      }

      console.log('✅ Baixa salva no histórico com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro na baixa simples:', error);
      return false;
    }
  }
}