import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Row } from '@/services/orders';

const isDev = process.env.NODE_ENV === 'development';

interface MapeamentoLocal {
  id: string;
  empresa: string;
  tipo_logistico: string;
  local_estoque_id: string;
  local_venda_id?: string | null;
  locais_estoque?: {
    id: string;
    nome: string;
  };
  locais_venda?: {
    id: string;
    nome: string;
    icone: string;
    local_estoque_id: string;
  };
}

/**
 * Hook que enriquece pedidos com informações de local de estoque
 * baseado no mapeamento configurado
 */
export function useLocalEstoqueEnriquecimento(rows: Row[]) {
  const [mapeamentos, setMapeamentos] = useState<MapeamentoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowsEnriquecidos, setRowsEnriquecidos] = useState<Row[]>(rows);
  const [refreshKey, setRefreshKey] = useState(0);

  // Função para forçar recarga dos mapeamentos
  const refreshMapeamentos = useCallback(async () => {
    if (isDev) console.log('🔄 [LocalEstoque] Forçando recarga de mapeamentos...');
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  }, []);

  // Buscar mapeamentos ativos
  useEffect(() => {
    async function carregarMapeamentos() {
      try {
        const { data, error } = await supabase
          .from('mapeamento_locais_estoque')
          .select(`
            id,
            empresa,
            tipo_logistico,
            local_estoque_id,
            local_venda_id,
            locais_estoque (
              id,
              nome
            ),
            locais_venda (
              id,
              nome,
              icone,
              local_estoque_id
            )
          `)
          .eq('ativo', true);

        if (error) throw error;
        if (isDev) console.log('📦 [LocalEstoque] Mapeamentos carregados:', data);
        setMapeamentos((data || []) as MapeamentoLocal[]);
      } catch (error) {
        console.error('❌ Erro ao carregar mapeamentos de locais:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarMapeamentos();
  }, [refreshKey]);

  // 🔄 Revalidar automaticamente quando houver mudanças no banco (como no fluxo do Mercado Livre)
  useEffect(() => {
    const channel = supabase
      .channel('realtime:mapeamento_locais_estoque')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mapeamento_locais_estoque' },
        () => {
          if (isDev) console.log('🔄 [LocalEstoque] Mudança detectada em mapeamento_locais_estoque, recarregando...');
          setLoading(true);
          setRefreshKey((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Enriquecer rows com local de estoque
  useEffect(() => {
    // ✅ Se não há pedidos, retorna array vazio
    if (!rows || rows.length === 0) {
      if (isDev) console.log('📦 [LocalEstoque] Nenhum pedido para enriquecer');
      setRowsEnriquecidos([]);
      return;
    }
    
    // ⏳ Se ainda está carregando mapeamentos, retorna pedidos sem enriquecimento
    if (loading) {
      if (isDev) console.log('📦 [LocalEstoque] Aguardando mapeamentos... Processando', rows.length, 'pedidos sem enriquecimento');
      setRowsEnriquecidos(rows);
      return;
    }

    if (isDev) {
      console.log('📦 [LocalEstoque] Iniciando enriquecimento de', rows.length, 'pedidos');
      console.log('📦 [LocalEstoque] Mapeamentos disponíveis:', mapeamentos);
    }

    const enriquecidos = rows.map((row, index) => {
      // ✅ CORREÇÃO CRÍTICA: Campos estão no NÍVEL SUPERIOR do row, não dentro de unified
      const rowAny = row as any;
      const empresa = rowAny.empresa || row.unified?.empresa || '';
      const tipoLogistico = rowAny.tipo_logistico_raw || rowAny.tipo_logistico || row.unified?.tipo_logistico_raw || row.unified?.tipo_logistico || '';

      // Função para normalizar tipo logístico de forma consistente
      // Inclui tipos ML (fulfillment, flex, etc) E tipos OMS (proprio, correios, etc)
      const normalizarTipoLogistico = (tipo: string): string => {
        if (!tipo) return '';
        const tipoLower = tipo.toLowerCase().trim();
        
        // ===== MERCADO LIVRE =====
        if (tipoLower.includes('fulfillment') || tipoLower.includes('full')) {
          return 'fulfillment';
        } else if (tipoLower.includes('flex') || tipoLower.includes('self') || tipoLower.includes('envios')) {
          return 'flex';
        } else if (tipoLower.includes('cross')) {
          return 'crossdocking';
        } else if (tipoLower.includes('drop')) {
          return 'dropoff';
        } else if (tipoLower.includes('xd_drop') || tipoLower.includes('ponto')) {
          return 'xd_dropoff';
        }
        
        // ===== OMS / ECOMM =====
        else if (tipoLower.includes('proprio') || tipoLower.includes('própria') || tipoLower.includes('propria')) {
          return 'proprio';
        } else if (tipoLower.includes('correios') || tipoLower.includes('pac') || tipoLower.includes('sedex')) {
          return 'correios';
        } else if (tipoLower.includes('transportadora')) {
          return 'transportadora';
        } else if (tipoLower.includes('motoboy')) {
          return 'motoboy';
        } else if (tipoLower.includes('retirada')) {
          return 'retirada';
        }
        
        // ===== SHOPEE =====
        else if (tipoLower.includes('shopee') && tipoLower.includes('xpress')) {
          return 'shopee_xpress';
        } else if (tipoLower.includes('shopee') && tipoLower.includes('direta')) {
          return 'shopee_direta';
        }
        
        // Retorna o valor original normalizado (lowercase)
        return tipoLower;
      };

      const tipoLogisticoNormalizado = normalizarTipoLogistico(tipoLogistico);

      if (isDev && index < 3) {
        console.log(`📦 [LocalEstoque] ========== Pedido #${index} ==========`);
        console.log(`📦 [LocalEstoque] Número: ${rowAny.numero || row.unified?.numero}`);
        console.log(`📦 [LocalEstoque] RECEBIDO DO PEDIDO:`, {
          empresa,
          tipoLogistico,
          tipoLogisticoNormalizado
        });
      }

      // Buscar mapeamento correspondente (Empresa + Tipo Logístico)
      // Estratégia: 1) Match EXATO primeiro, 2) Match NORMALIZADO depois
      const mapeamento = mapeamentos.find(m => {
        // ✅ Empresa deve ser igual (case insensitive)
        const empresaMatch = m.empresa?.toLowerCase().trim() === empresa?.toLowerCase().trim();
        
        if (!empresaMatch) return false;
        
        // ✅ 1) Tentar match EXATO primeiro (importante para tipos OMS como "proprio", "correios")
        const tipoExatoMatch = m.tipo_logistico?.toLowerCase().trim() === tipoLogistico?.toLowerCase().trim();
        
        // ✅ 2) Match NORMALIZADO (para compatibilidade com variações)
        const tipoMapeamentoNormalizado = normalizarTipoLogistico(m.tipo_logistico);
        const tipoNormalizadoMatch = tipoMapeamentoNormalizado === tipoLogisticoNormalizado;
        
        const tipoMatch = tipoExatoMatch || tipoNormalizadoMatch;
        const match = empresaMatch && tipoMatch;
        
        if (isDev && index < 3) {
          console.log(`📦 [LocalEstoque] --- Testando mapeamento ---`);
          console.log(`📦 [LocalEstoque] Mapeamento DB:`, {
            empresa: m.empresa,
            tipo_logistico_original: m.tipo_logistico,
            tipo_logistico_normalizado: tipoMapeamentoNormalizado
          });
          console.log(`📦 [LocalEstoque] Comparação:`, {
            empresa_match: empresaMatch,
            tipo_exato_match: tipoExatoMatch,
            tipo_normalizado_match: tipoNormalizadoMatch,
            tipo_pedido: tipoLogistico,
            tipo_pedido_norm: tipoLogisticoNormalizado,
            MATCH_FINAL: match
          });
        }
        
        return match;
      });

      if (mapeamento && mapeamento.locais_estoque) {
        if (isDev && index < 3) {
          console.log(`✅ [LocalEstoque] MAPEAMENTO ENCONTRADO!`, {
            local_estoque_id: mapeamento.local_estoque_id,
            local_estoque_nome: mapeamento.locais_estoque.nome,
            local_venda_id: mapeamento.local_venda_id,
            local_venda_nome: mapeamento.locais_venda?.nome
          });
        }
        return {
          ...row,
          local_estoque_id: mapeamento.local_estoque_id,
          local_estoque: mapeamento.locais_estoque.nome,
          local_estoque_nome: mapeamento.locais_estoque.nome,
          local_venda_id: mapeamento.local_venda_id || null,
          local_venda_nome: mapeamento.locais_venda?.nome || null,
          unified: {
            ...(row.unified || {}),
            local_estoque_id: mapeamento.local_estoque_id,
            local_estoque: mapeamento.locais_estoque.nome,
            local_estoque_nome: mapeamento.locais_estoque.nome,
            local_venda_id: mapeamento.local_venda_id || null,
            local_venda_nome: mapeamento.locais_venda?.nome || null
          }
        };
      } else {
        if (isDev && index < 3) {
          console.log(`❌ [LocalEstoque] NENHUM MAPEAMENTO ENCONTRADO`);
          console.log(`❌ [LocalEstoque] Total de mapeamentos disponíveis: ${mapeamentos.length}`);
        }
      }

      return row;
    });

    if (isDev) console.log('📦 [LocalEstoque] Enriquecimento concluído');
    setRowsEnriquecidos(enriquecidos as any);
  }, [rows, mapeamentos, loading]);

  return {
    rowsEnriquecidos,
    loading,
    mapeamentos,
    refreshMapeamentos
  };
}
