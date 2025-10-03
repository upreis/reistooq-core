/**
 * Type Guards e validações para CotacoesInternacionaisTab
 * Resolve inconsistências de tipagem e melhora type safety
 */

// Definir interfaces localmente para evitar dependência circular
export interface CotacaoInternacional {
  id?: string;
  numero_cotacao: string;
  descricao: string;
  pais_origem: string;
  moeda_origem: string;
  fator_multiplicador: number;
  data_abertura: string;
  data_fechamento?: string | null;
  status: 'rascunho' | 'aberta' | 'fechada' | 'cancelada';
  observacoes?: string | null;
  container_tipo?: string; // Tipo de container selecionado ('20' ou '40')
  produtos: ProdutoCotacao[];
  total_peso_kg: number;
  total_cbm: number;
  total_quantidade: number;
  total_valor_origem: number;
  total_valor_usd: number;
  total_valor_brl: number;
}

export interface ProdutoCotacao {
  id: string;
  sku: string;
  nome: string;
  imagem?: string | null;
  imagem_fornecedor?: string | null;
  material: string;
  cor?: string;
  package_qtd: number;
  preco_unitario: number;
  unidade_medida: string;
  pcs_ctn: number;
  qtd_caixas_pedido: number;
  peso_unitario_g: number;
  peso_emb_master_kg?: number;
  peso_sem_emb_master_kg?: number;
  peso_total_emb_kg?: number;
  peso_total_sem_emb_kg?: number;
  largura_cm: number;
  altura_cm: number;
  comprimento_cm: number;
  peso_total_kg: number;
  cbm_unitario: number;
  cbm_total: number;
  quantidade_total: number;
  valor_total: number;
  obs?: string;
  // Campos calculados
  change_dolar?: number;
  change_dolar_total?: number;
  multiplicador_reais?: number;
  multiplicador_reais_total?: number;
}

/**
 * Type guard para verificar se um objeto é uma CotacaoInternacional válida
 */
export function isCotacaoInternacional(obj: unknown): obj is CotacaoInternacional {
  if (!obj || typeof obj !== 'object') return false;
  
  const cotacao = obj as Record<string, unknown>;
  
  return (
    typeof cotacao.numero_cotacao === 'string' &&
    typeof cotacao.descricao === 'string' &&
    typeof cotacao.pais_origem === 'string' &&
    typeof cotacao.moeda_origem === 'string' &&
    typeof cotacao.fator_multiplicador === 'number' &&
    typeof cotacao.data_abertura === 'string' &&
    Array.isArray(cotacao.produtos) &&
    (cotacao.status === 'rascunho' || 
     cotacao.status === 'aberta' || 
     cotacao.status === 'fechada' || 
     cotacao.status === 'cancelada')
  );
}

/**
 * Type guard para verificar se um objeto é um ProdutoCotacao válido
 */
export function isProdutoCotacao(obj: unknown): obj is ProdutoCotacao {
  if (!obj || typeof obj !== 'object') return false;
  
  const produto = obj as Record<string, unknown>;
  
  return (
    typeof produto.id === 'string' &&
    typeof produto.sku === 'string' &&
    typeof produto.nome === 'string' &&
    typeof produto.material === 'string' &&
    typeof produto.package_qtd === 'number' &&
    typeof produto.preco_unitario === 'number' &&
    typeof produto.unidade_medida === 'string' &&
    typeof produto.pcs_ctn === 'number' &&
    typeof produto.qtd_caixas_pedido === 'number' &&
    typeof produto.peso_unitario_g === 'number' &&
    typeof produto.largura_cm === 'number' &&
    typeof produto.altura_cm === 'number' &&
    typeof produto.comprimento_cm === 'number'
  );
}

/**
 * Valida e sanitiza array de cotações
 */
export function validateCotacoes(cotacoes: unknown): CotacaoInternacional[] {
  if (!Array.isArray(cotacoes)) {
    console.warn('validateCotacoes: input is not an array');
    return [];
  }
  
  return cotacoes
    .filter(cotacao => {
      const isValid = isCotacaoInternacional(cotacao);
      if (!isValid) {
        console.warn('validateCotacoes: invalid cotacao found:', cotacao);
      }
      return isValid;
    })
    .map(cotacao => sanitizeCotacao(cotacao));
}

/**
 * Sanitiza uma cotação garantindo valores padrão seguros
 */
export function sanitizeCotacao(cotacao: CotacaoInternacional): CotacaoInternacional {
  return {
    ...cotacao,
    data_fechamento: cotacao.data_fechamento || null,
    observacoes: cotacao.observacoes || null,
    total_peso_kg: cotacao.total_peso_kg || 0,
    total_cbm: cotacao.total_cbm || 0,
    total_quantidade: cotacao.total_quantidade || 0,
    total_valor_origem: cotacao.total_valor_origem || 0,
    total_valor_usd: cotacao.total_valor_usd || 0,
    total_valor_brl: cotacao.total_valor_brl || 0,
    produtos: cotacao.produtos.map(produto => sanitizeProduto(produto))
  };
}

/**
 * Sanitiza um produto garantindo valores padrão seguros
 */
export function sanitizeProduto(produto: Partial<ProdutoCotacao>): ProdutoCotacao {
  const sanitized: ProdutoCotacao = {
    id: produto.id || `${Date.now()}-${Math.random()}`,
    sku: produto.sku || '',
    nome: produto.nome || '',
    imagem: produto.imagem || null,
    imagem_fornecedor: produto.imagem_fornecedor || null,
    material: produto.material || '',
    cor: produto.cor,
    package_qtd: produto.package_qtd || 1,
    preco_unitario: produto.preco_unitario || 0,
    unidade_medida: produto.unidade_medida || 'PCS',
    pcs_ctn: produto.pcs_ctn || 1,
    qtd_caixas_pedido: produto.qtd_caixas_pedido || 1,
    peso_unitario_g: produto.peso_unitario_g || 0,
    peso_emb_master_kg: produto.peso_emb_master_kg,
    peso_sem_emb_master_kg: produto.peso_sem_emb_master_kg,
    peso_total_emb_kg: produto.peso_total_emb_kg,
    peso_total_sem_emb_kg: produto.peso_total_sem_emb_kg,
    largura_cm: produto.largura_cm || 0,
    altura_cm: produto.altura_cm || 0,
    comprimento_cm: produto.comprimento_cm || 0,
    peso_total_kg: produto.peso_total_kg || 0,
    cbm_unitario: produto.cbm_unitario || 0,
    cbm_total: produto.cbm_total || 0,
    quantidade_total: produto.quantidade_total || 0,
    valor_total: produto.valor_total || 0,
    obs: produto.obs,
    change_dolar: produto.change_dolar,
    change_dolar_total: produto.change_dolar_total,
    multiplicador_reais: produto.multiplicador_reais,
    multiplicador_reais_total: produto.multiplicador_reais_total
  };
  
  // Recalcular campos derivados se necessário
  if (sanitized.peso_total_kg === 0) {
    sanitized.peso_total_kg = (sanitized.peso_unitario_g * sanitized.qtd_caixas_pedido) / 1000;
  }
  
  if (sanitized.cbm_unitario === 0) {
    sanitized.cbm_unitario = (sanitized.largura_cm * sanitized.altura_cm * sanitized.comprimento_cm) / 1000000;
  }
  
  if (sanitized.cbm_total === 0) {
    sanitized.cbm_total = sanitized.cbm_unitario * sanitized.qtd_caixas_pedido;
  }
  
  if (sanitized.quantidade_total === 0) {
    sanitized.quantidade_total = sanitized.package_qtd * sanitized.pcs_ctn * sanitized.qtd_caixas_pedido;
  }
  
  if (sanitized.valor_total === 0) {
    sanitized.valor_total = sanitized.preco_unitario * sanitized.qtd_caixas_pedido;
  }
  
  return sanitized;
}

/**
 * Verifica se uma string é um status válido de cotação
 */
export function isValidStatus(status: unknown): status is 'rascunho' | 'aberta' | 'fechada' | 'cancelada' {
  return (
    status === 'rascunho' ||
    status === 'aberta' ||
    status === 'fechada' ||
    status === 'cancelada'
  );
}

/**
 * Verifica se uma string é uma moeda válida
 */
export function isValidCurrency(currency: unknown): currency is string {
  if (typeof currency !== 'string') return false;
  
  const validCurrencies = [
    'USD', 'CNY', 'EUR', 'JPY', 'KRW', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK',
    'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'SGD', 'HKD', 'NZD', 'MXN', 'INR',
    'RUB', 'TRY', 'ZAR', 'THB', 'MYR', 'IDR', 'PHP', 'VND'
  ];
  
  return validCurrencies.includes(currency.toUpperCase());
}

/**
 * Calcula totais de uma cotação baseado nos produtos
 */
export function calculateCotacaoTotals(produtos: ProdutoCotacao[]): {
  total_peso_kg: number;
  total_cbm: number;
  total_quantidade: number;
  total_valor_origem: number;
} {
  const validProdutos = produtos.filter(isProdutoCotacao);
  
  return validProdutos.reduce(
    (totals, produto) => ({
      total_peso_kg: totals.total_peso_kg + (produto.peso_total_kg || 0),
      total_cbm: totals.total_cbm + (produto.cbm_total || 0),
      total_quantidade: totals.total_quantidade + (produto.quantidade_total || 0),
      total_valor_origem: totals.total_valor_origem + (produto.valor_total || 0)
    }),
    {
      total_peso_kg: 0,
      total_cbm: 0,
      total_quantidade: 0,
      total_valor_origem: 0
    }
  );
}

/**
 * Valida dados de produto antes de adicionar à cotação
 */
export interface ProdutoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProdutoData(produto: Partial<ProdutoCotacao>, isAutoSave: boolean = false): ProdutoValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validações obrigatórias (mais flexíveis para auto-save)
  if (!produto.sku || produto.sku.trim() === '') {
    if (isAutoSave) {
      warnings.push('SKU não preenchido');
    } else {
      errors.push('SKU é obrigatório');
    }
  }
  
  if (!produto.nome || produto.nome.trim() === '') {
    if (isAutoSave) {
      warnings.push('Nome do produto não preenchido');
    } else {
      errors.push('Nome do produto é obrigatório');
    }
  }
  
  // Validações de valores - apenas para adição manual, não para auto-save
  if (!isAutoSave) {
    if ((produto.preco_unitario || 0) <= 0) {
      errors.push('Preço unitário deve ser maior que zero');
    }
    
    if ((produto.package_qtd || 0) <= 0) {
      errors.push('Quantidade por package deve ser maior que zero');
    }
    
    if ((produto.pcs_ctn || 0) <= 0) {
      errors.push('PCS/CTN deve ser maior que zero');
    }
    
    if ((produto.qtd_caixas_pedido || 0) <= 0) {
      errors.push('Quantidade de caixas deve ser maior que zero');
    }
  }
  
  // Validações de warning (sempre aplicadas, mas não bloqueiam)
  if ((produto.peso_unitario_g || 0) === 0) {
    warnings.push('Peso unitário não informado - pode afetar cálculos de frete');
  }
  
  if ((produto.largura_cm || 0) === 0 || (produto.altura_cm || 0) === 0 || (produto.comprimento_cm || 0) === 0) {
    warnings.push('Dimensões não informadas - pode afetar cálculos de cubagem');
  }
  
  if (!produto.material || produto.material.trim() === '') {
    warnings.push('Material não informado');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}