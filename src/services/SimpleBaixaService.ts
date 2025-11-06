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

      if (!rpcError && result && typeof result === 'object' && 'default_account_id' in result) {
        const accountId = (result as any).default_account_id;
        console.log('✅ RPC criou/encontrou account:', accountId);
        return accountId;
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
          provider: 'tiny', // Usar provider válido
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
      
      // ============= MAPEAMENTO ENRIQUECIDO v2.0 =============
      // Tentativa de popular MÁXIMO de campos possíveis com dados disponíveis
      
      const primeiroItem = pedido.order_items?.[0];
      const primeiroPagamento = pedido.payments?.[0];
      const shipping = pedido.shipping;
      
      // ANÁLISE: Extrair dados de endereço se disponível no contexto ML
      let rua = '';
      let numero = '';
      let bairro = '';
      let cep = '';
      
      // Tentar extrair do shipping se existir (estrutura ML)
      if (shipping && typeof shipping === 'object') {
        // ML às vezes tem receiver_address dentro do shipping
        const address = (shipping as any).receiver_address || (shipping as any).address;
        if (address) {
          rua = address.street_name || address.address_line || '';
          numero = address.street_number || address.number || '';
          bairro = address.neighborhood || address.district || '';
          cep = address.zip_code || address.postal_code || '';
        }
      }
      
      // ANÁLISE: Calcular valores financeiros reais
      const valorTotalReal = pedido.valor_total || primeiroPagamento?.total_paid_amount || 0;
      const valorFreteReal = pedido.valor_frete || primeiroPagamento?.shipping_cost || 0;
      const valorDescontoReal = pedido.valor_desconto || primeiroPagamento?.coupon_amount || pedido.coupon?.amount || 0;
      const taxasReal = primeiroPagamento?.taxes_amount || 0;
      
      // ANÁLISE: Status mais precisos
      const statusEnvioDetalhado = pedido.status_detail || pedido.situacao || primeiroPagamento?.status_detail || '';
      const statusPagamentoDetalhado = primeiroPagamento?.status || pedido.situacao || '';
      const metodoPagamentoDetalhado = primeiroPagamento?.payment_method_id || primeiroPagamento?.payment_type || '';
      
      // ANÁLISE: Dados do produto mais completos
      const skuCompleto = primeiroItem?.item?.seller_sku || primeiroItem?.item?.seller_custom_field || pedido.sku_estoque || '';
      const tituloCompleto = primeiroItem?.item?.title || primeiroItem?.item?.category_id || '';
      const quantidadeReal = primeiroItem?.quantity || pedido.total_itens || 1;
      
      const historicoData = {
        // ===== SEÇÃO BÁSICAS (✅ CONSEGUI ENRIQUECER) =====
        id_unico: buildIdUnico(pedido),
        empresa: pedido.empresa || pedido.seller?.id?.toString() || 'N/A',
        numero_pedido: pedido.numero || pedido.id,
        cliente_nome: pedido.nome_cliente || pedido.buyer?.id?.toString() || '',
        nome_completo: pedido.nome_cliente || `Cliente ${pedido.buyer?.id || 'Anônimo'}`,
        data_pedido: pedido.data_pedido || pedido.date_created?.split('T')[0] || new Date().toISOString().split('T')[0],
        ultima_atualizacao: pedido.last_updated || new Date().toISOString(),
        
        // ===== SEÇÃO PRODUTOS (✅ CONSEGUI ENRIQUECER) =====
        sku_produto: skuCompleto,
        quantidade_total: quantidadeReal,
        titulo_produto: tituloCompleto,
        
        // ===== SEÇÃO FINANCEIRAS (✅ CONSEGUI ENRIQUECER SIGNIFICATIVAMENTE) =====
        valor_total: valorTotalReal,
        valor_pago: pedido.paid_amount || primeiroPagamento?.total_paid_amount || valorTotalReal,
        frete_pago_cliente: valorFreteReal,
        receita_flex_bonus: Number((pedido as any).receita_flex_bonus || (shipping as any)?.bonus || 0),
        custo_envio_seller: Number((pedido as any).custo_envio_seller || (shipping as any)?.seller_cost || primeiroPagamento?.overpaid_amount || 0),
        desconto_cupom: valorDescontoReal,
        taxa_marketplace: taxasReal,
        valor_liquido_vendedor: (() => {
          // ✅ PRIORIZAR CAMPOS DIRETOS DA API ML
          // 1. Compensation do vendedor (valor líquido já calculado pelo ML)
          const sellerCompensation = (shipping as any)?.costs?.senders?.[0]?.compensation || 0;
          if (sellerCompensation > 0) return sellerCompensation;
          
          // 2. Transaction amount - marketplace fee (se disponível nos payments)
          const marketplaceFee = Number((primeiroPagamento as any)?.marketplace_fee || 0);
          if (primeiroPagamento?.transaction_amount && marketplaceFee > 0) {
            return Math.max(0, primeiroPagamento.transaction_amount - marketplaceFee);
          }
          
          // 3. Fallback: Valor total - Taxa marketplace
          return Math.max(0, valorTotalReal - taxasReal);
        })(),
        metodo_pagamento: metodoPagamentoDetalhado,
        status_pagamento: statusPagamentoDetalhado,
        tipo_pagamento: primeiroPagamento?.operation_type || primeiroPagamento?.payment_type || '',
        
        // ===== SEÇÃO MAPEAMENTO (✅ CONSEGUI ENRIQUECER PARCIALMENTE) =====
        status_mapeamento: pedido.status_estoque || (pedido.total_itens > 0 ? 'mapeado' : 'pendente'),
        sku_estoque: pedido.sku_estoque || skuCompleto,
        sku_kit: pedido.sku_kit || '',
        qtd_kit: Number(pedido.qtd_kit || (pedido as any).quantidade_kit || 0),
        total_itens: pedido.total_itens || quantidadeReal,
        
        // ✅ Campos específicos do ML que estavam faltando
        tipo_metodo_envio: (pedido as any).tipo_metodo_envio || (shipping as any)?.shipping_method?.name || null,
        metodo_envio_combinado: (pedido as any).metodo_envio_combinado || (shipping as any)?.shipping_method?.name || null,
        pack_id: (pedido as any).pack_id || null,
        pack_status: (pedido as any).pack_status || (shipping as any)?.pack_status || null,
        pack_status_detail: (pedido as any).pack_status_detail || (shipping as any)?.pack_status_detail || null,
        status_baixa: pedido.status_estoque || 'processado',
        
        // ===== SEÇÃO ENVIO (✅ CONSEGUI ENRIQUECER COM ENDEREÇO) =====
        status: 'baixado', // Status fixo da baixa
        status_envio: statusEnvioDetalhado,
        logistic_mode_principal: '', // ❌ NÃO DISPONÍVEL: Campo específico de logística interna
        tipo_logistico: '', // ❌ NÃO DISPONÍVEL: Campo específico de logística interna  
        tipo_entrega: '', // ❌ NÃO DISPONÍVEL: Campo específico de logística interna
        substatus_estado_atual: statusEnvioDetalhado,
        modo_envio_combinado: '', // ❌ NÃO DISPONÍVEL: Campo específico de logística interna
        rua: rua,
        numero: numero,
        bairro: bairro,
        cep: cep,
        cidade: pedido.cidade || '',
        uf: pedido.uf || '',
        
        // ===== CAMPOS TÉCNICOS (✅ MANTIDOS) =====
        integration_account_id: integrationAccountId,
        pedido_id: pedido.id,
        descricao: tituloCompleto,
        quantidade: quantidadeReal,
        valor_unitario: quantidadeReal > 0 ? valorTotalReal / quantidadeReal : valorTotalReal,
        observacoes: `Baixa automática - ${new Date().toLocaleString()} | Pack: ${pedido.pack_id || 'N/A'} | Tags: ${pedido.tags?.join(', ') || 'N/A'}`
      };

      // Salvar DIRETO no histórico usando RPC
      const { error } = await supabase.rpc('hv_insert', { p_data: historicoData });
      
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