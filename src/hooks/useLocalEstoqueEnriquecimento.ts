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

      if (index < 3) {
        console.log(`📦 [LocalEstoque] Pedido #${index}:`, {
          empresa,
          marketplace,
          tipoLogistico,
          tipoLogisticoNormalizado,
          numero: row.unified.numero
        });
      }

      // Buscar mapeamento correspondente
      const mapeamento = mapeamentos.find(m => {
        const match = 
          m.empresa === empresa &&
          m.marketplace === marketplace &&
          m.tipo_logistico.toLowerCase() === tipoLogisticoNormalizado;
        
        if (index < 3) {
          console.log(`📦 [LocalEstoque] Testando mapeamento:`, {
            mapeamento: { empresa: m.empresa, marketplace: m.marketplace, tipo: m.tipo_logistico },
            pedido: { empresa, marketplace, tipo: tipoLogisticoNormalizado },
            match
          });
        }
        
        return match;
      });

      if (mapeamento && mapeamento.locais_estoque) {
        if (index < 3) {
          console.log(`✅ [LocalEstoque] Mapeamento encontrado para pedido #${index}:`, mapeamento.locais_estoque.nome);
        }
        return {
          ...row,
          unified: {
            ...row.unified,
            local_estoque_id: mapeamento.local_estoque_id,
            local_estoque: mapeamento.locais_estoque.nome,
            local_estoque_nome: mapeamento.locais_estoque.nome
          }
        };
      } else if (index < 3) {
        console.log(`⚠️ [LocalEstoque] Nenhum mapeamento encontrado para pedido #${index}`);
      }

      return row;
    });

    console.log('📦 [LocalEstoque] Enriquecimento concluído');
    setRowsEnriquecidos(enriquecidos);
  }, [rows, mapeamentos, loading]);

  return {
    rowsEnriquecidos,
    loading,
    mapeamentos
  };
}
