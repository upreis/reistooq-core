// 🛡️ SISTEMA BLINDADO - HOOK DE BAIXA DE ESTOQUE PROTEGIDO COM SUPORTE A LOCAIS
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarSnapshotBaixa } from '@/utils/snapshot';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validarFluxoCompleto, type PedidoEnriquecido } from '@/core/integracao';
import { MonitorIntegracao, medirTempoExecucao } from '@/core/integracao/MonitorIntegracao';
import { buildIdUnico } from '@/utils/idUnico';
import { processarBaixaInsumos } from '@/services/InsumosBaixaService';
import { baixarEstoqueLocal, verificarEstoqueLocal } from '@/services/EstoquePorLocalService';

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

        // 🛡️ NOVA LÓGICA: Verificar estoque nos locais específicos de cada pedido
        console.log('🔍 Verificando estoque nos locais específicos dos pedidos...');
        
        const errosVerificacao: string[] = [];
        
        for (const baixa of baixas) {
          const pedido = pedidos.find(p => {
            const mapping = contextoDaUI?.mappingData?.get(p.id);
            const sku = (mapping?.skuKit || mapping?.skuEstoque || p.sku_kit || '').toString().trim().toUpperCase();
            return sku === baixa.sku;
          });

          if (!pedido) {
            errosVerificacao.push(`Pedido não encontrado para SKU ${baixa.sku}`);
            continue;
          }

          // Extrair local_estoque_id do pedido enriquecido
          const localEstoqueId = (pedido as any).local_estoque_id;
          const localEstoqueNome = (pedido as any).local_estoque_nome || (pedido as any).local_estoque || 'Sem local definido';

          if (!localEstoqueId) {
            errosVerificacao.push(
              `❌ Pedido ${pedido.numero || pedido.id} (SKU: ${baixa.sku}) não possui local de estoque definido. ` +
              `Configure o mapeamento de local de estoque em Configurações.`
            );
            continue;
          }

          console.log(`🔍 Verificando SKU ${baixa.sku} no local "${localEstoqueNome}" (${localEstoqueId})`);

          // Verificar se o SKU existe e tem estoque no local específico
          const verificacao = await verificarEstoqueLocal(baixa.sku, localEstoqueId, baixa.quantidade);

          if (!verificacao.sucesso) {
            errosVerificacao.push(
              `❌ ${verificacao.mensagem || `SKU ${baixa.sku} - problema no local "${localEstoqueNome}"`}`
            );
          } else {
            console.log(`✅ SKU ${baixa.sku} disponível no local "${localEstoqueNome}": ${verificacao.quantidade_disponivel} unidades`);
          }
        }

        if (errosVerificacao.length > 0) {
          const erroMsg = `Problemas encontrados na verificação de estoque:\n\n${errosVerificacao.join('\n')}`;
          console.error(erroMsg);
          throw new Error(erroMsg);
        }
        
        console.log('✅ Todos os SKUs estão disponíveis nos locais específicos dos pedidos');
        
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
            const erroMsg = `❌ ERRO CRÍTICO: SKU ${skuMapeado} passou na validação mas não tem composição cadastrada!`;
            console.error(erroMsg);
            throw new Error(erroMsg);
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

        // 🛡️ VALIDAÇÃO CRÍTICA: Verificar se TODOS os SKUs têm composição cadastrada
        console.log('🔍 Validando se todos os SKUs têm composição cadastrada...');
        const skusParaValidarComposicao = baixas.map(b => b.sku);
        
        const { data: composicoesExistentes, error: composicaoValidacaoError } = await supabase
          .from('produto_componentes')
          .select('sku_produto')
          .in('sku_produto', skusParaValidarComposicao);
        
        if (composicaoValidacaoError) {
          console.error('❌ Erro ao validar composições:', composicaoValidacaoError);
          throw new Error('Erro ao verificar composições dos produtos');
        }
        
        const skusComComposicao = new Set(composicoesExistentes?.map(c => c.sku_produto) || []);
        const skusSemComposicao = skusParaValidarComposicao.filter(sku => !skusComComposicao.has(sku));
        
        if (skusSemComposicao.length > 0) {
          const erroMsg = `❌ Os seguintes SKUs não têm composição cadastrada: ${skusSemComposicao.join(', ')}.\n\n` +
                          `Por favor, cadastre as composições em /estoque/composicoes antes de fazer a baixa.`;
          console.error(erroMsg);
          throw new Error(erroMsg);
        }
        
        console.log('✅ Todos os SKUs possuem composição cadastrada');

        // 🛡️ BAIXA DE ESTOQUE POR LOCAL COM MONITORAMENTO
        console.log('🚀 INICIANDO BAIXA DE ESTOQUE POR LOCAL');
        const resultadosBaixa: Array<{ sku: string; sucesso: boolean; local: string; erro?: string }> = [];
        
        const resultadoBaixa = await medirTempoExecucao(
          'baixar_estoque_por_local',
          'useEstoqueBaixa',
          'supabase',
          async () => {
            // Processar cada baixa no seu local específico
            for (const baixa of baixas) {
              const pedido = pedidos.find(p => {
                const mapping = contextoDaUI?.mappingData?.get(p.id);
                const sku = (mapping?.skuKit || mapping?.skuEstoque || p.sku_kit || '').toString().trim().toUpperCase();
                return sku === baixa.sku;
              });

              if (!pedido) {
                resultadosBaixa.push({
                  sku: baixa.sku,
                  sucesso: false,
                  local: 'Desconhecido',
                  erro: 'Pedido não encontrado'
                });
                continue;
              }

              const localEstoqueId = (pedido as any).local_estoque_id;
              const localEstoqueNome = (pedido as any).local_estoque_nome || (pedido as any).local_estoque || 'Desconhecido';

              try {
                console.log(`🔧 Baixando ${baixa.quantidade} unidades de ${baixa.sku} do local "${localEstoqueNome}"`);
                
                const resultado = await baixarEstoqueLocal(baixa.sku, localEstoqueId, baixa.quantidade);
                
                resultadosBaixa.push({
                  sku: baixa.sku,
                  sucesso: resultado.sucesso,
                  local: localEstoqueNome
                });
                
                console.log(`✅ Baixa realizada: ${baixa.sku} - ${resultado.mensagem}`);
              } catch (error) {
                const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
                console.error(`❌ Erro ao baixar ${baixa.sku}:`, mensagemErro);
                
                resultadosBaixa.push({
                  sku: baixa.sku,
                  sucesso: false,
                  local: localEstoqueNome,
                  erro: mensagemErro
                });
              }
            }

            // Verificar se todas as baixas foram bem-sucedidas
            const todasBemSucedidas = resultadosBaixa.every(r => r.sucesso);
            const erros = resultadosBaixa.filter(r => !r.sucesso);

            if (!todasBemSucedidas) {
              return {
                success: false,
                erros: erros.map(e => ({
                  erro: `${e.sku} no local "${e.local}": ${e.erro || 'Falha na baixa'}`
                }))
              };
            }

            return {
              success: true,
              baixas: resultadosBaixa
            };
          }
        );

        const result = resultadoBaixa as any;
        console.log('📊 RESULTADO DA BAIXA POR LOCAL:', result);
        
        // ✅ VALIDAR RESULTADO DA BAIXA ANTES DE CONTINUAR
        if (!result.success) {
          console.error('❌ Baixa de estoque falhou no RPC:', result);
          throw new Error('Falha na baixa de estoque: ' + (result.erros?.[0]?.erro || 'Erro desconhecido'));
        }
        
        console.log('✅ Baixa de estoque bem-sucedida, iniciando baixa de insumos...');
        
        // 🔧 BAIXA DE INSUMOS - Processar insumos dos produtos
        console.log('🔧 Iniciando baixa de insumos...');
        try {
          const skusUnicos = [...new Set(baixas.map(b => b.sku))];
          console.log('🔍 SKUs únicos para baixa de insumos:', skusUnicos);
          
          const resultadoInsumos = await processarBaixaInsumos(skusUnicos);
          console.log('📊 Resultado da baixa de insumos:', resultadoInsumos);
          
          if (!resultadoInsumos.success) {
            console.warn('⚠️ Aviso na baixa de insumos:', resultadoInsumos.message);
          } else {
            console.log('✅ Baixa de insumos concluída:', resultadoInsumos.message);
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