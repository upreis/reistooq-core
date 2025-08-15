import { supabase } from "@/integrations/supabase/client";
import { HistoricoVenda } from '../types/historicoTypes';

export interface StockReversalResult {
  success: boolean;
  reversed: number;
  errors: string[];
  details: StockMovement[];
}

export interface StockMovement {
  produto_id: string;
  sku_produto: string;
  quantidade_antes: number;
  quantidade_depois: number;
  quantidade_movimentada: number;
  motivo: string;
}

export interface StockValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  affected_products: string[];
}

export class HistoricoStockService {
  
  /**
   * Reverses stock movements when deleting sales records
   * Only processes records that have stock-related fields
   */
  static async reverseStockOnDelete(vendas: HistoricoVenda[]): Promise<StockReversalResult> {
    const result: StockReversalResult = {
      success: true,
      reversed: 0,
      errors: [],
      details: []
    };

    // Filter records that affect stock
    const stockAffectingVendas = vendas.filter(venda => 
      venda.sku_kit && 
      venda.qtd_kit && 
      venda.qtd_kit > 0 &&
      venda.total_itens && 
      venda.total_itens > 0
    );

    if (stockAffectingVendas.length === 0) {
      return result; // No stock movements to reverse
    }

    try {
      // Group by SKU to optimize database operations
      const skuGroups = this.groupBySku(stockAffectingVendas);
      
      for (const [sku, vendasGroup] of Object.entries(skuGroups)) {
        try {
          await this.reverseSkuStock(sku, vendasGroup, result);
        } catch (error) {
          result.success = false;
          result.errors.push(`Erro ao reverter estoque para SKU ${sku}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Erro crítico na reversão de estoque: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
  }

  private static groupBySku(vendas: HistoricoVenda[]): Record<string, HistoricoVenda[]> {
    return vendas.reduce((groups, venda) => {
      const sku = venda.sku_kit || venda.sku_produto;
      if (!groups[sku]) {
        groups[sku] = [];
      }
      groups[sku].push(venda);
      return groups;
    }, {} as Record<string, HistoricoVenda[]>);
  }

  private static async reverseSkuStock(
    sku: string, 
    vendas: HistoricoVenda[], 
    result: StockReversalResult
  ): Promise<void> {
    // Calculate total quantity to reverse
    const totalQuantityToReverse = vendas.reduce((total, venda) => 
      total + (venda.qtd_kit || venda.quantidade || 0), 0
    );

    if (totalQuantityToReverse <= 0) return;

    // Find product by SKU
    const { data: produtos, error: findError } = await supabase
      .from('produtos')
      .select('id, sku_interno, nome, quantidade_atual')
      .or(`sku_interno.eq.${sku},codigo_barras.eq.${sku}`)
      .eq('ativo', true)
      .limit(1);

    if (findError) {
      throw new Error(`Erro ao buscar produto: ${findError.message}`);
    }

    if (!produtos || produtos.length === 0) {
      result.errors.push(`Produto não encontrado para SKU: ${sku}`);
      return;
    }

    const produto = produtos[0];
    const quantidadeAntes = produto.quantidade_atual;
    const quantidadeDepois = quantidadeAntes + totalQuantityToReverse;

    // Update stock quantity
    const { error: updateError } = await supabase
      .from('produtos')
      .update({ 
        quantidade_atual: quantidadeDepois,
        updated_at: new Date().toISOString()
      })
      .eq('id', produto.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
    }

    // Record stock movement
    const { error: movementError } = await supabase
      .from('movimentacoes_estoque')
      .insert({
        produto_id: produto.id,
        tipo_movimentacao: 'entrada',
        quantidade_anterior: quantidadeAntes,
        quantidade_nova: quantidadeDepois,
        quantidade_movimentada: totalQuantityToReverse,
        motivo: `Reversão automática - exclusão de ${vendas.length} venda(s)`,
        observacoes: `Vendas excluídas: ${vendas.map(v => v.numero_pedido).join(', ')}`
      });

    if (movementError) {
      // Log error but don't fail the operation
      console.error('Erro ao registrar movimentação:', movementError);
      result.errors.push(`Aviso: Estoque revertido mas movimento não registrado para ${sku}`);
    }

    // Record successful reversal
    result.details.push({
      produto_id: produto.id,
      sku_produto: sku,
      quantidade_antes: quantidadeAntes,
      quantidade_depois: quantidadeDepois,
      quantidade_movimentada: totalQuantityToReverse,
      motivo: 'Reversão automática por exclusão de vendas'
    });

    result.reversed++;
  }

  /**
   * Validates stock impact before processing operations
   */
  static async validateStockImpact(vendas: HistoricoVenda[]): Promise<StockValidationResult> {
    const result: StockValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      affected_products: []
    };

    const stockAffectingVendas = vendas.filter(venda => 
      venda.sku_kit && venda.qtd_kit && venda.qtd_kit > 0
    );

    if (stockAffectingVendas.length === 0) {
      return result; // No stock impact
    }

    try {
      const skuGroups = this.groupBySku(stockAffectingVendas);
      
      for (const [sku, vendasGroup] of Object.entries(skuGroups)) {
        const totalQuantity = vendasGroup.reduce((total, venda) => 
          total + (venda.qtd_kit || 0), 0
        );

        // Check if product exists and is active
        const { data: produtos, error } = await supabase
          .from('produtos')
          .select('id, sku_interno, nome, quantidade_atual, estoque_minimo, ativo')
          .or(`sku_interno.eq.${sku},codigo_barras.eq.${sku}`)
          .limit(1);

        if (error) {
          result.valid = false;
          result.errors.push(`Erro ao verificar produto ${sku}: ${error.message}`);
          continue;
        }

        if (!produtos || produtos.length === 0) {
          result.valid = false;
          result.errors.push(`Produto não encontrado para SKU: ${sku}`);
          continue;
        }

        const produto = produtos[0];
        result.affected_products.push(produto.sku_interno);

        if (!produto.ativo) {
          result.warnings.push(`Produto ${sku} está inativo`);
        }

        const novaQuantidade = produto.quantidade_atual + totalQuantity;
        
        if (novaQuantidade < 0) {
          result.valid = false;
          result.errors.push(`Reversão causaria estoque negativo para ${sku} (atual: ${produto.quantidade_atual}, reversão: +${totalQuantity})`);
        }

        if (novaQuantidade > produto.quantidade_atual * 2) {
          result.warnings.push(`Reversão de ${sku} dobrará o estoque atual (${produto.quantidade_atual} → ${novaQuantidade})`);
        }
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
  }

  /**
   * Get stock movements history for audit purposes
   */
  static async getStockMovements(
    produtoIds?: string[],
    dateRange?: { start: Date; end: Date },
    limit = 100
  ) {
    let query = supabase
      .from('movimentacoes_estoque')
      .select(`
        *,
        produtos!inner(sku_interno, nome)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (produtoIds && produtoIds.length > 0) {
      query = query.in('produto_id', produtoIds);
    }

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar movimentações: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a stock snapshot before major operations
   */
  static async createStockSnapshot(vendas: HistoricoVenda[]): Promise<any[]> {
    const affectedSkus = [
      ...new Set(
        vendas
          .filter(v => v.sku_kit || v.sku_produto)
          .map(v => v.sku_kit || v.sku_produto)
      )
    ];

    if (affectedSkus.length === 0) return [];

    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('id, sku_interno, nome, quantidade_atual, updated_at')
      .in('sku_interno', affectedSkus);

    if (error) {
      throw new Error(`Erro ao criar snapshot: ${error.message}`);
    }

    return produtos?.map(produto => ({
      ...produto,
      snapshot_timestamp: new Date().toISOString()
    })) || [];
  }
}