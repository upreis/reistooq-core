// 🛡️ SISTEMA BLINDADO - HOOK DE BAIXA DE ESTOQUE PROTEGIDO
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarSnapshotBaixa } from '@/utils/snapshot';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validarFluxoCompleto, type PedidoEnriquecido } from '@/core/integracao';
import { MonitorIntegracao, medirTempoExecucao } from '@/core/integracao/MonitorIntegracao';
import { buildIdUnico } from '@/utils/idUnico';
interface ProcessarBaixaParams {
  pedidos: Pedido[];  // Voltar para Pedido[] pois já vem enriquecido do SimplePedidosPage
  contextoDaUI?: {
    mappingData?: Map<string, any>;
    accounts?: any[];
    selectedAccounts?: string[];
    integrationAccountId?: string;
  };
}

// ✅ VALIDAÇÃO COMPLETA DOS PEDIDOS - NOVA IMPLEMENTAÇÃO COM PROTEÇÃO ANTI-DUPLICAÇÃO
async function validarFluxoCompletoLocal(pedidos: Pedido[]): Promise<boolean> {
  console.log('🔍 [LOCAL] Validando fluxo completo de', pedidos.length, 'pedidos');
  
  for (const pedido of pedidos) {
    // Validar dados essenciais
    if (!pedido.id && !pedido.numero) {
      console.error('❌ Pedido sem ID ou número:', pedido);
      return false;
    }
    
    // 🛡️ CRÍTICO: Verificar se pedido já foi processado no histórico (via RPC segura)
    const idUnico = (pedido as any).id_unico || buildIdUnico(pedido as any);
    const { data: existeHistorico, error: hvError } = await supabase.rpc('hv_exists', { p_id_unico: idUnico });
    
    if (hvError) {
      console.error('❌ Erro ao verificar histórico (hv_exists):', hvError);
      return false;
    }
    
    if (existeHistorico) {
      console.error('❌ Pedido já foi processado anteriormente (histórico encontrado):', {
        id_unico: idUnico,
        numero: pedido.numero || pedido.id
      });
      return false;
    }
    
    // Validar se tem sku_kit e total_itens (necessários para baixa)
    if (!pedido.sku_kit || !pedido.total_itens) {
      console.error('❌ Pedido sem sku_kit ou total_itens:', {
        id: pedido.id || pedido.numero,
        sku_kit: pedido.sku_kit,
        total_itens: pedido.total_itens
      });
      return false;
    }
    
    // Validar se total_itens é número válido
    const totalItens = Number(pedido.total_itens);
    if (isNaN(totalItens) || totalItens <= 0) {
      console.error('❌ total_itens inválido:', {
        id: pedido.id || pedido.numero,
        total_itens: pedido.total_itens,
        convertido: totalItens
      });
      return false;
    }
    
    // Validar se não está duplicado na requisição atual
    const duplicados = pedidos.filter(p => 
      (p.id && p.id === pedido.id) || 
      (p.numero && p.numero === pedido.numero)
    );
    
    if (duplicados.length > 1) {
      console.error('❌ Pedidos duplicados na requisição atual:', pedido.id || pedido.numero);
      return false;
    }
  }
  
  console.log('✅ [LOCAL] Validação completa bem-sucedida - nenhum pedido já processado');
  return true;
}

export function useProcessarBaixaEstoque() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const monitor = MonitorIntegracao.getInstance();

  return useMutation({
    mutationFn: async ({ pedidos, contextoDaUI }: ProcessarBaixaParams): Promise<boolean> => {
      console.log('🛡️ Iniciando fluxo blindado de baixa de estoque');
      console.log('📸 Contexto da UI recebido:', !!contextoDaUI);
      
      // 🔍 VALIDAÇÃO COMPLETA DOS PEDIDOS - LOCAL COM VERIFICAÇÃO DE DUPLICAÇÃO
      if (!(await validarFluxoCompletoLocal(pedidos))) {
        const erroMsg = 'Validação dos pedidos falhou - alguns pedidos já foram processados ou têm dados inválidos';
        monitor.registrarOperacao(
          'baixa_estoque_validacao',
          'useEstoqueBaixa',
          'validacao',
          { pedidos: pedidos.length },
          'erro',
          erroMsg
        );
        throw new Error(erroMsg);
      }
      try {
        // 🔍 AUDITORIA: Verificar dados recebidos dos pedidos
        console.log('🔍 AUDITORIA - Pedidos completos recebidos:', pedidos.map(p => ({
          id: p.id,
          numero: p.numero,
          nome_cliente: p.nome_cliente,
          sku_kit: p.sku_kit,
          total_itens: p.total_itens,
          valor_total: p.valor_total,
          quantidade_itens: (p as any).quantidade_itens,
          mapping_data: contextoDaUI?.mappingData?.get(p.id)
        })));

        const baixas = pedidos.map(pedido => {
          // Preferir o SKU de estoque mapeado (de-para). Se não houver, cair para SKU kit e outros fallbacks
          const mapping = contextoDaUI?.mappingData?.get(pedido.id);
          const sku = (mapping?.skuKit || mapping?.skuEstoque ||
                      pedido.sku_kit || 
                      pedido.order_items?.[0]?.item?.seller_sku || 
                      pedido.itens?.[0]?.sku || 
                      '').toString();
          const quantidade = Number(pedido.total_itens || 0);
          
          console.log(`🔍 AUDITORIA - Pedido ${pedido.numero}:`, {
            sku_origem: pedido.sku_kit,
            sku_mapeado_estoque: mapping?.skuEstoque,
            sku_mapeado_kit: mapping?.skuKit,
            sku_final: sku,
            total_itens_origem: pedido.total_itens,
            quantidade_final: quantidade,
            valor_pedido: pedido.valor_total
          });
          
          return {
            sku: sku.trim().toUpperCase(),
            quantidade: quantidade
          };
        }).filter(baixa => {
          const valido = baixa.sku && baixa.quantidade > 0;
          if (!valido) {
            console.warn('❌ AUDITORIA - Baixa inválida filtrada:', baixa);
          }
          return valido;
        });

        console.log('🔍 DEBUG - Baixas filtradas:', baixas);

        if (baixas.length === 0) {
          console.error('❌ Nenhuma baixa válida encontrada');
          throw new Error('Nenhum pedido válido para baixa (SKU KIT e Total de Itens são obrigatórios)');
        }

        // 🛡️ VALIDAÇÃO CRÍTICA: Verificar se todos os SKUs existem no estoque E TÊM QUANTIDADE ANTES de buscar composições
        console.log('🔍 Verificando existência e quantidade dos SKUs no estoque...');
        const skusParaValidar = baixas.map(b => b.sku);
        
        const { data: produtosExistentes, error: validacaoError } = await supabase
          .from('produtos')
          .select('sku_interno, quantidade_atual')
          .in('sku_interno', skusParaValidar);
        
        if (validacaoError) {
          console.error('❌ Erro ao validar SKUs no estoque:', validacaoError);
          throw new Error('Erro ao validar produtos no estoque');
        }
        
        const produtosMap = new Map(produtosExistentes?.map(p => [p.sku_interno, p.quantidade_atual || 0]) || []);
        const skusNaoEncontrados = skusParaValidar.filter(sku => !produtosMap.has(sku));
        const skusSemEstoque = skusParaValidar.filter(sku => {
          const qtd = produtosMap.get(sku);
          return qtd !== undefined && qtd <= 0;
        });
        
        if (skusNaoEncontrados.length > 0) {
          const erroMsg = `❌ SKU(s) não cadastrado(s) no estoque: ${skusNaoEncontrados.join(', ')}. Por favor, cadastre os produtos antes de fazer a baixa.`;
          console.error(erroMsg);
          throw new Error(erroMsg);
        }
        
        if (skusSemEstoque.length > 0) {
          const erroMsg = `❌ SKU(s) sem estoque disponível (quantidade = 0): ${skusSemEstoque.join(', ')}. Por favor, reponha o estoque antes de fazer a baixa.`;
          console.error(erroMsg);
          throw new Error(erroMsg);
        }
        
        console.log('✅ Todos os SKUs estão cadastrados e possuem estoque disponível');
        
        // 🔍 ETAPA NOVA: Buscar composições e preparar baixa dos componentes
        console.log('🔍 Buscando composições dos produtos...');
        const baixasComponentes: Array<{ sku: string; quantidade: number }> = [];
        
        for (const baixa of baixas) {
          const skuMapeado = baixa.sku;
          
          // Buscar composição do produto em produto_componentes
          const { data: composicao, error: composicaoError } = await supabase
            .from('produto_componentes')
            .select('sku_componente, quantidade')
            .eq('sku_produto', skuMapeado);
          
          if (composicaoError) {
            console.error(`❌ Erro ao buscar composição para SKU ${skuMapeado}:`, composicaoError);
            continue;
          }
          
          if (!composicao || composicao.length === 0) {
            console.log(`⚠️ SKU ${skuMapeado} não tem composição definida, pulando...`);
            continue;
          }
          
          console.log(`📦 Composição encontrada para ${skuMapeado}:`, composicao);
          
          // Para cada componente, calcular quantidade total necessária
          for (const componente of composicao) {
            const quantidadeComponente = componente.quantidade * baixa.quantidade;
            baixasComponentes.push({
              sku: componente.sku_componente,
              quantidade: quantidadeComponente
            });
          }
        }
        
        if (baixasComponentes.length === 0) {
          console.warn('⚠️ Nenhum componente encontrado nas composições');
          throw new Error('Nenhum componente encontrado para baixa de estoque. Verifique se os produtos têm composições definidas.');
        }
        
        console.log('📋 Componentes para baixa:', baixasComponentes);

        // 🛡️ BAIXA DE ESTOQUE DOS COMPONENTES COM MONITORAMENTO
        const resultadoBaixa = await medirTempoExecucao(
          'baixar_estoque_componentes',
          'useEstoqueBaixa',
          'supabase',
          async () => {
            console.log('🔍 DEBUG - Chamando baixar_estoque_direto com componentes:', baixasComponentes);
            
            const { data, error } = await supabase.rpc('baixar_estoque_direto', {
              p_baixas: baixasComponentes
            });

            console.log('🔍 DEBUG - Resposta da função:', { data, error });

            if (error) {
              console.error('❌ Erro na função SQL:', error);
              throw error;
            }

            return data;
          }
        );

        const result = resultadoBaixa as any;
        
        // ✅ VALIDAR RESULTADO DA BAIXA ANTES DE CONTINUAR
        if (!result.success) {
          console.error('❌ Baixa de estoque falhou no RPC:', result);
          throw new Error('Falha na baixa de estoque: ' + (result.erros?.[0]?.erro || 'Erro desconhecido'));
        }
        
        console.log('✅ Baixa de estoque bem-sucedida, iniciando snapshots...');
        
        // 🛡️ HISTÓRICO COM MONITORAMENTO - SEMPRE TENTAR SALVAR
        await medirTempoExecucao(
          'salvar_historico',
          'useEstoqueBaixa',
          'historico_vendas',
          async () => {
            // Salvar snapshots para TODOS os pedidos (com ou sem contextoDaUI)
            const snapshot_promises = pedidos.map(async (pedido) => {
              try {
                await salvarSnapshotBaixa(pedido, contextoDaUI);
                console.log('📸 Snapshot salvo para pedido:', pedido.id || pedido.numero);
              } catch (error) {
                console.error('❌ Erro ao salvar snapshot:', error);
                // Não falha a operação principal se snapshot falhar
              }
            });
            
            await Promise.allSettled(snapshot_promises);
            console.log('📸 Processo de snapshots concluído');
          }
        );

        monitor.registrarOperacao(
          'baixa_estoque_completa',
          'useEstoqueBaixa',
          'sistema',
          { 
            totalPedidos: pedidos.length,
            totalBaixas: baixas.length,
            resultado: result
          },
          result.success ? 'sucesso' : 'erro',
          result.success ? 'Baixa processada com sucesso' : 'Falha na baixa de estoque'
        );

        return result.success;
      } catch (err) {
        console.error('❌ Erro na baixa de estoque:', err);
        
        monitor.registrarOperacao(
          'baixa_estoque_erro',
          'useEstoqueBaixa',
          'sistema',
          { pedidos: pedidos.length, erro: err },
          'erro',
          err instanceof Error ? err.message : 'Erro desconhecido'
        );
        
        throw err;
      }
    },
    onSuccess: (allSuccess) => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ["historico-simple"] });
      queryClient.invalidateQueries({ queryKey: ["historico-stats"] });
      queryClient.invalidateQueries({ queryKey: ["historico-vendas"] });

      toast({
        title: allSuccess ? "✅ Baixa concluída" : "⚠️ Baixa parcial",
        description: allSuccess ? "Todos pedidos processados com sucesso" : "Alguns pedidos falharam",
        variant: allSuccess ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      console.error('Erro na baixa:', error);
      toast({
        title: "❌ Erro na baixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useVerificarPedidoProcessado() {
  return useMutation({
    mutationFn: async (idUnico: string): Promise<boolean> => {
      // Usar o método privado através de uma versão pública
      // ou implementar verificação direta aqui
      return false; // Placeholder - implementar se necessário
    },
  });
}