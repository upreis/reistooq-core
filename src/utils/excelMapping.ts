/**
 * SISTEMA ROBUSTO DE MAPEAMENTO EXCEL
 * 
 * Resolve problemas de:
 * - Objetos ExcelJS {_type, value}
 * - Case sensitivity (MATERIAL vs material)
 * - Acentos (PREÇO vs Preco)
 * - Espaços extras e caracteres especiais
 * - Validação de tipo de dados
 */

interface ValidationResult {
  valido: boolean;
  valor: any;
  motivo: string;
}

interface MappingResult {
  nome: string;
  valor: any;
  valido: boolean;
  motivo: string;
  prioridade: number;
  metodo: 'exato' | 'normalizado' | 'padrão';
  nomeOriginal?: string;
}

interface ProcessedProduct {
  produto: any;
  log: Record<string, MappingResult>;
  erros: string[];
  avisos: string[];
  valido: boolean;
}

/**
 * Normaliza nomes de colunas removendo acentos, espaços extras e caracteres especiais
 */
export function normalizarNomeColuna(nome: string): string {
  if (!nome) return '';
  
  return nome
    .toString()
    .trim()
    // Remove acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove caracteres especiais exceto parênteses e barras
    .replace(/[^\w\s()\/]/g, '')
    // Normaliza espaços (múltiplos → um)
    .replace(/\s+/g, ' ')
    // Remove espaços antes/depois de parênteses
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    // Remove espaços antes/depois de barras
    .replace(/\s*\/\s*/g, '/')
    .toUpperCase()
    .trim();
}

/**
 * Extrai valor real de objetos ExcelJS complexos
 */
export function extrairValorExcel(valor: any): any {
  // Null/undefined direto
  if (valor === null || valor === undefined) return null;
  
  // Se não é objeto, retorna direto
  if (typeof valor !== 'object') return valor;
  
  // Se é Date ou Array, retorna direto
  if (valor instanceof Date || Array.isArray(valor)) return valor;
  
  // Objetos ExcelJS com _type e value
  if ('_type' in valor && 'value' in valor) {
    return valor.value;
  }
  
  // Objetos com apenas 'value'
  if ('value' in valor) {
    return valor.value;
  }
  
  // RichText
  if ('richText' in valor) {
    return valor.richText.map((t: any) => t.text).join('');
  }
  
  // Fórmulas
  if ('result' in valor) {
    return valor.result;
  }
  
  // Texto simples
  if ('text' in valor) {
    return valor.text;
  }
  
  return valor;
}

/**
 * Valida se um valor é do tipo esperado
 */
export function validarTipoValor(valor: any, tipoEsperado: 'string' | 'number'): ValidationResult {
  const valorExtraido = extrairValorExcel(valor);
  
  if (valorExtraido === null || valorExtraido === undefined || valorExtraido === '') {
    return { 
      valido: false, 
      valor: tipoEsperado === 'number' ? 0 : '', 
      motivo: 'vazio' 
    };
  }
  
  if (tipoEsperado === 'number') {
    const valorStr = String(valorExtraido).trim();
    
    // Se contém letras (exceto notação científica), não é número válido
    if (/[a-zA-Z]/.test(valorStr.replace(/e[+-]?\d+/gi, ''))) {
      return { 
        valido: false, 
        valor: 0, 
        motivo: `contém texto: "${valorStr}"` 
      };
    }
    
    // Se contém caracteres inválidos para número
    if (/[^\d.,\-+eE\s]/.test(valorStr)) {
      return { 
        valido: false, 
        valor: 0, 
        motivo: `caracteres inválidos: "${valorStr}"` 
      };
    }
    
    // Tentar converter para número
    const numero = Number(valorStr.replace(',', '.'));
    if (isNaN(numero)) {
      return { 
        valido: false, 
        valor: 0, 
        motivo: `não é número válido: "${valorStr}"` 
      };
    }
    
    return { valido: true, valor: numero, motivo: 'ok' };
  }
  
  // Para strings, sempre válido
  return { valido: true, valor: String(valorExtraido), motivo: 'ok' };
}

/**
 * Busca valor em dados com prioridade e validação
 */
export function buscarValorComPrioridade(
  dados: Record<string, any>,
  nomesVariacoes: string[],
  tipoEsperado: 'string' | 'number' = 'string'
): MappingResult {
  const chavesDisponiveis = Object.keys(dados);
  const resultados: MappingResult[] = [];
  
  // PRIORIDADE 1: Busca exata
  for (const nome of nomesVariacoes) {
    if (dados.hasOwnProperty(nome)) {
      const validacao = validarTipoValor(dados[nome], tipoEsperado);
      
      resultados.push({
        nome: nome,
        valor: validacao.valor,
        valido: validacao.valido,
        motivo: validacao.motivo,
        prioridade: 1,
        metodo: 'exato'
      });
      
      // Se encontrou valor válido e não-vazio, usar este
      if (validacao.valido && validacao.valor !== (tipoEsperado === 'number' ? 0 : '')) {
        return resultados[resultados.length - 1];
      }
    }
  }
  
  // PRIORIDADE 2: Busca normalizada
  const nomesNormalizados = nomesVariacoes.map(normalizarNomeColuna);
  
  for (const chave of chavesDisponiveis) {
    const chaveNormalizada = normalizarNomeColuna(chave);
    const indiceEncontrado = nomesNormalizados.indexOf(chaveNormalizada);
    
    if (indiceEncontrado !== -1) {
      const validacao = validarTipoValor(dados[chave], tipoEsperado);
      
      resultados.push({
        nome: chave,
        valor: validacao.valor,
        valido: validacao.valido,
        motivo: validacao.motivo,
        prioridade: 2,
        metodo: 'normalizado',
        nomeOriginal: nomesVariacoes[indiceEncontrado]
      });
      
      // Se encontrou valor válido e não-vazio, usar este
      if (validacao.valido && validacao.valor !== (tipoEsperado === 'number' ? 0 : '')) {
        return resultados[resultados.length - 1];
      }
    }
  }
  
  // PRIORIDADE 3: Melhor resultado encontrado ou valor padrão
  const melhorResultado = resultados.find(r => r.valido) || resultados[0];
  
  if (melhorResultado) {
    return melhorResultado;
  }
  
  // Valor padrão
  return {
    nome: 'NÃO ENCONTRADO',
    valor: tipoEsperado === 'number' ? 0 : '',
    valido: false,
    motivo: 'coluna não existe',
    prioridade: 0,
    metodo: 'padrão'
  };
}

/**
 * Configuração de mapeamento de campos
 */
const FIELD_MAPPINGS = {
  sku: {
    nomes: ['SKU', 'sku', 'Sku', 'CODIGO', 'Codigo', 'codigo'],
    tipo: 'string' as const,
    obrigatorio: true
  },
  material: {
    nomes: ['MATERIAL', 'Material', 'material', 'MATERÍAL', 'Materíal', 'MATERIA', 'Materia'],
    tipo: 'string' as const,
    obrigatorio: true
  },
  cor: {
    nomes: ['COR', 'Cor', 'cor', 'COLOR', 'Color', 'color', 'CORES', 'Cores'],
    tipo: 'string' as const,
    obrigatorio: false
  },
  nome: {
    nomes: ['Nome do Produto', 'NOME DO PRODUTO', 'nome do produto', 'PRODUTO', 'Produto', 'produto', 'NOME', 'Nome', 'nome'],
    tipo: 'string' as const,
    obrigatorio: true
  },
  package: {
    nomes: ['PACKAGE', 'Package', 'package', 'EMBALAGEM', 'Embalagem', 'embalagem', 'PACOTE', 'Pacote'],
    tipo: 'string' as const,
    obrigatorio: false
  },
  preco_unitario: {
    nomes: ['PREÇO', 'Preço', 'PRECO', 'Preco', 'preco', 'PREÇO UNITÁRIO', 'Preço Unitário', 'PRECO UNITARIO', 'VALOR', 'Valor'],
    tipo: 'number' as const,
    obrigatorio: true
  },
  unidade: {
    nomes: ['UNIT', 'Unit', 'unit', 'UNIDADE', 'Unidade', 'unidade', 'Unid.', 'UNID.', 'UND', 'Und'],
    tipo: 'string' as const,
    obrigatorio: false
  },
  pcs_ctn: {
    nomes: ['PCS/CTN', 'pcs/ctn', 'Pcs/Ctn', 'PCS_CTN', 'pcs_ctn', 'PCS CTN', 'PCSCTN', 'PCS POR CTN'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  caixas: {
    nomes: ['CAIXAS', 'Caixas', 'caixas', 'BOXES', 'Boxes', 'boxes', 'CX', 'Cx', 'cx'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  peso_unitario_g: {
    nomes: ['PESO UNITARIO(g)', 'PESO UNITÁRIO(g)', 'Peso Unit. (g)', 'Peso Unitário (g)', 'PESO UNITARIO (g)', 'PESO(g)', 'Peso(g)'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  peso_emb_master_kg: {
    nomes: ['Peso embalado cx Master (KG)', 'Peso Emb. Master (KG)', 'PESO EMBALADO MASTER (KG)', 'PESO EMB MASTER'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  peso_sem_emb_master_kg: {
    nomes: ['Peso Sem embalagem cx Master (KG)', 'Peso S/ Emb. Master (KG)', 'PESO SEM EMBALAGEM MASTER (KG)', 'PESO SEM EMB MASTER'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  peso_total_emb_kg: {
    nomes: ['Peso total embalado cx Master (KG)', 'Peso Total Emb. (KG)', 'PESO TOTAL EMBALADO (KG)', 'PESO TOTAL EMB'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  peso_total_sem_emb_kg: {
    nomes: ['Peso total sem embalagem cx Master (KG)', 'Peso Total S/ Emb. (KG)', 'PESO TOTAL SEM EMBALAGEM (KG)', 'PESO TOTAL SEM EMB'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  comprimento_cm: {
    nomes: ['Comprimento', 'COMPRIMENTO', 'comprimento', 'Comp. (cm)', 'COMP. (CM)', 'COMP', 'Comp'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  largura_cm: {
    nomes: ['Largura', 'LARGURA', 'largura', 'Larg. (cm)', 'LARG. (CM)', 'LARG', 'Larg'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  altura_cm: {
    nomes: ['Altura', 'ALTURA', 'altura', 'Alt. (cm)', 'ALT. (CM)', 'ALT', 'Alt'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  cbm_cubagem: {
    nomes: ['CBM Cubagem', 'CBM CUBAGEM', 'cbm_cubagem', 'CBM', 'cbm', 'Cubagem', 'CUBAGEM'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  cbm_total: {
    nomes: ['CBM Total', 'CBM TOTAL', 'cbm_total', 'CBM Total (m³)', 'CBM TOTAL M3'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  quantidade_total: {
    nomes: ['Quantidade Total', 'QUANTIDADE TOTAL', 'quantidade_total', 'QTD Total', 'Qtd Total', 'QTD TOTAL', 'QUANTIDADE', 'quantidade'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  valor_total: {
    nomes: ['Valor Total', 'VALOR TOTAL', 'valor_total', 'Preço Total', 'PREÇO TOTAL', 'PRECO TOTAL', 'PRECO_TOTAL', 'preco_total'],
    tipo: 'number' as const,
    obrigatorio: false
  },
  obs: {
    nomes: ['OBS', 'obs', 'Obs', 'Observações', 'OBSERVAÇÕES', 'observacoes', 'Obs.', 'OBSERVACAO'],
    tipo: 'string' as const,
    obrigatorio: false
  }
};

/**
 * Mapeia dados do Excel usando sistema robusto
 */
export function mapearDadosExcel(dadoExcel: Record<string, any>, index: number = 0): ProcessedProduct {
  const produtoMapeado: Record<string, any> = {};
  const logMapeamento: Record<string, MappingResult> = {};
  const erros: string[] = [];
  const avisos: string[] = [];
  
  // Log inicial apenas para primeiro item
  if (index === 0) {
    console.log('🔧 [MAPEAMENTO ROBUSTO] Processamento iniciado');
    console.log('📊 [MAPEAMENTO] Campos disponíveis no Excel:', Object.keys(dadoExcel));
  }
  
  // Processar cada campo
  Object.entries(FIELD_MAPPINGS).forEach(([campo, config]) => {
    const resultado = buscarValorComPrioridade(dadoExcel, config.nomes, config.tipo);
    
    produtoMapeado[campo] = resultado.valor;
    logMapeamento[campo] = resultado;
    
    // Validações
    if (config.obrigatorio && !resultado.valido) {
      erros.push(`${campo} é obrigatório mas ${resultado.motivo}`);
    }
    
    if (!resultado.valido && resultado.motivo !== 'vazio' && resultado.motivo !== 'coluna não existe') {
      avisos.push(`${campo}: ${resultado.motivo}`);
    }
    
    // Log detalhado apenas para primeiro item
    if (index === 0) {
      const status = resultado.valido ? '✅' : '❌';
      const metodo = resultado.metodo ? `[${resultado.metodo}]` : '';
      console.log(`   ${status} ${campo}: "${resultado.valor}" (${resultado.nome}) ${metodo} - ${resultado.motivo}`);
    }
  });
  
  // Garantir que SKU tem um valor padrão
  if (!produtoMapeado.sku || produtoMapeado.sku === '') {
    produtoMapeado.sku = `PROD-${index + 1}`;
    avisos.push('SKU gerado automaticamente');
  }
  
  // Log do resultado apenas para primeiro item
  if (index === 0) {
    const camposValidos = Object.values(logMapeamento).filter(r => r.valido).length;
    const camposInvalidos = Object.values(logMapeamento).filter(r => !r.valido).length;
    
    console.log(`\n📋 [MAPEAMENTO] Resultado: ${camposValidos} válidos, ${camposInvalidos} inválidos`);
    
    if (erros.length > 0) {
      console.log('🔴 [MAPEAMENTO] Erros:', erros);
    }
    
    if (avisos.length > 0) {
      console.log('⚠️ [MAPEAMENTO] Avisos:', avisos);
    }
  }
  
  return {
    produto: produtoMapeado,
    log: logMapeamento,
    erros: erros,
    avisos: avisos,
    valido: erros.length === 0
  };
}

/**
 * Processa múltiplos itens do Excel
 */
export function processarDadosExcel(dados: any[]): {
  produtos: any[];
  relatorio: {
    total: number;
    sucessos: number;
    erros: number;
    avisos: number;
    problemasComuns: Record<string, number>;
  };
} {
  console.log(`🚀 [MAPEAMENTO] Processando ${dados.length} itens`);
  
  const produtos: any[] = [];
  const relatorio = {
    total: dados.length,
    sucessos: 0,
    erros: 0,
    avisos: 0,
    problemasComuns: {} as Record<string, number>
  };
  
  dados.forEach((item, index) => {
    try {
      const resultado = mapearDadosExcel(item, index);
      
      if (resultado.valido) {
        produtos.push(resultado.produto);
        relatorio.sucessos++;
      } else {
        relatorio.erros++;
      }
      
      if (resultado.avisos.length > 0) {
        relatorio.avisos++;
      }
      
      // Agregar problemas comuns
      resultado.erros.forEach(erro => {
        relatorio.problemasComuns[erro] = (relatorio.problemasComuns[erro] || 0) + 1;
      });
      
    } catch (error) {
      console.error(`💥 [MAPEAMENTO] Erro ao processar item ${index + 1}:`, error);
      relatorio.erros++;
    }
  });
  
  // Relatório final
  console.log('\n📊 [MAPEAMENTO] RELATÓRIO FINAL:');
  console.log(`   Total: ${relatorio.total}`);
  console.log(`   ✅ Sucessos: ${relatorio.sucessos}`);
  console.log(`   ❌ Erros: ${relatorio.erros}`);
  console.log(`   ⚠️ Avisos: ${relatorio.avisos}`);
  console.log(`   📈 Taxa de sucesso: ${((relatorio.sucessos / relatorio.total) * 100).toFixed(1)}%`);
  
  // Problemas mais comuns
  if (Object.keys(relatorio.problemasComuns).length > 0) {
    console.log('\n🔍 [MAPEAMENTO] Problemas mais comuns:');
    Object.entries(relatorio.problemasComuns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([problema, count]) => {
        console.log(`   ${count}x: ${problema}`);
      });
  }
  
  return { produtos, relatorio };
}
