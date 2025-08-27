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
   * Processa baixa de estoque e salva no histórico - CORRIGIDO CONFORME USUÁRIO
   */
  static async processarBaixaPedido(pedido: Pedido): Promise<boolean> {
    try {
      console.log('📦 Processando baixa simples para pedido:', pedido.numero);
      
      // Buscar integration_account_id padrão se necessário
      let integrationAccountId = pedido.integration_account_id;
      if (!integrationAccountId) {
        integrationAccountId = await this.getDefaultIntegrationAccount();
      }
      
      // Preparar dados para histórico - CORRIGIDO baseado no feedback do usuário
      const historicoData = {
        id_unico: buildIdUnico(pedido),
        numero_pedido: pedido.numero || pedido.id, // ✅ "Número do Pedido"
        sku_produto: pedido.order_items?.[0]?.item?.seller_sku || 'BAIXA_ESTOQUE',
        descricao: `Baixa automática - Pedido ${pedido.numero || pedido.id}`,
        quantidade: pedido.total_itens || 1,
        valor_unitario: pedido.total_itens > 0 ? (pedido.valor_total || 0) / pedido.total_itens : (pedido.valor_total || 0), // ✅ CORRIGIDO: valor unitário real
        valor_total: pedido.valor_total || 0,
        cliente_nome: pedido.nome_cliente || 'Cliente', // ✅ "Nome Completo"
        // ✅ cpf_cnpj REMOVIDO por questões de LGPD
        status: 'baixado',
        data_pedido: pedido.data_pedido || new Date().toISOString().split('T')[0],
        observacoes: `Baixa automática via sistema - ${new Date().toLocaleString()}`,
        
        // Campos de localização - ✅ "Cidade" e "UF"
        cidade: pedido.cidade || '',
        uf: pedido.uf || '',
        
        // Campos financeiros
        valor_frete: pedido.valor_frete || 0,
        valor_desconto: pedido.valor_desconto || 0,
        
        // Campos de identificação
        pedido_id: pedido.id,
        numero_ecommerce: pedido.numero_ecommerce || '',
        numero_venda: pedido.numero_venda || pedido.id,
        
        // Campos de estoque
        total_itens: pedido.total_itens || 1,
        
        // Empresa e conta
        empresa: pedido.empresa || 'Sistema',
        integration_account_id: integrationAccountId, // ✅ CORRIGIDO: nunca mais NULL
        
        // Campos opcionais (vazios por enquanto)
        ncm: '',
        codigo_barras: '',
        data_prevista: null,
        obs: '',
        obs_interna: '',
        url_rastreamento: '',
        situacao: pedido.situacao || '',
        codigo_rastreamento: '',
        sku_estoque: '',
        sku_kit: '',
        qtd_kit: 0
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