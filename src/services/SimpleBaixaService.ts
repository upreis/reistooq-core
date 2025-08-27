import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/types/pedido';
import { buildIdUnico } from '@/utils/idUnico';

export class SimpleBaixaService {
  /**
   * Busca ou cria integration_account padrão para a organização - VERSÃO ROBUSTA
   */
  static async getDefaultIntegrationAccount(): Promise<string> {
    try {
      console.log('🔍 Buscando integration_account padrão...');
      
      // PASSO 1: Buscar conta ativa da organização atual
      const { data: accounts, error } = await supabase
        .from('integration_accounts')
        .select('id, name, provider')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!error && accounts?.id) {
        console.log('✅ Encontrou conta ativa:', accounts);
        return accounts.id;
      }

      console.log('⚠️ Nenhuma conta ativa encontrada, tentando fix_historico_integration_accounts...');

      // PASSO 2: Tentar criar/buscar via RPC
      const { data: result, error: rpcError } = await supabase
        .rpc('fix_historico_integration_accounts');

      if (!rpcError && result?.default_account_id) {
        console.log('✅ RPC criou/encontrou account:', result.default_account_id);
        return result.default_account_id;
      }

      console.log('⚠️ RPC falhou:', rpcError, 'Buscando qualquer conta da organização...');

      // PASSO 3: Fallback - buscar QUALQUER conta da organização
      const { data: anyAccount, error: anyError } = await supabase
        .from('integration_accounts')
        .select('id, name, provider')
        .limit(1)
        .maybeSingle();

      if (!anyError && anyAccount?.id) {
        console.log('✅ Usando conta fallback:', anyAccount);
        return anyAccount.id;
      }

      // PASSO 4: Último recurso - criar conta padrão
      console.log('🔧 Criando conta padrão de emergência...');
      const { data: newAccount, error: createError } = await supabase
        .from('integration_accounts')
        .insert({
          name: 'Sistema Padrão (Auto-criado)',
          provider: 'sistema',
          is_active: true
        })
        .select('id')
        .single();

      if (!createError && newAccount?.id) {
        console.log('✅ Conta padrão criada:', newAccount.id);
        return newAccount.id;
      }

      throw new Error(`Falhou em obter/criar integration_account. Último erro: ${createError?.message || 'Desconhecido'}`);
      
    } catch (error) {
      console.error('❌ Erro crítico ao buscar integration_account:', error);
      throw new Error(`Impossível obter integration_account: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Processa baixa de estoque e salva no histórico - TODAS AS COLUNAS DA PÁGINA /PEDIDOS
   */
  static async processarBaixaPedido(pedido: Pedido): Promise<boolean> {
    try {
      console.log('📦 Processando baixa com TODAS as colunas da página /pedidos:', pedido.numero);
      
      // Buscar integration_account_id OBRIGATÓRIO
      let integrationAccountId = pedido.integration_account_id;
      if (!integrationAccountId) {
        try {
          integrationAccountId = await this.getDefaultIntegrationAccount();
        } catch (error) {
          console.error('❌ Falha crítica ao obter integration_account_id:', error);
          throw new Error(`Não foi possível processar a baixa: ${error instanceof Error ? error.message : 'Erro ao obter conta de integração'}`);
        }
      }
      
      // Validação final - NUNCA deve ser null
      if (!integrationAccountId) {
        throw new Error('Integration Account ID não pode ser nulo. Impossível processar baixa.');
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