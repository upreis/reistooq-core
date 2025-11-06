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
    if (loading || mapeamentos.length === 0 || !rows) {
      setRowsEnriquecidos(rows);
      return;
    }

    const enriquecidos = rows.map(row => {
      // Se unified é null, retornar row como está
      if (!row.unified) return row;
      
      const empresa = row.unified.empresa || '';
      const marketplace = row.unified.marketplace_origem || 'Mercado Livre';
      const tipoLogistico = row.unified.tipo_logistico_raw || row.unified.tipo_logistico || '';

      // Normalizar tipo logístico
      let tipoLogisticoNormalizado = tipoLogistico.toLowerCase();
      if (tipoLogisticoNormalizado.includes('fulfillment') || tipoLogisticoNormalizado.includes('full')) {
        tipoLogisticoNormalizado = 'fulfillment';
      } else if (tipoLogisticoNormalizado.includes('flex') || tipoLogisticoNormalizado.includes('self')) {
        tipoLogisticoNormalizado = 'flex';
      } else if (tipoLogisticoNormalizado.includes('cross')) {
        tipoLogisticoNormalizado = 'crossdocking';
      }

      // Buscar mapeamento correspondente
      const mapeamento = mapeamentos.find(m => 
        m.empresa === empresa &&
        m.marketplace === marketplace &&
        m.tipo_logistico.toLowerCase() === tipoLogisticoNormalizado
      );

      if (mapeamento && mapeamento.locais_estoque) {
        return {
          ...row,
          unified: {
            ...row.unified,
            local_estoque_id: mapeamento.local_estoque_id,
            local_estoque: mapeamento.locais_estoque.nome,
            local_estoque_nome: mapeamento.locais_estoque.nome
          }
        };
      }

      return row;
    });

    setRowsEnriquecidos(enriquecidos);
  }, [rows, mapeamentos, loading]);

  return {
    rowsEnriquecidos,
    loading,
    mapeamentos
  };
}
