// src/utils/snapshot.ts
import { supabase } from '@/integrations/supabase/client';
import { fotografarPedidoCompleto, fotografiaParaBanco, type FotografiaPedido } from './fotografiaCompleta';

/**
 * 📸 NOVA VERSÃO: Salva um snapshot COMPLETO da baixa de estoque
 * Captura EXATAMENTE como os dados aparecem na UI da página pedidos
 */
export async function salvarSnapshotBaixa(
  pedido: any,
  contextoDaUI?: {
    mappingData?: Map<string, any>;
    accounts?: any[];
    selectedAccounts?: string[];
    integrationAccountId?: string;
  }
) {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Usuário não autenticado para salvar snapshot');
      return;
    }

    console.log('📸 Iniciando fotografia completa do pedido:', pedido.id || pedido.numero);
    console.log('🔧 NOVA FUNÇÃO FOTOGRAFIA ATIVA - Versão 2.0!');

    // 📸 FOTOGRAFAR PEDIDO COMPLETO (como aparece na UI)
    const fotografia: FotografiaPedido = fotografarPedidoCompleto(
      pedido,
      contextoDaUI?.mappingData || new Map(),
      contextoDaUI?.accounts || [],
      contextoDaUI?.selectedAccounts || [],
      contextoDaUI?.integrationAccountId
    );

    console.log('📸 Fotografia capturada:', {
      id_unico: fotografia.id_unico,
      empresa: fotografia.empresa,
      cliente: fotografia.nome_cliente,
      valor_total: fotografia.valor_total,
      skus: fotografia.skus_produtos,
      enderecos_capturados: `${fotografia.rua}, ${fotografia.numero}, ${fotografia.cidade}/${fotografia.uf}`
    });

    // Converter fotografia para formato do banco
    const dadosBaixa = fotografiaParaBanco(fotografia);
    
    // 🔍 DEBUG CRÍTICO: Verificar se local_estoque_id está sendo capturado
    console.log('🔍 VERIFICAÇÃO COMPLETA - LOCAL DE ESTOQUE:', {
      pedido_numero: pedido.numero || pedido.id,
      
      // Do pedido original
      pedido_local_estoque_id: pedido.local_estoque_id,
      pedido_local_estoque_nome: pedido.local_estoque_nome || pedido.local_estoque,
      pedido_unified_local_id: pedido.unified?.local_estoque_id,
      
      // Da fotografia
      fotografia_local_estoque_id: fotografia.local_estoque_id,
      fotografia_local_estoque_nome: fotografia.local_estoque_nome,
      
      // Dos dados para banco
      banco_local_estoque_id: dadosBaixa.local_estoque_id,
      banco_local_estoque_nome: dadosBaixa.local_estoque_nome,
      banco_local_estoque: dadosBaixa.local_estoque,
      
      // Validação
      tem_local_id_no_pedido: !!pedido.local_estoque_id || !!pedido.unified?.local_estoque_id,
      tem_local_id_na_fotografia: !!fotografia.local_estoque_id,
      tem_local_id_no_banco: !!dadosBaixa.local_estoque_id
    });
    
    // Adicionar usuário que fez a baixa
    dadosBaixa.created_by = user.id;

    // Sanitizar integration_account_id: evitar string vazia que quebra UUID
    if (!dadosBaixa.integration_account_id || (typeof dadosBaixa.integration_account_id === 'string' && dadosBaixa.integration_account_id.trim() === '')) {
      delete (dadosBaixa as any).integration_account_id;
    }

    console.log('📊 Dados finais para banco (hv_insert):', {
      id_unico: dadosBaixa.id_unico,
      sku_produto: dadosBaixa.sku_produto,
      empresa: dadosBaixa.empresa,
      local_estoque_id: dadosBaixa.local_estoque_id, // ✅ CRÍTICO
      local_estoque_nome: dadosBaixa.local_estoque_nome, // ✅ CRÍTICO
      valor_total: dadosBaixa.valor_total,
      enderecos: `${dadosBaixa.rua}, ${dadosBaixa.numero}`,
      status_envio: dadosBaixa.status_envio,
      fotografia_completa: true
    });

    // 💾 Inserir fotografia completa no histórico de vendas via RPC segura (bypassa RLS)
    const { data, error } = await supabase.rpc('hv_insert', {
      p: dadosBaixa as any
    });

    if (error) {
      console.error('❌ Erro ao salvar fotografia da baixa (hv_insert):', error);
      throw new Error(`Falha ao salvar histórico: ${error.message}`);
    }

    console.log('✅ Fotografia completa salva no histórico (hv_insert):', {
      id: data,
      id_unico: dadosBaixa.id_unico,
      todos_campos_capturados: '42+ campos preservados'
    });
    
    return data;

  } catch (error) {
    console.error('❌ Erro no salvarSnapshotBaixa:', error);
    throw error;
  }
}