/**
 * 🔧 FASE 4.1: Validação do Sistema de Pedidos
 * Extraído de SimplePedidosPage para reduzir complexidade
 * 
 * ✅ GARANTIA: Apenas validação de dados, sem chamadas à API
 */

import { useCallback } from 'react';

export interface UsePedidosValidationProps {
  orders: any[];
}

export function usePedidosValidation({ orders }: UsePedidosValidationProps) {
  
  /**
   * Validar sistema de pedidos
   */
  const validateSystem = useCallback(() => {
    try {
      // Validações básicas do sistema
      const hasOrders = orders && orders.length > 0;
      
      if (!hasOrders) {
        console.log('ℹ️ Sistema: Nenhum pedido carregado ainda');
        return true; // Não é erro se não há pedidos
      }

      // ✅ CORREÇÃO: Verificação mais robusta de IDs
      const ordersWithoutId = orders.filter((o: any) => !o.id && !o.numero && !o.id_unico);
      const totalOrders = orders.length;
      const validOrders = totalOrders - ordersWithoutId.length;
      
      if (ordersWithoutId.length > 0) {
        console.warn(`⚠️ Sistema: ${ordersWithoutId.length}/${totalOrders} pedidos sem ID válido`, {
          exemplos: ordersWithoutId.slice(0, 3).map((o: any) => ({
            keys: Object.keys(o),
            hasRaw: !!o.raw,
            hasUnified: !!o.unified
          }))
        });
        
        // Se mais da metade tem ID válido, consideramos OK
        if (validOrders / totalOrders >= 0.5) {
          console.log(`✅ Sistema: ${validOrders}/${totalOrders} pedidos válidos (${Math.round(validOrders/totalOrders*100)}%)`);
          return true;
        }
        return false;
      }

      console.log(`✅ Sistema validado: ${totalOrders} pedidos válidos`);
      return true;
    } catch (error) {
      console.error('💥 Erro na validação do sistema:', error);
      return false;
    }
  }, [orders]);

  return {
    validateSystem,
  };
}
