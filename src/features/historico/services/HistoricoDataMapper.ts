// Mapeamento de dados entre os formatos antigo e novo das colunas
export class HistoricoDataMapper {
  
  // Mapear dados do banco para o formato das novas colunas
  static mapDatabaseToNewFormat(dbRecord: any): any {
    return {
      // === Básicas ===
      id_unico: dbRecord.id_unico,
      empresa: dbRecord.empresa,
      numero_pedido: dbRecord.numero_pedido,
      nome_cliente: dbRecord.cliente_nome || dbRecord.nome_cliente,
      nome_completo: dbRecord.nome_completo || dbRecord.cliente_nome,
      data_pedido: dbRecord.data_pedido,
      ultima_atualizacao: dbRecord.updated_at,

      // === Produtos ===
      sku_produto: dbRecord.sku_produto,
      quantidade: dbRecord.quantidade,
      quantidade_total: dbRecord.quantidade_total || dbRecord.quantidade,
      titulo_produto: dbRecord.titulo_produto || dbRecord.descricao,
      descricao: dbRecord.descricao,

      // === Financeiras ===
      valor_unitario: dbRecord.valor_unitario,
      valor_total: dbRecord.valor_total,
      valor_pago: dbRecord.valor_pago || dbRecord.valor_total,
      valor_frete: dbRecord.valor_frete,
      valor_desconto: dbRecord.valor_desconto,
      frete_pago_cliente: dbRecord.frete_pago_cliente || dbRecord.valor_frete,
      receita_flex_bonus: dbRecord.receita_flex_bonus,
      custo_envio_seller: dbRecord.custo_envio_seller,
      desconto_cupom: dbRecord.desconto_cupom || dbRecord.valor_desconto,
      taxa_marketplace: dbRecord.taxa_marketplace,
      valor_liquido_vendedor: dbRecord.valor_liquido_vendedor,
      metodo_pagamento: dbRecord.metodo_pagamento,
      status_pagamento: dbRecord.status_pagamento,
      tipo_pagamento: dbRecord.tipo_pagamento,

      // === Mapeamento ===
      status_mapeamento: dbRecord.status_mapeamento,
      sku_estoque: dbRecord.sku_estoque,
      sku_kit: dbRecord.sku_kit,
      quantidade_kit: dbRecord.qtd_kit || dbRecord.quantidade_kit,
      total_itens: dbRecord.total_itens,
      status_baixa: dbRecord.status_baixa || dbRecord.status,

      // === Envio ===
      status_envio: dbRecord.status_envio || dbRecord.situacao,
      logistic_mode: dbRecord.logistic_mode,
      tipo_logistico: dbRecord.tipo_logistico,
      tipo_metodo_envio: dbRecord.tipo_metodo_envio,
      tipo_entrega: dbRecord.tipo_entrega,
      substatus_estado_atual: dbRecord.substatus_estado_atual,
      modo_envio_combinado: dbRecord.modo_envio_combinado,
      metodo_envio_combinado: dbRecord.metodo_envio_combinado,

      // === Adicionais/Sistema ===
      id: dbRecord.id,
      cliente_documento: dbRecord.cliente_documento,
      status: dbRecord.status,
      observacoes: dbRecord.observacoes,
      codigo_rastreamento: dbRecord.codigo_rastreamento,
      url_rastreamento: dbRecord.url_rastreamento,
      situacao: dbRecord.situacao,
      data_prevista: dbRecord.data_prevista,
      numero_ecommerce: dbRecord.numero_ecommerce,
      cpf_cnpj: dbRecord.cpf_cnpj,
      ncm: dbRecord.ncm,
      codigo_barras: dbRecord.codigo_barras,
      cidade: dbRecord.cidade,
      uf: dbRecord.uf,
      numero_venda: dbRecord.numero_venda,
      obs: dbRecord.obs,
      obs_interna: dbRecord.obs_interna,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at
    };
  }

  // Mapear dados do formato novo para inserção no banco
  static mapNewFormatToDatabase(newRecord: any): any {
    return {
      id_unico: newRecord.id_unico,
      empresa: newRecord.empresa,
      numero_pedido: newRecord.numero_pedido,
      cliente_nome: newRecord.nome_cliente,
      sku_produto: newRecord.sku_produto,
      descricao: newRecord.descricao || newRecord.titulo_produto,
      quantidade: newRecord.quantidade,
      valor_unitario: newRecord.valor_unitario,
      valor_total: newRecord.valor_total,
      cliente_documento: newRecord.cliente_documento,
      status: newRecord.status,
      data_pedido: newRecord.data_pedido,
      observacoes: newRecord.observacoes,
      codigo_rastreamento: newRecord.codigo_rastreamento,
      url_rastreamento: newRecord.url_rastreamento,
      situacao: newRecord.situacao || newRecord.status_envio,
      data_prevista: newRecord.data_prevista,
      numero_ecommerce: newRecord.numero_ecommerce,
      cpf_cnpj: newRecord.cpf_cnpj,
      ncm: newRecord.ncm,
      codigo_barras: newRecord.codigo_barras,
      valor_frete: newRecord.valor_frete || newRecord.frete_pago_cliente,
      valor_desconto: newRecord.valor_desconto || newRecord.desconto_cupom,
      cidade: newRecord.cidade,
      uf: newRecord.uf,
      numero_venda: newRecord.numero_venda,
      obs: newRecord.obs,
      obs_interna: newRecord.obs_interna,
      sku_estoque: newRecord.sku_estoque,
      sku_kit: newRecord.sku_kit,
      qtd_kit: newRecord.quantidade_kit,
      total_itens: newRecord.total_itens
    };
  }

  // Validar e corrigir inconsistências de dados
  static validateAndCleanData(record: any): any {
    const cleaned = { ...record };

    // Garantir que campos numéricos sejam números
    const numericFields = [
      'quantidade', 'quantidade_total', 'quantidade_kit', 'total_itens',
      'valor_unitario', 'valor_total', 'valor_pago', 'valor_frete', 'valor_desconto',
      'frete_pago_cliente', 'receita_flex_bonus', 'custo_envio_seller',
      'desconto_cupom', 'taxa_marketplace', 'valor_liquido_vendedor'
    ];

    numericFields.forEach(field => {
      if (cleaned[field] !== undefined && cleaned[field] !== null) {
        const value = parseFloat(cleaned[field]);
        cleaned[field] = isNaN(value) ? 0 : value;
      }
    });

    // Garantir que datas estejam no formato correto
    const dateFields = ['data_pedido', 'data_prevista'];
    dateFields.forEach(field => {
      if (cleaned[field] && typeof cleaned[field] === 'string') {
        // Tentar converter para YYYY-MM-DD
        const date = new Date(cleaned[field]);
        if (!isNaN(date.getTime())) {
          cleaned[field] = date.toISOString().split('T')[0];
        }
      }
    });

    // Garantir que campos obrigatórios tenham valores padrão
    if (!cleaned.status) cleaned.status = 'pendente';
    if (!cleaned.quantidade) cleaned.quantidade = 1;
    if (!cleaned.valor_total && cleaned.valor_unitario && cleaned.quantidade) {
      cleaned.valor_total = cleaned.valor_unitario * cleaned.quantidade;
    }

    return cleaned;
  }

  // Mapear colunas do seletor para campos de banco
  static mapColumnKeyToDbField(columnKey: string): string {
    const mapping: Record<string, string> = {
      'nome_cliente': 'cliente_nome',
      'quantidade_kit': 'qtd_kit',
      'status_baixa': 'status',
      'frete_pago_cliente': 'valor_frete',
      'desconto_cupom': 'valor_desconto',
      'ultima_atualizacao': 'updated_at'
    };

    return mapping[columnKey] || columnKey;
  }

  // Obter todos os campos disponíveis organizados por categoria
  static getAllAvailableFields() {
    return {
      basicas: [
        'id_unico', 'empresa', 'numero_pedido', 'nome_cliente', 
        'nome_completo', 'data_pedido', 'ultima_atualizacao'
      ],
      produtos: [
        'sku_produto', 'quantidade', 'quantidade_total', 'titulo_produto', 'descricao'
      ],
      financeiras: [
        'valor_unitario', 'valor_total', 'valor_pago', 'valor_frete', 'valor_desconto',
        'frete_pago_cliente', 'receita_flex_bonus', 'custo_envio_seller', 'desconto_cupom',
        'taxa_marketplace', 'valor_liquido_vendedor', 'metodo_pagamento', 
        'status_pagamento', 'tipo_pagamento'
      ],
      mapeamento: [
        'status_mapeamento', 'sku_estoque', 'sku_kit', 'quantidade_kit', 
        'total_itens', 'status_baixa'
      ],
      envio: [
        'status_envio', 'logistic_mode', 'tipo_logistico', 'tipo_metodo_envio',
        'tipo_entrega', 'substatus_estado_atual', 'modo_envio_combinado', 
        'metodo_envio_combinado'
      ],
      sistema: [
        'id', 'cliente_documento', 'status', 'observacoes', 'codigo_rastreamento',
        'url_rastreamento', 'situacao', 'data_prevista', 'numero_ecommerce',
        'cpf_cnpj', 'ncm', 'codigo_barras', 'cidade', 'uf', 'numero_venda',
        'obs', 'obs_interna', 'created_at', 'updated_at'
      ]
    };
  }
}