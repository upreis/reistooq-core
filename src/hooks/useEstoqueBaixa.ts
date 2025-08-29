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

export function useProcessarBaixaEstoque() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const monitor = MonitorIntegracao.getInstance();

  return useMutation({
    mutationFn: async ({ pedidos, contextoDaUI }: ProcessarBaixaParams): Promise<boolean> => {
      console.log('🛡️ Iniciando fluxo blindado de baixa de estoque');
      
      // 🛡️ VALIDAÇÃO OBRIGATÓRIA DO FLUXO
      const validacao = validarFluxoCompleto(pedidos as PedidoEnriquecido[], contextoDaUI);
      if (!validacao.valido) {
        const erroMsg = `Validação falhou: ${validacao.erros.join(', ')}`;
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

      if (validacao.avisos.length > 0) {
        console.warn('⚠️ Avisos na validação:', validacao.avisos);
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
        
        // 🛡️ HISTÓRICO COM MONITORAMENTO (mantém fluxo original)
        if (result.success && contextoDaUI) {
          await medirTempoExecucao(
            'salvar_historico',
            'useEstoqueBaixa',
            'historico_vendas',
            async () => {
              // Salvar snapshots apenas para histórico (não afeta estoque)
              for (const pedido of pedidos) {
                try {
                  await salvarSnapshotBaixa(pedido, contextoDaUI);
                } catch (e) {
                  console.warn('Erro ao salvar histórico:', e);
                }
              }
            }
          );
        }

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