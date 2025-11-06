import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Row } from '@/services/orders';

interface MapeamentoLocal {
  id: string;
  empresa: string;
  tipo_logistico: string;
  marketplace: string;
  local_estoque_id: string;
  locais_estoque?: {
    id: string;
    nome: string;
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
            marketplace,
            local_estoque_id,
            locais_estoque (
              id,
              nome
            )
          `)
          .eq('ativo', true);

        if (error) throw error;
        console.log('📦 [LocalEstoque] Mapeamentos carregados:', data);
        setMapeamentos((data || []) as MapeamentoLocal[]);
      } catch (error) {
        console.error('❌ Erro ao carregar mapeamentos de locais:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarMapeamentos();
  }, []);

  // Enriquecer rows com local de estoque
  useEffect(() => {
    // ✅ Se não há pedidos, retorna array vazio
    if (!rows || rows.length === 0) {
      console.log('📦 [LocalEstoque] Nenhum pedido para enriquecer');
      setRowsEnriquecidos([]);
      return;
    }
    
    // ⏳ Se ainda está carregando mapeamentos, retorna pedidos sem enriquecimento
    if (loading) {
      console.log('📦 [LocalEstoque] Aguardando mapeamentos... Processando', rows.length, 'pedidos sem enriquecimento');
      setRowsEnriquecidos(rows);
      return;
    }

    console.log('📦 [LocalEstoque] Iniciando enriquecimento de', rows.length, 'pedidos');
    console.log('📦 [LocalEstoque] Mapeamentos disponíveis:', mapeamentos);

    const enriquecidos = rows.map((row, index) => {
      // ✅ CORREÇÃO CRÍTICA: Campos estão no NÍVEL SUPERIOR do row, não dentro de unified
      const rowAny = row as any;
      const empresa = rowAny.empresa || row.unified?.empresa || '';
      const marketplace = rowAny.marketplace_origem || row.unified?.marketplace_origem || 'Mercado Livre';
      const tipoLogistico = rowAny.tipo_logistico_raw || rowAny.tipo_logistico || row.unified?.tipo_logistico_raw || row.unified?.tipo_logistico || '';

      // Função para normalizar tipo logístico de forma consistente
      const normalizarTipoLogistico = (tipo: string): string => {
        const tipoLower = tipo.toLowerCase().trim();
        if (tipoLower.includes('fulfillment') || tipoLower.includes('full')) {
          return 'fulfillment';
        } else if (tipoLower.includes('flex') || tipoLower.includes('self') || tipoLower.includes('envios')) {
          return 'flex';
        } else if (tipoLower.includes('cross')) {
          return 'crossdocking';
        }
        return tipoLower;
      };

      const tipoLogisticoNormalizado = normalizarTipoLogistico(tipoLogistico);

      if (index < 3) {
        console.log(`📦 [LocalEstoque] ========== Pedido #${index} ==========`);
        console.log(`📦 [LocalEstoque] Número: ${rowAny.numero || row.unified?.numero}`);
        console.log(`📦 [LocalEstoque] ESPERADO: empresa, marketplace, tipo_logistico`);
        console.log(`📦 [LocalEstoque] RECEBIDO DO PEDIDO:`, {
          empresa,
          marketplace,
          tipoLogistico,
          tipoLogisticoNormalizado
        });
        console.log(`📦 [LocalEstoque] Row completo (keys):`, Object.keys(row));
      }

      // Buscar mapeamento correspondente
      const mapeamento = mapeamentos.find(m => {
        // ✅ Normalizar AMBOS os lados para garantir match correto
        const tipoMapeamentoNormalizado = normalizarTipoLogistico(m.tipo_logistico);
        
        const match = 
          m.empresa === empresa &&
          m.marketplace === marketplace &&
          tipoMapeamentoNormalizado === tipoLogisticoNormalizado;
        
        if (index < 3) {
          console.log(`📦 [LocalEstoque] --- Testando mapeamento ---`);
          console.log(`📦 [LocalEstoque] Mapeamento DB:`, {
            empresa: m.empresa,
            marketplace: m.marketplace,
            tipo_logistico_original: m.tipo_logistico,
            tipo_logistico_normalizado: tipoMapeamentoNormalizado
          });
          console.log(`📦 [LocalEstoque] Comparação:`, {
            empresa_match: m.empresa === empresa,
            marketplace_match: m.marketplace === marketplace,
            tipo_match: tipoMapeamentoNormalizado === tipoLogisticoNormalizado,
            tipo_pedido_norm: tipoLogisticoNormalizado,
            tipo_mapeamento_norm: tipoMapeamentoNormalizado,
            MATCH_FINAL: match
          });
        }
        
        return match;
      });

      if (mapeamento && mapeamento.locais_estoque) {
        if (index < 3) {
          console.log(`✅ [LocalEstoque] MAPEAMENTO ENCONTRADO!`, {
            local_estoque_id: mapeamento.local_estoque_id,
            local_estoque_nome: mapeamento.locais_estoque.nome
          });
        }
        return {
          ...row,
          local_estoque_id: mapeamento.local_estoque_id,
          local_estoque: mapeamento.locais_estoque.nome,
          local_estoque_nome: mapeamento.locais_estoque.nome,
          unified: {
            ...(row.unified || {}),
            local_estoque_id: mapeamento.local_estoque_id,
            local_estoque: mapeamento.locais_estoque.nome,
            local_estoque_nome: mapeamento.locais_estoque.nome
          }
        };
      } else {
        if (index < 3) {
          console.log(`❌ [LocalEstoque] NENHUM MAPEAMENTO ENCONTRADO`);
          console.log(`❌ [LocalEstoque] Total de mapeamentos disponíveis: ${mapeamentos.length}`);
        }
      }

      return row;
    });

    console.log('📦 [LocalEstoque] Enriquecimento concluído');
    setRowsEnriquecidos(enriquecidos as any);
  }, [rows, mapeamentos, loading]);

  return {
    rowsEnriquecidos,
    loading,
    mapeamentos
  };
}
