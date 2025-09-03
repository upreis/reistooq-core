import { ProdutoComposicao } from "@/hooks/useProdutosComposicoes";

// Adapter para converter ProdutoComposicao para formato esperado pelo ComposicoesModal
export interface ComposicoesModalProduct {
  id: string;
  sku_interno: string;
  nome: string;
  stock_status?: string;
  quantidade_atual: number;
  estoque_minimo: number;
  preco_venda: number;
  url_imagem?: string;
  categoria?: string;
  descricao?: string;
  created_at?: string;
  updated_at?: string;
  ativo: boolean;
  organization_id: string;
}

export function adaptProdutoComposicaoToModalProduct(produto: ProdutoComposicao): ComposicoesModalProduct {
  return {
    id: produto.id,
    sku_interno: produto.sku_interno,
    nome: produto.nome,
    stock_status: produto.status === 'active' ? 'in_stock' : 'out_of_stock',
    quantidade_atual: produto.quantidade_atual,
    estoque_minimo: produto.estoque_minimo,
    preco_venda: produto.preco_venda || 0,
    url_imagem: produto.url_imagem,
    categoria: produto.categoria,
    descricao: produto.descricao,
    created_at: produto.created_at,
    updated_at: produto.updated_at,
    ativo: produto.ativo,
    organization_id: produto.organization_id,
  };
}