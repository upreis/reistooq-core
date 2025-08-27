import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/types/pedido';
import { buildIdUnico } from '@/utils/idUnico';

export class SimpleBaixaService {
  /**
   * Busca ou cria integration_account padrão para a organização
   */
  static async getDefaultIntegrationAccount(): Promise<string | null> {
    try {
      // Buscar conta ativa da organização atual
      const { data: accounts, error } = await supabase
        .from('integration_accounts')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!error && accounts?.id) {
        return accounts.id;
      }

      // Se não encontrou, usar a função do banco para criar/buscar padrão
      const { data: result, error: rpcError } = await supabase
        .rpc('fix_historico_integration_accounts');

      if (rpcError) {
        console.error('❌ Erro ao buscar/criar integration_account padrão:', rpcError);
        return null;
      }

      return (result as any)?.default_account_id || null;
    } catch (error) {
      console.error('❌ Erro ao buscar integration_account:', error);
      return null;
    }
  }

  /**
   * Processa baixa de estoque e salva no histórico - TODAS AS COLUNAS DA PÁGINA /PEDIDOS
   */
  static async processarBaixaPedido(pedido: Pedido): Promise<boolean> {
    try {
      console.log('📦 Processando baixa com TODAS as colunas da página /pedidos:', pedido.numero);
      
      // Buscar integration_account_id padrão se necessário
      let integrationAccountId = pedido.integration_account_id;
      if (!integrationAccountId) {
        integrationAccountId = await this.getDefaultIntegrationAccount();
      }
      
      // Preparar dados com EXATAMENTE as colunas especificadas
      const historicoData = {
        // ===== SEÇÃO BÁSICAS =====
        id_unico: buildIdUnico(pedido),
        empresa: pedido.empresa || '',
        numero_pedido: pedido.numero || pedido.id,
        cliente_nome: pedido.nome_cliente || '',
        nome_completo: pedido.nome_cliente || '',
        data_pedido: pedido.data_pedido || new Date().toISOString().split('T')[0],
        ultima_atualizacao: new Date().toISOString(),
        
        // ===== SEÇÃO PRODUTOS =====
        sku_produto: pedido.order_items?.[0]?.item?.seller_sku || '',
        quantidade_total: pedido.total_itens || 0,
        titulo_produto: pedido.order_items?.[0]?.item?.title || '',
        
        // ===== SEÇÃO FINANCEIRAS =====
        valor_total: pedido.valor_total || 0,
        valor_pago: pedido.paid_amount || 0,
        frete_pago_cliente: pedido.payments?.[0]?.shipping_cost || 0,
        receita_flex_bonus: 0, // Fixo
        custo_envio_seller: 0, // Fixo
        desconto_cupom: pedido.coupon?.amount || 0,
        taxa_marketplace: 0, // Fixo
        valor_liquido_vendedor: pedido.paid_amount || 0,
        metodo_pagamento: pedido.payments?.[0]?.payment_method_id || '',
        status_pagamento: pedido.payments?.[0]?.status || '',
        tipo_pagamento: pedido.payments?.[0]?.payment_type || '',
        
        // ===== SEÇÃO MAPEAMENTO =====
        status_mapeamento: '', // Vazio
        sku_estoque: pedido.sku_estoque || '',
        sku_kit: pedido.sku_kit || '',
        quantidade_kit: pedido.qtd_kit || 0,
        total_itens: pedido.total_itens || 0,
        status_baixa: pedido.status_estoque || '',
        
        // ===== SEÇÃO ENVIO =====
        status: 'baixado', // Fixo
        status_envio: pedido.status_detail || '',
        logistic_mode_principal: '', // Vazio
        tipo_logistico: '', // Vazio
        tipo_metodo_envio: '', // Vazio
        tipo_entrega: '', // Vazio
        substatus_estado_atual: pedido.status_detail || '',
        modo_envio_combinado: '', // Vazio
        metodo_envio_combinado: '', // Vazio
        rua: '', // Vazio
        numero: '', // Vazio
        bairro: '', // Vazio
        cep: '', // Vazio
        cidade: pedido.cidade || '',
        uf: pedido.uf || '',
        
        // ===== CAMPOS TÉCNICOS (para compatibilidade) =====
        integration_account_id: integrationAccountId,
        pedido_id: pedido.id,
        descricao: pedido.order_items?.[0]?.item?.title || '',
        quantidade: pedido.total_itens || 0,
        valor_unitario: pedido.total_itens > 0 ? (pedido.valor_total || 0) / pedido.total_itens : (pedido.valor_total || 0),
        observacoes: `Baixa de estoque automática - ${new Date().toLocaleString()}`
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