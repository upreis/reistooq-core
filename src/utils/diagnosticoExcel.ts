/**
 * Código de Diagnóstico para Importação de Dados do Excel
 * Identifica problemas no mapeamento e tipos de dados
 */

/**
 * Função de diagnóstico - verifica estrutura dos dados extraídos
 */
export function diagnosticarImportacaoExcel(dadosExtraidos: any[]) {
  console.log('🔍 ==================== DIAGNÓSTICO DA IMPORTAÇÃO DE EXCEL ====================');
  
  // 1. Verificar estrutura dos dados extraídos
  console.log('📊 Estrutura dos dados extraídos:');
  if (Array.isArray(dadosExtraidos)) {
    console.log(`   - Tipo: Array com ${dadosExtraidos.length} itens`);
    
    if (dadosExtraidos.length > 0) {
      const primeiroItem = dadosExtraidos[0];
      console.log('   - Primeiro item completo:', JSON.stringify(primeiroItem, null, 2));
      console.log('   - Chaves disponíveis:', Object.keys(primeiroItem));
      
      // Verificar cada campo importante
      const camposImportantes = [
        'SKU', 'MATERIAL', 'COR', 'PACKAGE', 'PREÇO', 'UNIT', 
        'PCS/CTN', 'CAIXAS', 'PESO UNITARIO(g)', 'Comprimento', 
        'Largura', 'Altura', 'CBM Cubagem'
      ];
      
      console.log('🔍 Verificação de campos importantes:');
      camposImportantes.forEach(campo => {
        const valor = primeiroItem[campo];
        const existe = campo in primeiroItem;
        const temValor = valor !== undefined && valor !== null && valor !== '';
        const tipo = typeof valor;
        
        console.log(`   ${existe ? '✅' : '❌'} ${campo}:`);
        console.log(`      - Existe: ${existe}`);
        console.log(`      - Tem valor: ${temValor}`);
        console.log(`      - Tipo: ${tipo}`);
        console.log(`      - Valor: "${valor}"`);
        
        // Se for objeto, mostrar estrutura
        if (valor && typeof valor === 'object') {
          console.log(`      - Estrutura do objeto:`, valor);
        }
      });
    }
  } else {
    console.log('   - Tipo:', typeof dadosExtraidos);
    console.log('   - Valor:', dadosExtraidos);
  }
  
  console.log('🔍 ========================================================================');
}

/**
 * Função para testar mapeamento de campos
 */
export function testarMapeamentoCampos(dadoOriginal: any) {
  console.log('🔄 ==================== TESTE DE MAPEAMENTO DE CAMPOS ====================');
  
  // Mapeamento correto baseado nos nomes exatos do Excel
  const mapeamento = {
    // Dados básicos
    sku: dadoOriginal['SKU'],
    material: dadoOriginal['MATERIAL'],
    cor: dadoOriginal['COR'],
    nomeProduto: dadoOriginal['Nome do Produto'],
    package: dadoOriginal['PACKAGE'],
    preco: dadoOriginal['PREÇO'],
    unidade: dadoOriginal['UNIT'],
    pcsCtn: dadoOriginal['PCS/CTN'],
    caixas: dadoOriginal['CAIXAS'],
    
    // Pesos
    pesoUnitario: dadoOriginal['PESO UNITARIO(g)'],
    pesoEmbaladoMaster: dadoOriginal['Peso embalado cx Master (KG)'],
    pesoSemEmbalagemMaster: dadoOriginal['Peso Sem embalagem cx Master (KG)'],
    pesoTotalEmbalado: dadoOriginal['Peso total embalado cx Master (KG)'],
    pesoTotalSemEmbalagem: dadoOriginal['Peso total sem embalagem cx Master (KG)'],
    
    // Dimensões
    comprimento: dadoOriginal['Comprimento'],
    largura: dadoOriginal['Largura'],
    altura: dadoOriginal['Altura'],
    cbmCubagem: dadoOriginal['CBM Cubagem'],
    cbmTotal: dadoOriginal['CBM Total'],
    
    // Totais
    quantidadeTotal: dadoOriginal['Quantidade Total'],
    valorTotal: dadoOriginal['Valor Total'],
    
    // Outros
    observacoes: dadoOriginal['OBS'],
    changeDolar: dadoOriginal['CHANGE_DOLAR'],
    multiplicadorReais: dadoOriginal['MULTIPLICADOR_REAIS']
  };
  
  console.log('📋 Resultado do mapeamento:');
  Object.entries(mapeamento).forEach(([chave, valor]) => {
    const temValor = valor !== undefined && valor !== null && valor !== '';
    const tipo = typeof valor;
    console.log(`   ${temValor ? '✅' : '❌'} ${chave}:`);
    console.log(`      - Tipo: ${tipo}`);
    console.log(`      - Valor: "${valor}"`);
    
    // Se for objeto, mostrar estrutura
    if (valor && typeof valor === 'object') {
      console.log(`      - Estrutura:`, valor);
    }
  });
  
  console.log('🔄 ========================================================================');
  return mapeamento;
}

/**
 * Função para validar tipos de dados
 */
export function validarTiposDados(dadoMapeado: any) {
  console.log('🔢 ==================== VALIDAÇÃO DE TIPOS DE DADOS ====================');
  
  const validacoes = {
    sku: { valor: dadoMapeado.sku, tipoEsperado: 'string', obrigatorio: true },
    material: { valor: dadoMapeado.material, tipoEsperado: 'string', obrigatorio: true },
    cor: { valor: dadoMapeado.cor, tipoEsperado: 'string', obrigatorio: false },
    preco: { valor: dadoMapeado.preco, tipoEsperado: 'number', obrigatorio: true },
    pcsCtn: { valor: dadoMapeado.pcsCtn, tipoEsperado: 'number', obrigatorio: false },
    caixas: { valor: dadoMapeado.caixas, tipoEsperado: 'number', obrigatorio: false },
    pesoUnitario: { valor: dadoMapeado.pesoUnitario, tipoEsperado: 'number', obrigatorio: false },
    comprimento: { valor: dadoMapeado.comprimento, tipoEsperado: 'number', obrigatorio: false },
    largura: { valor: dadoMapeado.largura, tipoEsperado: 'number', obrigatorio: false },
    altura: { valor: dadoMapeado.altura, tipoEsperado: 'number', obrigatorio: false }
  };
  
  const erros: string[] = [];
  
  Object.entries(validacoes).forEach(([campo, config]) => {
    const { valor, tipoEsperado, obrigatorio } = config;
    const tipoAtual = typeof valor;
    const temValor = valor !== undefined && valor !== null && valor !== '';
    
    let status = '✅';
    let mensagem = `${campo}: ${tipoAtual} "${valor}"`;
    
    if (obrigatorio && !temValor) {
      status = '❌';
      mensagem += ' - ERRO: Campo obrigatório vazio';
      erros.push(`${campo} é obrigatório mas está vazio`);
    } else if (temValor && tipoAtual !== tipoEsperado) {
      // Tentar conversão automática
      let valorConvertido = valor;
      if (tipoEsperado === 'number' && tipoAtual === 'string') {
        valorConvertido = parseFloat(valor);
        if (!isNaN(valorConvertido)) {
          status = '🔄';
          mensagem += ` - CONVERTIDO para ${valorConvertido}`;
        } else {
          status = '❌';
          mensagem += ` - ERRO: Não é um número válido`;
          erros.push(`${campo} deveria ser ${tipoEsperado} mas é ${tipoAtual} e não pode ser convertido`);
        }
      }
    }
    
    console.log(`   ${status} ${mensagem}`);
  });
  
  if (erros.length > 0) {
    console.log('❌ Erros encontrados:');
    erros.forEach(erro => console.log(`   - ${erro}`));
  } else {
    console.log('✅ Todos os tipos estão corretos!');
  }
  
  console.log('🔢 ========================================================================');
  return erros;
}

/**
 * Função de diagnóstico completo do produto mapeado
 */
export function diagnosticarProdutoMapeado(produto: any, index: number) {
  console.log(`\n🔍 ==================== DIAGNÓSTICO PRODUTO #${index + 1} ====================`);
  console.log('📦 Produto completo:', JSON.stringify(produto, null, 2));
  
  const camposCriticos = [
    'sku', 'material', 'cor', 'package', 'preco', 'pcs_ctn', 'caixas',
    'peso_unitario', 'comprimento', 'largura', 'altura', 'cbm_cubagem'
  ];
  
  console.log('🔍 Campos críticos:');
  camposCriticos.forEach(campo => {
    const valor = produto[campo];
    const existe = campo in produto;
    const temValor = valor !== undefined && valor !== null && valor !== '';
    const tipo = typeof valor;
    
    console.log(`   ${temValor ? '✅' : '❌'} ${campo}:`);
    console.log(`      - Existe: ${existe}`);
    console.log(`      - Tipo: ${tipo}`);
    console.log(`      - Valor: "${valor}"`);
    
    // Se for objeto complexo, alertar
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      console.log(`      ⚠️ ATENÇÃO: Valor é um objeto complexo!`, valor);
    }
  });
  
  console.log('🔍 ========================================================================\n');
}
