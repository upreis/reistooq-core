import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/types/pedido';

/**
 * 📸 SERVIÇO SIMPLES DE SNAPSHOT DO HISTÓRICO
 * 
 * Conceito: Quando o usuário clica em "Baixar Estoque", simplesmente 
 * captura um "snapshot" dos dados exatos da linha do pedido e grava 
 * no banco como histórico. Sem burocracias, sem RPC, sem complexidade.
 */
export class HistoricoSnapshotService {
  
  /**
   * Captura um snapshot simples do pedido e grava diretamente na tabela
   */
  static async criarSnapshot(pedido: Pedido): Promise<boolean> {
    try {
      console.log('📸 Capturando snapshot do pedido:', pedido.numero);
      
      // Criar dados do snapshot exatamente como aparecem na tela
      const snapshot = {
        // IDs e referências básicas
        id_unico: `${pedido.sku_estoque || 'NO-SKU'}-${pedido.numero}`,
        numero_pedido: pedido.numero,
        pedido_id: pedido.id,
        
        // Dados do cliente (exatos da tela)
        cliente_nome: pedido.nome_cliente || '',
        cpf_cnpj: pedido.cpf_cnpj || '',
        nome_completo: pedido.nome_cliente || '',
        
        // Dados do produto (do mapeamento)
        sku_produto: pedido.sku_estoque || 'BAIXA_ESTOQUE',
        sku_estoque: pedido.sku_estoque || '',
        sku_kit: pedido.sku_kit || '',
        quantidade: pedido.total_itens || 1,
        quantidade_total: pedido.total_itens || 1,
        qtd_kit: pedido.qtd_kit || 0,
        total_itens: pedido.total_itens || 1,
        descricao: `Baixa de estoque - ${pedido.numero}`,
        
        // Valores financeiros (exatos da tela)
        valor_total: pedido.valor_total || 0,
        valor_unitario: pedido.total_itens > 0 ? (pedido.valor_total || 0) / pedido.total_itens : (pedido.valor_total || 0),
        valor_frete: pedido.valor_frete || 0,
        valor_desconto: pedido.valor_desconto || 0,
        valor_pago: pedido.paid_amount || pedido.valor_total || 0,
        
        // Dados geográficos
        cidade: pedido.cidade || '',
        uf: pedido.uf || '',
        
        // Dados da empresa/conta
        empresa: pedido.empresa || '',
        numero_ecommerce: pedido.numero_ecommerce || '',
        numero_venda: pedido.numero_venda || '',
        
        // Datas
        data_pedido: pedido.data_pedido || new Date().toISOString().split('T')[0],
        ultima_atualizacao: new Date().toISOString(),
        
        // Status
        status: 'baixado',
        situacao: pedido.situacao || '',
        status_mapeamento: pedido.status_estoque || 'processado',
        status_baixa: 'processado',
        
        // Observações e metadados
        observacoes: `Snapshot automático - ${new Date().toLocaleString()}`,
        obs: pedido.obs || '',
        
        // Conta de integração (usar a do pedido ou null)
        integration_account_id: pedido.integration_account_id || null,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Inserir DIRETO na tabela historico_vendas - sem RPC, sem burocracias
      const { error } = await supabase
        .from('historico_vendas')
        .insert([snapshot]);
      
      if (error) {
        console.error('❌ Erro ao criar snapshot:', error);
        return false;
      }
      
      console.log('✅ Snapshot criado com sucesso!');
      return true;
      
    } catch (error) {
      console.error('❌ Erro inesperado ao criar snapshot:', error);
      return false;
    }
  }
  
  /**
   * Verifica se já existe um snapshot para este pedido
   */
  static async verificarSnapshotExistente(numero_pedido: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('historico_vendas')
        .select('id')
        .eq('numero_pedido', numero_pedido)
        .eq('status', 'baixado')
        .limit(1);
      
      if (error) {
        console.error('❌ Erro ao verificar snapshot:', error);
        return false;
      }
      
      return (data && data.length > 0);
      
    } catch (error) {
      console.error('❌ Erro ao verificar snapshot:', error);
      return false;
    }
  }
}