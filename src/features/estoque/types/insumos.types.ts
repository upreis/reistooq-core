/**
 * 📦 TIPOS - COMPOSIÇÕES DE INSUMOS
 * Insumos debitados 1x por pedido (etiquetas, embalagens)
 */

export interface ComposicaoInsumo {
  id: string;
  organization_id: string;
  local_id: string; // ✅ CRÍTICO: Adicionar local_id
  sku_produto: string;
  sku_insumo: string;
  quantidade: number; // Sempre 1
  observacoes?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComposicaoInsumoEnriquecida extends ComposicaoInsumo {
  nome_produto?: string;
  nome_insumo?: string;
  estoque_disponivel?: number;
}

export interface InsumoFormData {
  sku_produto: string;
  sku_insumo: string;
  quantidade: number;
  observacoes?: string;
}

export interface ValidacaoInsumo {
  sku: string;
  existe: boolean;
  estoque_disponivel: number;
  estoque_suficiente: boolean;
  erro?: string;
}

export interface ResultadoBaixaInsumos {
  success: boolean;
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
  erros: Array<{
    sku: string;
    erro: string;
  }>;
}
