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
    
    console.log('🔍 VERIFICAÇÃO LOCAL DE ESTOQUE:', {
      id_unico: dadosBaixa.id_unico,
      local_estoque_id: dadosBaixa.local_estoque_id,
      local_estoque_nome: dadosBaixa.local_estoque_nome,
      local_estoque: dadosBaixa.local_estoque,
      tem_local_id: !!dadosBaixa.local_estoque_id
    });
    
    // Adicionar usuário que fez a baixa
    dadosBaixa.created_by = user.id;

    // Sanitizar integration_account_id: evitar string vazia que quebra UUID
    if (!dadosBaixa.integration_account_id || (typeof dadosBaixa.integration_account_id === 'string' && dadosBaixa.integration_account_id.trim() === '')) {
      delete (dadosBaixa as any).integration_account_id;
    }

    console.log('📊 Dados finais para banco:', {
      id_unico: dadosBaixa.id_unico,
      sku_produto: dadosBaixa.sku_produto,
      empresa: dadosBaixa.empresa,
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