export type TipoLocalEstoque = 'principal' | 'fullfilment_ml' | 'fullfilment_shopee' | 'filial' | 'outro';

export interface LocalEstoque {
  id: string;
  organization_id: string;
  nome: string;
  tipo: TipoLocalEstoque;
  endereco?: string | null;
  descricao?: string | null;
  ativo: boolean;
  is_system?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstoquePorLocal {
  id: string;
  produto_id: string;
  local_id: string;
  quantidade: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface LocalEstoqueFormData {
  nome: string;
  tipo: TipoLocalEstoque;
  endereco?: string;
  descricao?: string;
}
