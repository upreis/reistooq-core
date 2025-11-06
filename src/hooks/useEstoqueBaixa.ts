// 🛡️ SISTEMA BLINDADO - HOOK DE BAIXA DE ESTOQUE PROTEGIDO
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarSnapshotBaixa } from '@/utils/snapshot';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validarFluxoCompleto, type PedidoEnriquecido } from '@/core/integracao';
import { MonitorIntegracao, medirTempoExecucao } from '@/core/integracao/MonitorIntegracao';
import { buildIdUnico } from '@/utils/idUnico';
import { processarBaixaInsumos } from '@/services/InsumosBaixaService';
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

      // 🔧 VALIDAÇÃO DE INSUMOS - Bloquear baixa se algum pedido tiver problemas com insumos
      if (contextoDaUI?.mappingData) {
        const pedidosComProblemaInsumo = pedidos.filter(pedido => {
          const mapping = contextoDaUI.mappingData?.get(pedido.id);
          const statusInsumo = mapping?.statusInsumo;
          
          // Bloquear se status não for "pronto" (ou seja, tem algum problema)
          return statusInsumo && statusInsumo !== 'pronto';
        });

        if (pedidosComProblemaInsumo.length > 0) {
          const detalhes = pedidosComProblemaInsumo.map(p => {
            const mapping = contextoDaUI.mappingData?.get(p.id);
            return `Pedido ${p.numero || p.id}: ${mapping?.statusInsumo} - ${mapping?.detalhesInsumo || ''}`;
          }).join('\n');
          
          const erroMsg = `❌ Não é possível fazer a baixa. ${pedidosComProblemaInsumo.length} pedido(s) com problemas nos insumos:\n${detalhes}`;
          console.error(erroMsg);
          throw new Error(erroMsg);
        }
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

        // 🛡️ VALIDAÇÃO CRÍTICA: Validar pedidos têm local definido
        console.log('🔍 Validando locais de estoque dos pedidos...');
        
        for (const pedido of pedidos) {
          const localEstoqueId = (pedido as any).local_estoque_id;
          
          if (!localEstoqueId) {
            const erroMsg = `❌ Pedido ${pedido.numero || pedido.id} sem local de estoque definido`;
            console.error(erroMsg);
            throw new Error(erroMsg);
          }
        }
        
        console.log('✅ Todos os pedidos têm local de estoque definido');
        
        // 🔍 BUSCAR COMPOSIÇÕES E VALIDAR ESTOQUE POR LOCAL
        console.log('🔍 Buscando composições e validando estoque por local...');
        
        // Mapa para armazenar componentes necessários por pedido
        const componentesPorPedido = new Map<string, Array<{ sku: string; quantidade: number; produtoId: string }>>();
        
        for (const pedido of pedidos) {
          const localEstoqueId = (pedido as any).local_estoque_id;
          const localEstoqueNome = (pedido as any).local_estoque_nome || (pedido as any).local_estoque;
          const mapping = contextoDaUI?.mappingData?.get(pedido.id);
          const skuProduto = (mapping?.skuKit || mapping?.skuEstoque || pedido.sku_kit).toString().trim().toUpperCase();
          const quantidadePedido = Number(pedido.total_itens || 0);
          
          console.log(`📦 Processando pedido ${pedido.numero}: SKU=${skuProduto}, Qtd=${quantidadePedido}, Local=${localEstoqueNome} (ID: ${localEstoqueId})`);
          
          // ✅ CRÍTICO: Buscar composições do produto FILTRADAS POR LOCAL
          const { data: composicoes, error: compError } = await supabase
            .from('produto_componentes')
            .select('sku_componente, quantidade')
            .eq('sku_produto', skuProduto)
            .eq('local_id', localEstoqueId);
          
          if (compError) {
            console.error(`❌ Erro ao buscar composições para ${skuProduto}:`, compError);
            throw new Error(`Erro ao buscar composições: ${compError.message}`);
          }
          
          if (!composicoes || composicoes.length === 0) {
            throw new Error(`Produto ${skuProduto} não possui composição cadastrada no local "${localEstoqueNome}" em /estoque/composicoes`);
          }
          
          console.log(`✅ Composição encontrada para ${skuProduto}:`, composicoes);
          
          // Para cada componente, validar estoque no local específico
          const componentesDoPedido: Array<{ sku: string; quantidade: number; produtoId: string }> = [];
          
          for (const comp of composicoes) {
            const quantidadeNecessaria = comp.quantidade * quantidadePedido;
            
            // Buscar produto_id do componente
            const { data: produtoComponente, error: prodError } = await supabase
              .from('produtos')
              .select('id, sku_interno, quantidade_atual')
              .eq('sku_interno', comp.sku_componente)
              .maybeSingle();
            
            if (prodError || !produtoComponente) {
              throw new Error(`Componente ${comp.sku_componente} não encontrado no cadastro de produtos`);
            }
            
            // Verificar estoque no local específico
            const { data: estoqueLocal, error: estoqueError } = await supabase
              .from('estoque_por_local')
              .select('quantidade')
              .eq('produto_id', produtoComponente.id)
              .eq('local_id', localEstoqueId)
              .maybeSingle();
            
            const quantidadeDisponivel = estoqueLocal?.quantidade || 0;
            
            console.log(`🔍 Componente ${comp.sku_componente}: Necessário=${quantidadeNecessaria}, Disponível no local=${quantidadeDisponivel}`);
            
            if (quantidadeDisponivel < quantidadeNecessaria) {
              throw new Error(
                `❌ Estoque insuficiente no local "${localEstoqueNome}"\n` +
                `Componente: ${comp.sku_componente}\n` +
                `Necessário: ${quantidadeNecessaria}\n` +
                `Disponível: ${quantidadeDisponivel}`
              );
            }
            
            componentesDoPedido.push({
              sku: comp.sku_componente,
              quantidade: quantidadeNecessaria,
              produtoId: produtoComponente.id
            });
          }
          
          componentesPorPedido.set(pedido.id, componentesDoPedido);
        }
        
        console.log('✅ Todos os componentes têm estoque suficiente nos locais específicos');


        // 🛡️ BAIXA DE COMPONENTES NO LOCAL ESPECÍFICO
        console.log('🚀 INICIANDO BAIXA DE COMPONENTES POR LOCAL');
        const resultadoBaixa = await medirTempoExecucao(
          'baixar_componentes_por_local',
          'useEstoqueBaixa',
          'supabase',
          async () => {
            // Processar cada pedido e seus componentes
            for (const pedido of pedidos) {
              const localEstoqueId = (pedido as any).local_estoque_id;
              const componentes = componentesPorPedido.get(pedido.id) || [];
              
              console.log(`🔽 Baixando ${componentes.length} componentes do pedido ${pedido.numero} no local ${localEstoqueId}`);
              
              for (const componente of componentes) {
                // Buscar estoque atual no local
                const { data: estoqueAtual } = await supabase
                  .from('estoque_por_local')
                  .select('quantidade')
                  .eq('produto_id', componente.produtoId)
                  .eq('local_id', localEstoqueId)
                  .single();
                
                const novaQuantidade = (estoqueAtual?.quantidade || 0) - componente.quantidade;
                
                // Atualizar estoque no local
                const { error: updateError } = await supabase
                  .from('estoque_por_local')
                  .update({ quantidade: novaQuantidade })
                  .eq('produto_id', componente.produtoId)
                  .eq('local_id', localEstoqueId);
                
                if (updateError) {
                  throw new Error(`Erro ao baixar componente ${componente.sku}: ${updateError.message}`);
                }
                
                console.log(`✅ Componente ${componente.sku}: ${componente.quantidade} unidades baixadas`);
              }
            }
            
            return { success: true };
          }
        );

        const result = resultadoBaixa as any;
        console.log('📊 RESULTADO DA BAIXA:', result);
        
        // ✅ VALIDAR RESULTADO DA BAIXA ANTES DE CONTINUAR
        if (!result.success) {
          console.error('❌ Baixa de estoque falhou no RPC:', result);
          throw new Error('Falha na baixa de estoque: ' + (result.erros?.[0]?.erro || 'Erro desconhecido'));
        }
        
        console.log('✅ Baixa de estoque bem-sucedida, iniciando baixa de insumos...');
        
        // 🔧 BAIXA DE INSUMOS - Processar insumos dos produtos POR LOCAL
        console.log('🔧 Iniciando baixa de insumos por local...');
        try {
          // ✅ NOVO: Agrupar pedidos por local de estoque para processar insumos
          const pedidosPorLocal = new Map<string, { localId: string; localNome: string; skus: string[] }>();
          
          for (const pedido of pedidos) {
            const localEstoqueId = (pedido as any).local_estoque_id;
            const localEstoqueNome = (pedido as any).local_estoque_nome || (pedido as any).local_estoque;
            const mapping = contextoDaUI?.mappingData?.get(pedido.id);
            const sku = (mapping?.skuKit || mapping?.skuEstoque || pedido.sku_kit).toString().trim().toUpperCase();
            
            if (!pedidosPorLocal.has(localEstoqueId)) {
              pedidosPorLocal.set(localEstoqueId, {
                localId: localEstoqueId,
                localNome: localEstoqueNome,
                skus: []
              });
            }
            
            pedidosPorLocal.get(localEstoqueId)!.skus.push(sku);
          }
          
          // Processar insumos para cada local
          for (const [localId, info] of pedidosPorLocal) {
            const skusUnicos = [...new Set(info.skus)];
            console.log(`🔍 Processando ${skusUnicos.length} SKUs únicos para baixa de insumos no local "${info.localNome}"`, skusUnicos);
            
            const resultadoInsumos = await processarBaixaInsumos(skusUnicos, localId);
            console.log(`📊 Resultado da baixa de insumos no local "${info.localNome}":`, resultadoInsumos);
            
            if (!resultadoInsumos.success) {
              console.warn(`⚠️ Aviso na baixa de insumos no local "${info.localNome}":`, resultadoInsumos.message);
            } else {
              console.log(`✅ Baixa de insumos concluída no local "${info.localNome}":`, resultadoInsumos.message);
            }
          }
        } catch (insumoError) {
          console.error('❌ Erro ao processar insumos:', insumoError);
        }
        
        console.log('📸 Iniciando processo de snapshots...');
        
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