import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/types/pedido';
import { InsumosValidationService } from './InsumosValidationService';

export type StatusBaixaInsumo = 'pronto' | 'sem_mapeamento_insumo' | 'sem_cadastro_insumo' | 'pendente_insumo';

export interface MapeamentoVerificacao {
  skuPedido: string;
  temMapeamento: boolean;
  skuEstoque?: string;      // sku_correspondente (SKU Correto) 
  skuKit?: string;          // sku_simples (SKU Unitário)
  quantidadeKit?: number;
  skuCadastradoNoEstoque?: boolean; // 🛡️ NOVO: Se o SKU existe na tabela produtos
  statusBaixa?: 'pronto_baixar' | 'sem_estoque' | 'sem_mapear' | 'sku_nao_cadastrado' | 'pedido_baixado' | 'sem_composicao';
  statusInsumo?: StatusBaixaInsumo; // 🔧 NOVO: Status dos insumos
  detalhesInsumo?: {
    skusFaltando?: string[];
    detalhes?: string;
  };
  localEstoqueId?: string; // 🛡️ NOVO: ID do local de estoque sendo verificado
  localEstoqueNome?: string; // 🛡️ NOVO: Nome do local de estoque
}

export class MapeamentoService {
  /**
   * Verifica se existe mapeamento para uma lista de SKUs de pedido
   * 🛡️ ATUALIZADO: Agora verifica estoque dos COMPONENTES no local específico via estoque_por_local
   */
  static async verificarMapeamentos(
    skusPedido: string[], 
    localEstoqueId?: string,
    quantidadePorSku?: Map<string, number>
  ): Promise<MapeamentoVerificacao[]> {
    if (skusPedido.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido, sku_correspondente, sku_simples, quantidade')
        .in('sku_pedido', skusPedido)
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao verificar mapeamentos:', error);
        return skusPedido.map(sku => ({
          skuPedido: sku,
          temMapeamento: false,
          statusBaixa: 'sem_mapear'
        }));
      }

      // Cria um mapa dos mapeamentos encontrados
      const mapeamentosMap = new Map(
        (data || []).map(item => [
          item.sku_pedido,
          {
            skuEstoque: item.sku_correspondente, // SKU Correto (para coluna SKU Estoque)
            skuKit: item.sku_simples,           // SKU Unitário (para coluna SKU Kit)
            quantidadeKit: item.quantidade || 1
          }
        ])
      );

      // 🤖 INTELIGÊNCIA AUTOMÁTICA: Criar mapeamentos para SKUs sem correspondência
      const skusSemMapeamento = skusPedido.filter(sku => !mapeamentosMap.has(sku));
      
      if (skusSemMapeamento.length > 0) {
        console.log(`🤖 Criando mapeamentos automáticos para ${skusSemMapeamento.length} SKUs:`, skusSemMapeamento);
        await this.criarMapeamentosAutomaticos(skusSemMapeamento);
      }

      // 🛡️ VERIFICAÇÃO POR LOCAL: Buscar nome do local se fornecido
      let nomeLocal: string | undefined;
      if (localEstoqueId) {
        const { data: localData } = await supabase
          .from('locais_estoque')
          .select('nome')
          .eq('id', localEstoqueId)
          .maybeSingle();
        
        nomeLocal = localData?.nome;
        console.log(`🏢 [MapeamentoService] Verificando estoque no local: ${nomeLocal} (${localEstoqueId})`);
      }

      // 🛡️ VERIFICAÇÃO CRÍTICA POR LOCAL: Verificar estoque dos COMPONENTES
      const skusParaVerificar = [...mapeamentosMap.values()]
        .map(m => m.skuEstoque)
        .filter((sku): sku is string => !!sku);

      let produtosInfoMap = new Map<string, { existe: boolean; quantidade: number; temEstoqueNoLocal: boolean }>();
      
      if (skusParaVerificar.length > 0) {
        // Primeiro: buscar informações básicas dos produtos
        const { data: produtosExistentes } = await supabase
          .from('produtos')
          .select('id, sku_interno, quantidade_atual')
          .in('sku_interno', skusParaVerificar)
          .eq('ativo', true);

        if (produtosExistentes) {
          for (const produto of produtosExistentes) {
            // Para cada produto (composição), buscar seus componentes NO LOCAL ESPECÍFICO
            let queryComponentes = supabase
              .from('produto_componentes')
              .select('sku_componente, quantidade')
              .eq('sku_produto', produto.sku_interno);
            
            // 🛡️ CRÍTICO: Filtrar por local_id se fornecido
            if (localEstoqueId) {
              queryComponentes = queryComponentes.eq('local_id', localEstoqueId);
            }
            
            const { data: componentes } = await queryComponentes;
            
            const localInfo = nomeLocal ? ` no local "${nomeLocal}"` : '';
            console.log(`📦 [MapeamentoService] Produto ${produto.sku_interno} tem ${componentes?.length || 0} componentes${localInfo}`);
            
            if (!componentes || componentes.length === 0) {
              // Sem componentes no local específico = sem composição neste local
              console.warn(`⚠️ [MapeamentoService] Produto ${produto.sku_interno} NÃO possui componentes cadastrados${localInfo}`);
              produtosInfoMap.set(produto.sku_interno, {
                existe: true,
                quantidade: 0,
                temEstoqueNoLocal: false
              });
              continue;
            }
            
            // Verificar estoque de CADA COMPONENTE no local específico
            let temEstoqueSuficiente = true;
            
            for (const comp of componentes) {
              // Buscar produto_id do componente
              const { data: produtoComponente } = await supabase
                .from('produtos')
                .select('id, sku_interno')
                .eq('sku_interno', comp.sku_componente)
                .maybeSingle();
              
              if (!produtoComponente) {
                console.warn(`⚠️ Componente ${comp.sku_componente} não encontrado`);
                temEstoqueSuficiente = false;
                break;
              }
              
              // Se há localEstoqueId, verificar estoque_por_local
              if (localEstoqueId) {
                const quantidadeNecessariaComponente = comp.quantidade * (quantidadePorSku?.get(produto.sku_interno) || 1);
                
                const { data: estoqueLocal } = await supabase
                  .from('estoque_por_local')
                  .select('quantidade')
                  .eq('produto_id', produtoComponente.id)
                  .eq('local_id', localEstoqueId)
                  .maybeSingle();
                
                const quantidadeDisponivel = estoqueLocal?.quantidade || 0;
                
                console.log(`🔍 [MapeamentoService] Componente ${comp.sku_componente}: Necessário=${quantidadeNecessariaComponente}, Disponível no local=${quantidadeDisponivel}`);
                
                if (quantidadeDisponivel < quantidadeNecessariaComponente) {
                  temEstoqueSuficiente = false;
                  break;
                }
              }
            }
            
            produtosInfoMap.set(produto.sku_interno, {
              existe: true,
              quantidade: temEstoqueSuficiente ? 1 : 0,
              temEstoqueNoLocal: temEstoqueSuficiente
            });
          }
        }
      }

      // 🔧 VALIDAÇÃO DE INSUMOS
      const skusEstoqueValidos = skusParaVerificar.filter(Boolean);
      const validacoesInsumos = skusEstoqueValidos.length > 0 
        ? await InsumosValidationService.validarInsumosPedidos(skusEstoqueValidos)
        : new Map();

      // 🔍 VERIFICAR COMPOSIÇÕES
      const skusParaVerificarComposicao = [...produtosInfoMap.keys()];
      let composicoesMap = new Map<string, { temComposicao: boolean; componentes?: any[] }>();
      
      console.log('🔍 [FLUXO CORRETO] Verificando se SKUs são COMPOSIÇÕES:', skusParaVerificarComposicao);
      
      if (skusParaVerificarComposicao.length > 0) {
        const { data: produtosComposicoes } = await supabase
          .from('produtos_composicoes')
          .select('sku_interno')
          .in('sku_interno', skusParaVerificarComposicao)
          .eq('ativo', true);

        if (produtosComposicoes) {
          for (const prodComp of produtosComposicoes) {
            // 🛡️ CRÍTICO: Buscar componentes NO LOCAL ESPECÍFICO
            let queryComponentes = supabase
              .from('produto_componentes')
              .select('*')
              .eq('sku_produto', prodComp.sku_interno);
            
            // 🛡️ Filtrar por local_id se fornecido
            if (localEstoqueId) {
              queryComponentes = queryComponentes.eq('local_id', localEstoqueId);
            }
            
            const { data: componentes } = await queryComponentes;
            
            const localInfo = nomeLocal ? ` no local "${nomeLocal}"` : '';
            const temComponentes = componentes && componentes.length > 0;
            
            console.log(`🔍 [MapeamentoService] SKU ${prodComp.sku_interno}: ${componentes?.length || 0} componentes${localInfo}`);
            
            composicoesMap.set(prodComp.sku_interno, {
              temComposicao: temComponentes,
              componentes: componentes || []
            });
          }
        }
      }

      // Retorna resultado para todos os SKUs com statusBaixa calculado e validação de insumos
      return skusPedido.map(sku => {
        const mapeamento = mapeamentosMap.get(sku);
        const temMapeamento = !!mapeamento;
        const skuEstoque = mapeamento?.skuEstoque;
        
        let statusBaixa: 'pronto_baixar' | 'sem_estoque' | 'sem_mapear' | 'sku_nao_cadastrado' | 'pedido_baixado' | 'sem_composicao';
        let skuCadastradoNoEstoque = false;

        if (!temMapeamento || !skuEstoque) {
          // Sem mapeamento ou sem SKU de estoque definido
          statusBaixa = 'sem_mapear';
        } else {
          const produtoInfo = produtosInfoMap.get(skuEstoque);
          
          if (!produtoInfo?.existe) {
            // Tem mapeamento mas o SKU não existe na tabela produtos
            statusBaixa = 'sku_nao_cadastrado';
            skuCadastradoNoEstoque = false;
          } else if (produtoInfo.quantidade <= 0) {
            // 🛡️ CRÍTICO: SKU existe mas quantidade é zero
            statusBaixa = 'sem_estoque';
            skuCadastradoNoEstoque = true;
          } else {
            // 🔍 FLUXO CORRETO: Verificar se produto está em produtos_composicoes E tem componentes no local
            const composicaoData = composicoesMap.get(skuEstoque);
            const localInfo = nomeLocal ? ` no local "${nomeLocal}"` : '';
            
            console.log(`🔍 [FLUXO CORRETO] SKU: ${skuEstoque} | É composição: ${!!composicaoData?.temComposicao}${localInfo}`);
            
            if (!composicaoData?.temComposicao) {
              // NÃO tem componentes cadastrados no local específico = Sem Composição
              statusBaixa = 'sem_composicao';
              console.log(`⚠️ [FLUXO CORRETO] SKU ${skuEstoque} NÃO possui composição cadastrada${localInfo} -> SEM_COMPOSICAO`);
            } else if (!composicaoData?.componentes || composicaoData.componentes.length === 0) {
              // Está em produtos_composicoes mas sem componentes cadastrados no local
              statusBaixa = 'sem_composicao';
              console.log(`⚠️ [FLUXO CORRETO] SKU ${skuEstoque} está em produtos_composicoes mas SEM componentes${localInfo} -> SEM_COMPOSICAO`);
            } else {
              // Tem composição E componentes no local = Pronto para baixar
              statusBaixa = 'pronto_baixar';
              console.log(`✅ [FLUXO CORRETO] SKU ${skuEstoque} tem composição com ${composicaoData.componentes.length} componentes${localInfo} -> PRONTO_BAIXAR`);
            }
            skuCadastradoNoEstoque = true;
          }
        }

        // 🔧 Buscar validação de insumos
        const validacaoInsumo = skuEstoque ? validacoesInsumos.get(skuEstoque) : undefined;

        return {
          skuPedido: sku,
          temMapeamento,
          skuEstoque: mapeamento?.skuEstoque,
          skuKit: mapeamento?.skuKit,
          quantidadeKit: mapeamento?.quantidadeKit,
          skuCadastradoNoEstoque,
          statusBaixa,
          statusInsumo: validacaoInsumo?.status,
          detalhesInsumo: {
            skusFaltando: validacaoInsumo?.skusFaltando,
            detalhes: validacaoInsumo?.detalhes
          },
          localEstoqueId,
          localEstoqueNome: nomeLocal
        };
      });

    } catch (error) {
      console.error('Erro inesperado ao verificar mapeamentos:', error);
      return skusPedido.map(sku => ({
        skuPedido: sku,
        temMapeamento: false,
        statusBaixa: 'sem_mapear'
      }));
    }
  }

  /**
   * Verifica se existe mapeamento para um único SKU
   * 🛡️ ATUALIZADO: Agora também verifica se o SKU está cadastrado no estoque
   */
  static async verificarMapeamento(skuPedido: string): Promise<MapeamentoVerificacao> {
    const resultados = await this.verificarMapeamentos([skuPedido]);
    const mapeamento = resultados[0] || {
      skuPedido,
      temMapeamento: false
    };

    // 🛡️ VERIFICAÇÃO CRÍTICA: Confirmar se o SKU está cadastrado na tabela produtos E TEM ESTOQUE
    if (mapeamento.temMapeamento && mapeamento.skuEstoque) {
      const { data: produtoExiste, error } = await supabase
        .from('produtos')
        .select('id, ativo, quantidade_atual')
        .eq('sku_interno', mapeamento.skuEstoque)
        .eq('ativo', true)
        .maybeSingle();

      mapeamento.skuCadastradoNoEstoque = !error && !!produtoExiste;
      
      // 🛡️ Calcular status da baixa
      if (!mapeamento.skuCadastradoNoEstoque) {
        mapeamento.statusBaixa = 'sku_nao_cadastrado';
      } else if ((produtoExiste?.quantidade_atual || 0) <= 0) {
        // 🛡️ CRÍTICO: SKU cadastrado mas sem estoque
        mapeamento.statusBaixa = 'sem_estoque';
      } else {
        mapeamento.statusBaixa = 'pronto_baixar';
      }
    } else {
      mapeamento.skuCadastradoNoEstoque = false;
      mapeamento.statusBaixa = 'sem_mapear';
    }

    return mapeamento;
  }

  /**
   * 🤖 CRIA MAPEAMENTOS AUTOMÁTICOS para SKUs sem correspondência
   * Evita duplicatas e preenche apenas o sku_pedido
   */
  static async criarMapeamentosAutomaticos(skusPedido: string[]): Promise<void> {
    if (skusPedido.length === 0) return;

    try {
      // Verificar se já existem registros (evitar duplicatas)
      const { data: existentes, error: errorCheck } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido')
        .in('sku_pedido', skusPedido);

      if (errorCheck) {
        console.error('Erro ao verificar SKUs existentes:', errorCheck);
        return;
      }

      const skusExistentes = new Set((existentes || []).map(item => item.sku_pedido));
      const skusParaCriar = skusPedido.filter(sku => !skusExistentes.has(sku));

      if (skusParaCriar.length === 0) {
        console.log('✅ Todos os SKUs já possuem registros no De-Para');
        return;
      }

      // Criar novos mapeamentos com apenas sku_pedido preenchido
      const novosMapeamentos = skusParaCriar.map(sku => ({
        sku_pedido: sku,
        sku_correspondente: null,
        sku_simples: null, 
        quantidade: 1,
        ativo: true,
        motivo_criacao: 'auto_detectado',
        data_mapeamento: new Date().toISOString()
      }));

      const { error: errorInsert } = await supabase
        .from('mapeamentos_depara')
        .upsert(novosMapeamentos, { 
          onConflict: 'sku_pedido',
          ignoreDuplicates: true 
        });

      if (errorInsert) {
        console.error('Erro ao criar mapeamentos automáticos:', errorInsert);
      } else {
        console.log(`✅ Criados ${skusParaCriar.length} mapeamentos automáticos:`, skusParaCriar);
      }

    } catch (err) {
      console.error('Erro na criação automática de mapeamentos:', err);
    }
  }

  /**
   * Busca estatísticas de mapeamentos ativos
   */
  static async getEstatisticasMapeamentos() {
    try {
      const { data, error } = await supabase
        .from('mapeamentos_depara')
        .select('id, ativo, sku_correspondente, sku_simples')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
          total: 0,
          comEstoque: 0,
          semEstoque: 0
        };
      }

      const total = data?.length || 0;
      const comEstoque = data?.filter(item => item.sku_correspondente || item.sku_simples).length || 0;
      const semEstoque = total - comEstoque;

      return {
        total,
        comEstoque,
        semEstoque
      };

    } catch (error) {
      console.error('Erro inesperado ao buscar estatísticas:', error);
      return {
        total: 0,
        comEstoque: 0,
        semEstoque: 0
      };
    }
  }

  /**
   * Enriquece pedidos com dados de mapeamento
   */
  static async enriquecerPedidosComMapeamento(pedidos: Pedido[]): Promise<Pedido[]> {
    if (pedidos.length === 0) return pedidos;
    
    // Extrair todos os SKUs dos pedidos
    const skusPedido = pedidos.flatMap(pedido => {
      if (pedido.itens && pedido.itens.length > 0) {
        return pedido.itens.map(item => item.sku);
      }
      // Fallback para extrair da obs se não tiver itens
      if (pedido.obs) {
        return pedido.obs.split(',').map(sku => sku.trim());
      }
      return [pedido.numero];
    });

    try {
      const { data: mapeamentos, error } = await supabase
        .from('mapeamentos_depara')
        .select('sku_pedido, sku_correspondente, sku_simples, quantidade, ativo')
        .in('sku_pedido', skusPedido)
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar mapeamentos:', error);
        return pedidos;
      }

      // Criar um mapa de mapeamentos por SKU
      const mapeamentosMap = new Map(
        mapeamentos?.map(m => [m.sku_pedido, m]) || []
      );

      // Enriquecer cada pedido com dados de mapeamento
      return pedidos.map(pedido => {
        let skuEstoque = null;
        let skuKit = null;
        let qtdKit = null;
        let statusEstoque: 'pronto_baixar' | 'sem_estoque' | 'pedido_baixado' = 'pronto_baixar';

        // Procurar mapeamento pelos itens ou pela obs
        if (pedido.itens && pedido.itens.length > 0) {
          const itemComMapeamento = pedido.itens.find(item => 
            mapeamentosMap.has(item.sku)
          );
          
          if (itemComMapeamento) {
            const mapeamento = mapeamentosMap.get(itemComMapeamento.sku);
            skuEstoque = mapeamento?.sku_correspondente || mapeamento?.sku_simples;
            skuKit = mapeamento?.sku_pedido;
            qtdKit = mapeamento?.quantidade;
          } else {
            statusEstoque = 'sem_estoque';
          }
        } else if (pedido.obs) {
          // Fallback para buscar na obs
          const skusDaObs = pedido.obs.split(',').map(s => s.trim());
          const skuComMapeamento = skusDaObs.find(sku => mapeamentosMap.has(sku));
          
          if (skuComMapeamento) {
            const mapeamento = mapeamentosMap.get(skuComMapeamento);
            skuEstoque = mapeamento?.sku_correspondente || mapeamento?.sku_simples;
            skuKit = mapeamento?.sku_pedido;
            qtdKit = mapeamento?.quantidade;
          } else {
            statusEstoque = 'sem_estoque';
          }
        }

        return {
          ...pedido,
          sku_estoque: skuEstoque,
          sku_kit: skuKit,
          qtd_kit: qtdKit,
          status_estoque: statusEstoque
        };
      });

    } catch (error) {
      console.error('Erro ao enriquecer pedidos com mapeamento:', error);
      return pedidos;
    }
  }
}