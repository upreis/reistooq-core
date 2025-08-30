import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarSnapshotBaixa } from '@/utils/snapshot';
import { Pedido } from '@/types/pedido';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validarFluxoCompleto, type PedidoEnriquecido } from '@/core/integracao';
import { MonitorIntegracao, medirTempoExecucao } from '@/core/integracao/MonitorIntegracao';

interface ProcessarBaixaParams {
  pedidos: Pedido[];  // Voltar para Pedido[] pois já vem enriquecido do SimplePedidosPage
  contextoDaUI?: {
    mappingData?: Map<string, any>;
    accounts?: any[];
    selectedAccounts?: string[];
    integrationAccountId?: string;
  };
}

// ✅ VALIDAÇÃO COMPLETA DOS PEDIDOS - NOVA IMPLEMENTAÇÃO
function validarFluxoCompletoLocal(pedidos: Pedido[]): boolean {
  console.log('🔍 [LOCAL] Validando fluxo completo de', pedidos.length, 'pedidos');
  
  for (const pedido of pedidos) {
    // Validar dados essenciais
    if (!pedido.id && !pedido.numero) {
      console.error('❌ Pedido sem ID ou número:', pedido);
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
    
    // Validar se não está duplicado
    const duplicados = pedidos.filter(p => 
      (p.id && p.id === pedido.id) || 
      (p.numero && p.numero === pedido.numero)
    );
    
    if (duplicados.length > 1) {
      console.error('❌ Pedidos duplicados encontrados:', pedido.id || pedido.numero);
      return false;
    }
  }
  
  console.log('✅ [LOCAL] Validação completa bem-sucedida');
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
      
      // 🔍 VALIDAÇÃO COMPLETA DOS PEDIDOS - LOCAL
      if (!validarFluxoCompletoLocal(pedidos)) {
        const erroMsg = 'Validação dos pedidos falhou - verifique se todos os pedidos têm sku_kit e total_itens válidos';
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
        // Extrair SKU KIT + Total de Itens dos pedidos
        console.log('🔍 DEBUG - Pedidos recebidos:', pedidos.map(p => ({
          id: p.id,
          numero: p.numero,
          sku_kit: p.sku_kit,
          total_itens: p.total_itens
        })));

        const baixas = pedidos.map(pedido => {
          // Pegar sku_kit e total_itens do pedido
          const sku = pedido.sku_kit || '';
          const quantidade = Number(pedido.total_itens || 0);
          
          console.log(`🔍 DEBUG - Pedido ${pedido.numero}: SKU="${sku}", Quantidade=${quantidade}`);
          
          return {
            sku: sku.trim(),
            quantidade: quantidade
          };
        }).filter(baixa => baixa.sku && baixa.quantidade > 0);

        console.log('🔍 DEBUG - Baixas filtradas:', baixas);

        if (baixas.length === 0) {
          console.error('❌ Nenhuma baixa válida encontrada');
          throw new Error('Nenhum pedido válido para baixa (SKU KIT e Total de Itens são obrigatórios)');
        }

        // 🛡️ BAIXA DE ESTOQUE COM MONITORAMENTO
        const resultadoBaixa = await medirTempoExecucao(
          'baixar_estoque_direto',
          'useEstoqueBaixa',
          'supabase',
          async () => {
            console.log('🔍 DEBUG - Chamando baixar_estoque_direto com:', baixas);
            
            const { data, error } = await supabase.rpc('baixar_estoque_direto', {
              p_baixas: baixas
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