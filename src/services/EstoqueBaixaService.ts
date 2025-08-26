import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/types/pedido';

export interface BaixaEstoqueResult {
  success: boolean;
  message: string;
  processedItems: number;
  skippedItems: number;
  errors: string[];
  details: BaixaItemDetail[];
}

export interface BaixaItemDetail {
  skuPedido: string;
  skuEstoque?: string;
  quantidadeKit: number;
  quantidadeBaixada: number;
  estoqueAntes: number;
  estoqueDepois: number;
  status: 'success' | 'error' | 'skipped';
  motivo?: string;
}

export interface MapeamentoSku {
  sku_pedido: string;
  sku_correspondente: string | null;
  sku_simples: string | null;
  quantidade: number;
}

export interface ProdutoEstoque {
  id: string;
  sku_interno: string;
  nome: string;
  quantidade_atual: number;
}

export class EstoqueBaixaService {
  
  /**
   * Processa a baixa automática de estoque para um ou múltiplos pedidos
   */
  static async processarBaixaPedidos(pedidos: Pedido[]): Promise<BaixaEstoqueResult> {
    const result: BaixaEstoqueResult = {
      success: true,
      message: '',
      processedItems: 0,
      skippedItems: 0,
      errors: [],
      details: []
    };

    console.info('[EstoqueBaixa] Iniciando processamento de', pedidos.length, 'pedidos');

    for (const pedido of pedidos) {
      try {
        const pedidoResult = await this.processarBaixaPedido(pedido);
        
        result.processedItems += pedidoResult.processedItems;
        result.skippedItems += pedidoResult.skippedItems;
        result.errors.push(...pedidoResult.errors);
        result.details.push(...pedidoResult.details);
        
        if (!pedidoResult.success) {
          result.success = false;
        }
      } catch (error: any) {
        console.error('[EstoqueBaixa] Erro ao processar pedido:', pedido.id, error);
        result.errors.push(`Pedido ${pedido.numero}: ${error.message}`);
        result.success = false;
      }
    }

    result.message = `${result.processedItems} itens processados, ${result.skippedItems} pulados`;
    
    if (result.errors.length > 0) {
      result.message += `. ${result.errors.length} erro(s) encontrados`;
    }

    console.info('[EstoqueBaixa] Resultado final:', result);
    return result;
  }

  /**
   * Processa a baixa de estoque para um pedido individual
   */
  private static async processarBaixaPedido(pedido: Pedido): Promise<BaixaEstoqueResult> {
    const result: BaixaEstoqueResult = {
      success: true,
      message: '',
      processedItems: 0,
      skippedItems: 0,
      errors: [],
      details: []
    };

    console.info('[EstoqueBaixa] Processando pedido:', pedido.numero);

    // 1. Verificar se já foi processado no histórico
    const jaProcessado = await this.verificarPedidoJaProcessado(pedido.id);
    if (jaProcessado) {
      console.info('[EstoqueBaixa] Pedido já processado, pulando:', pedido.numero);
      result.skippedItems = 1;
      result.message = 'Pedido já foi processado anteriormente';
      return result;
    }

    // 2. Extrair SKUs do pedido (pode vir da obs ou de campo específico)
    const skusPedido = this.extrairSkusDoPedido(pedido);
    if (skusPedido.length === 0) {
      console.warn('[EstoqueBaixa] Nenhum SKU encontrado no pedido:', pedido.numero);
      result.skippedItems = 1;
      result.message = 'Nenhum SKU encontrado no pedido';
      return result;
    }

    // 3. Para cada SKU do pedido, processar a baixa
    for (const skuInfo of skusPedido) {
      try {
        const itemResult = await this.processarBaixaItem(skuInfo.sku, skuInfo.quantidade, pedido);
        result.details.push(itemResult);
        
        if (itemResult.status === 'success') {
          result.processedItems++;
        } else if (itemResult.status === 'skipped') {
          result.skippedItems++;
        }
      } catch (error: any) {
        console.error('[EstoqueBaixa] Erro ao processar item:', skuInfo.sku, error);
        result.errors.push(`SKU ${skuInfo.sku}: ${error.message}`);
        result.success = false;
      }
    }

    // 4. Registrar no histórico para evitar reprocessamento
    if (result.processedItems > 0) {
      await this.registrarNoHistorico(pedido, result.details);
    }

    return result;
  }

  /**
   * Verifica se o pedido já foi processado consultando o histórico
   */
  private static async verificarPedidoJaProcessado(idUnicoPedido: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('id')
        .eq('id_unico', idUnicoPedido)
        .maybeSingle();

      if (error) {
        console.warn('[EstoqueBaixa] Erro ao verificar histórico:', error);
        return false; // Em caso de erro, assumir que não foi processado
      }

      return !!data;
    } catch (error) {
      console.warn('[EstoqueBaixa] Erro ao verificar histórico:', error);
      return false;
    }
  }

  /**
   * Extrai SKUs e quantidades do pedido
   * Tenta diferentes campos: obs, obs_interna, numero_venda etc.
   */
  private static extrairSkusDoPedido(pedido: Pedido): { sku: string; quantidade: number }[] {
    const skus: { sku: string; quantidade: number }[] = [];
    
    // Tenta extrair da observação (formato comum: "SKU123 (2x), SKU456 (1x)")
    if (pedido.obs) {
      const regex = /([A-Z0-9\-]+)\s*\((\d+)x\)|([A-Z0-9\-]+)/gi;
      let match;
      
      while ((match = regex.exec(pedido.obs)) !== null) {
        if (match[1] && match[2]) {
          // Formato com quantidade: SKU123 (2x)
          skus.push({ sku: match[1].trim(), quantidade: parseInt(match[2]) });
        } else if (match[3]) {
          // Formato simples: SKU123
          skus.push({ sku: match[3].trim(), quantidade: 1 });
        }
      }
    }

    // Fallback: usar o número do pedido como SKU se não encontrou nada
    if (skus.length === 0 && pedido.numero) {
      skus.push({ sku: pedido.numero, quantidade: 1 });
    }

    console.info('[EstoqueBaixa] SKUs extraídos do pedido:', skus);
    return skus;
  }

  /**
   * Processa a baixa de um item específico
   */
  private static async processarBaixaItem(
    skuPedido: string, 
    quantidadePedido: number, 
    pedido: Pedido
  ): Promise<BaixaItemDetail> {
    const detail: BaixaItemDetail = {
      skuPedido,
      quantidadeKit: 0,
      quantidadeBaixada: 0,
      estoqueAntes: 0,
      estoqueDepois: 0,
      status: 'error',
    };

    // 1. Buscar mapeamento no De-Para
    const mapeamento = await this.buscarMapeamentoSku(skuPedido);
    if (!mapeamento) {
      detail.status = 'skipped';
      detail.motivo = 'SKU não encontrado no De-Para';
      console.warn('[EstoqueBaixa] Mapeamento não encontrado para SKU:', skuPedido);
      return detail;
    }

    detail.skuEstoque = mapeamento.sku_correspondente || mapeamento.sku_simples || undefined;
    detail.quantidadeKit = mapeamento.quantidade;

    if (!detail.skuEstoque) {
      detail.status = 'skipped';
      detail.motivo = 'SKU de estoque não mapeado';
      console.warn('[EstoqueBaixa] SKU de estoque não definido no mapeamento:', skuPedido);
      return detail;
    }

    // 2. Buscar produto no estoque
    const produto = await this.buscarProdutoEstoque(detail.skuEstoque);
    if (!produto) {
      detail.status = 'error';
      detail.motivo = 'Produto não encontrado no estoque';
      console.error('[EstoqueBaixa] Produto não encontrado:', detail.skuEstoque);
      return detail;
    }

    detail.estoqueAntes = produto.quantidade_atual;

    // 3. Calcular quantidade total a baixar usando a coluna "Total de Itens"
    // A quantidade já está calculada (qtd vendida × quantidade do kit)
    const quantidadeTotalBaixa = quantidadePedido * detail.quantidadeKit;
    detail.quantidadeBaixada = quantidadeTotalBaixa;

    // 4. Verificar se há estoque suficiente
    if (produto.quantidade_atual < quantidadeTotalBaixa) {
      detail.status = 'error';
      detail.motivo = `Estoque insuficiente (disponível: ${produto.quantidade_atual}, necessário: ${quantidadeTotalBaixa})`;
      console.error('[EstoqueBaixa] Estoque insuficiente para:', detail.skuEstoque);
      return detail;
    }

    // 5. Efetuar a baixa no estoque
    const novaQuantidade = produto.quantidade_atual - quantidadeTotalBaixa;
    const { error } = await supabase
      .from('produtos')
      .update({ 
        quantidade_atual: novaQuantidade,
        updated_at: new Date().toISOString()
      })
      .eq('id', produto.id);

    if (error) {
      detail.status = 'error';
      detail.motivo = `Erro ao atualizar estoque: ${error.message}`;
      console.error('[EstoqueBaixa] Erro ao atualizar produto:', error);
      return detail;
    }

    detail.estoqueDepois = novaQuantidade;
    detail.status = 'success';

    console.info('[EstoqueBaixa] Baixa realizada:', {
      sku: detail.skuEstoque,
      antes: detail.estoqueAntes,
      baixa: detail.quantidadeBaixada,
      depois: detail.estoqueDepois
    });

    return detail;
  }

  /**
   * Busca o mapeamento de SKU na tabela de De-Para
   */
  private static async buscarMapeamentoSku(skuPedido: string): Promise<MapeamentoSku | null> {
    try {
      const { data, error } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido, sku_correspondente, sku_simples, quantidade')
        .eq('sku_pedido', skuPedido)
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('[EstoqueBaixa] Erro ao buscar mapeamento:', error);
        return null;
      }

      return data as MapeamentoSku | null;
    } catch (error) {
      console.error('[EstoqueBaixa] Erro ao buscar mapeamento:', error);
      return null;
    }
  }

  /**
   * Busca o produto no estoque pelo SKU interno
   */
  private static async buscarProdutoEstoque(skuInterno: string): Promise<ProdutoEstoque | null> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, sku_interno, nome, quantidade_atual')
        .eq('sku_interno', skuInterno)
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('[EstoqueBaixa] Erro ao buscar produto:', error);
        return null;
      }

      return data as ProdutoEstoque | null;
    } catch (error) {
      console.error('[EstoqueBaixa] Erro ao buscar produto:', error);
      return null;
    }
  }

  /**
   * Registra o processamento no histórico com TODAS as colunas da página
   */
  private static async registrarNoHistorico(pedido: Pedido, detalhes: BaixaItemDetail[]): Promise<void> {
    try {
      // Calcular total de itens processados (usando a fórmula correta)
      const totalItens = detalhes.reduce((sum, d) => sum + d.quantidadeBaixada, 0);
      
      const historicoData = {
        // Campos básicos
        id_unico: pedido.id,
        numero_pedido: pedido.numero,
        sku_produto: detalhes.map(d => d.skuPedido).join(', '),
        descricao: `Baixa automática - ${detalhes.length} item(s)`,
        quantidade: detalhes.reduce((sum, d) => sum + (d.quantidadeBaixada / d.quantidadeKit), 0), // qtd vendida original
        valor_unitario: pedido.valor_total || 0,
        valor_total: pedido.valor_total || 0,
        cliente_nome: pedido.nome_cliente,
        cliente_documento: pedido.cpf_cnpj,
        status: 'baixado',
        data_pedido: pedido.data_pedido,
        
        // Campos de mapeamento (incluindo Total de Itens)
        sku_estoque: detalhes.map(d => d.skuEstoque).join(', '),
        sku_kit: detalhes.map(d => d.skuPedido).join(', '),
        qtd_kit: detalhes.reduce((sum, d) => sum + d.quantidadeKit, 0),
        total_itens: totalItens, // ✅ CAMPO CALCULADO CORRETAMENTE
        
        // Todos os campos da página (visíveis e ocultos)
        cpf_cnpj: pedido.cpf_cnpj,
        empresa: pedido.empresa,
        cidade: pedido.cidade,
        uf: pedido.uf,
        numero_ecommerce: pedido.numero_ecommerce,
        numero_venda: pedido.numero_venda,
        valor_frete: pedido.valor_frete || 0,
        valor_desconto: pedido.valor_desconto || 0,
        data_prevista: (pedido as any).data_prevista,
        obs: pedido.obs,
        obs_interna: (pedido as any).obs_interna,
        codigo_rastreamento: (pedido as any).codigo_rastreamento,
        url_rastreamento: (pedido as any).url_rastreamento,
        integration_account_id: pedido.integration_account_id,
        
        // Observações do processamento
        observacoes: `Processamento automático via sistema. Detalhes: ${JSON.stringify(detalhes.map(d => ({
          sku: d.skuPedido,
          estoque: d.skuEstoque,
          quantidade_baixada: d.quantidadeBaixada,
          estoque_antes: d.estoqueAntes,
          estoque_depois: d.estoqueDepois
        })))}`
      };

      const { error } = await supabase
        .from('historico_vendas')
        .insert(historicoData);

      if (error) {
        console.error('[EstoqueBaixa] Erro ao registrar histórico:', error);
        // Não falhar o processo principal por erro no histórico
      } else {
        console.info('[EstoqueBaixa] Registrado no histórico com todas as colunas:', pedido.numero);
      }
    } catch (error) {
      console.error('[EstoqueBaixa] Erro ao registrar histórico:', error);
    }
  }
}