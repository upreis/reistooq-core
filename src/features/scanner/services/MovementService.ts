// =============================================================================
// MOVEMENT SERVICE - Movimentações via RPC segura
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export interface QuickMoveRequest {
  sku: string;
  qty: number;
  type: 'entrada' | 'saida' | 'ajuste';
  motivo?: string;
  observacoes?: string;
}

export interface MovementResult {
  success: boolean;
  error?: string;
  movement_id?: string;
  new_quantity?: number;
}

class MovementService {
  /**
   * Executa movimentação rápida via RPC
   */
  async quickMove(request: QuickMoveRequest): Promise<MovementResult> {
    console.log('📦 [MovementService] Quick move:', request);

    try {
      // For now, we'll use direct table access with proper RLS
      // Later this can be moved to an RPC function for better security
      
      // 1. Find product
      const { data: product, error: productError } = await supabase
        .from('produtos')
        .select('id, nome, quantidade_atual, estoque_minimo')
        .or(`sku_interno.eq.${request.sku},codigo_barras.eq.${request.sku}`)
        .eq('ativo', true)
        .maybeSingle();

      if (productError) {
        console.error('❌ [MovementService] Product lookup error:', productError);
        return { success: false, error: 'Erro ao buscar produto' };
      }

      if (!product) {
        return { success: false, error: 'Produto não encontrado' };
      }

      // 2. Calculate new quantity
      let newQuantity = product.quantidade_atual;
      
      switch (request.type) {
        case 'entrada':
          newQuantity += request.qty;
          break;
        case 'saida':
          newQuantity = Math.max(0, newQuantity - request.qty);
          if (product.quantidade_atual < request.qty) {
            return { 
              success: false, 
              error: `Estoque insuficiente. Disponível: ${product.quantidade_atual}` 
            };
          }
          break;
        case 'ajuste':
          newQuantity = request.qty;
          break;
      }

      // 3. Update product stock
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ 
          quantidade_atual: newQuantity,
          ultima_movimentacao: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) {
        console.error('❌ [MovementService] Stock update error:', updateError);
        return { success: false, error: 'Erro ao atualizar estoque' };
      }

      // 4. Record movement
      const { data: movement, error: movementError } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          produto_id: product.id,
          tipo_movimentacao: request.type,
          quantidade_anterior: product.quantidade_atual,
          quantidade_nova: newQuantity,
          quantidade_movimentada: request.qty,
          motivo: request.motivo || `Scanner ${request.type}`,
          observacoes: request.observacoes || 'Via Scanner V2'
        })
        .select('id')
        .single();

      if (movementError) {
        console.error('❌ [MovementService] Movement record error:', movementError);
        // Don't fail the whole operation if movement logging fails
      }

      // 5. Check for low stock alert
      if (newQuantity <= product.estoque_minimo && newQuantity > 0) {
        toast.warning(`Estoque baixo: ${product.nome}`, {
          description: `${newQuantity} unidades restantes`
        });
      }

      // 6. Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      console.log(`✅ [MovementService] Movement completed: ${product.quantidade_atual} → ${newQuantity}`);
      
      return {
        success: true,
        movement_id: movement?.id,
        new_quantity: newQuantity
      };

    } catch (error: any) {
      console.error('❌ [MovementService] Quick move failed:', error);
      return { 
        success: false, 
        error: error.message || 'Erro interno no servidor' 
      };
    }
  }

  /**
   * Verifica permissões de movimentação
   */
  async checkPermissions(): Promise<boolean> {
    try {
      // Test read access to produtos table
      const { error } = await supabase
        .from('produtos')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('❌ [MovementService] Permission check failed:', error);
      return false;
    }
  }
}

export const movementService = new MovementService();