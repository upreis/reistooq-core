import { supabase } from '@/integrations/supabase/client';

export interface MLOrderDetailParams {
  integration_account_id: string;
  order_id: string;
  include_shipping?: boolean;
}

export interface MLOrderDetailResponse {
  order: any;
  raw_order: any;
  account_id: string;
}

/**
 * Service para buscar detalhes individuais de orders do MercadoLivre
 */
export class MercadoLivreOrderService {
  
  /**
   * Busca um order específico do MercadoLivre com todos os detalhes
   * @param params Parâmetros da consulta
   * @returns Promise com os dados do order
   */
  static async getOrderDetail(params: MLOrderDetailParams): Promise<MLOrderDetailResponse> {
    const { data, error } = await supabase.functions.invoke('ml-get-order', {
      body: params
    });

    if (error) {
      throw new Error(`Erro ao buscar detalhes do pedido: ${error.message}`);
    }

    if (!data?.order) {
      throw new Error('Dados do pedido não encontrados na resposta');
    }

    return data;
  }

  /**
   * Busca múltiplos orders por IDs (em paralelo)
   * @param integration_account_id ID da conta de integração
   * @param order_ids Array de IDs dos orders
   * @param include_shipping Se deve incluir dados de envio
   * @returns Promise com array de orders
   */
  static async getMultipleOrderDetails(
    integration_account_id: string, 
    order_ids: string[], 
    include_shipping = false
  ): Promise<MLOrderDetailResponse[]> {
    const promises = order_ids.map(order_id => 
      this.getOrderDetail({ integration_account_id, order_id, include_shipping })
    );

    const results = await Promise.allSettled(promises);
    
    const successfulResults: MLOrderDetailResponse[] = [];
    const errors: Array<{order_id: string, error: string}> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        errors.push({
          order_id: order_ids[index],
          error: result.reason?.message || 'Erro desconhecido'
        });
      }
    });

    if (errors.length > 0) {
      console.warn('Alguns orders falharam ao buscar:', errors);
    }

    return successfulResults;
  }

  /**
   * Busca detalhes de um order incluindo informações de pack (se aplicável)
   * @param params Parâmetros da consulta
   * @returns Promise com dados completos do order e pack
   */
  static async getOrderWithPackInfo(params: MLOrderDetailParams) {
    const orderDetail = await this.getOrderDetail({
      ...params,
      include_shipping: true
    });

    // Se o order tem pack_id, buscar informações do pack também
    if (orderDetail.raw_order.pack_id) {
      try {
        const packInfo = await this.getPackInfo(
          params.integration_account_id, 
          orderDetail.raw_order.pack_id
        );
        
        return {
          ...orderDetail,
          pack_info: packInfo
        };
      } catch (packError) {
        console.warn(`Erro ao buscar informações do pack ${orderDetail.raw_order.pack_id}:`, packError);
        return orderDetail;
      }
    }

    return orderDetail;
  }

  /**
   * Busca informações de um pack específico
   * @param integration_account_id ID da conta de integração
   * @param pack_id ID do pack
   * @returns Promise com dados do pack
   */
  private static async getPackInfo(integration_account_id: string, pack_id: number) {
    // Esta funcionalidade pode ser implementada depois se necessário
    // Seria similar ao getOrderDetail mas chamando o endpoint /packs/{pack_id}
    throw new Error('Pack info não implementado ainda');
  }

  /**
   * Extrai informações resumidas de um order ML
   * @param rawOrder Order raw do ML
   * @returns Objeto com informações resumidas
   */
  static extractOrderSummary(rawOrder: any) {
    const itemCount = rawOrder.order_items?.length || 0;
    const firstItem = rawOrder.order_items?.[0];
    
    return {
      id: rawOrder.id,
      status: rawOrder.status,
      total_amount: rawOrder.total_amount,
      currency: rawOrder.currency_id,
      item_count: itemCount,
      first_item_title: firstItem?.item?.title || 'Item não identificado',
      buyer_nickname: rawOrder.buyer?.nickname || 'Comprador não identificado',
      date_created: rawOrder.date_created,
      pack_id: rawOrder.pack_id,
      tags: rawOrder.tags || [],
      has_shipping: !!rawOrder.shipping?.id,
      tracking_number: rawOrder.shipping?.tracking_number,
      payment_methods: rawOrder.payments?.map((p: any) => p.payment_method_id) || []
    };
  }

  /**
   * Verifica se um order está relacionado a um pack
   * @param order_id ID do order
   * @param integration_account_id ID da conta de integração
   * @returns Promise indicando se faz parte de um pack
   */
  static async isPartOfPack(order_id: string, integration_account_id: string): Promise<boolean> {
    try {
      const detail = await this.getOrderDetail({ integration_account_id, order_id });
      return !!detail.raw_order.pack_id;
    } catch {
      return false;
    }
  }
}

export default MercadoLivreOrderService;