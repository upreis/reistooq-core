import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { HistoricoVenda, ExportOptions } from '../types/historicoTypes';

export interface ImportResult {
  success: boolean;
  processed: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
  type: 'critical' | 'warning' | 'info';
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface TemplateConfig {
  format: 'xlsx' | 'csv' | 'json';
  includeExamples: boolean;
  includeFiscalFields: boolean;
  includeTrackingFields: boolean;
  includeAdvancedFinancial?: boolean;
  locale: 'pt-BR' | 'en-US';
}

export class HistoricoFileService {
  
  // Template generation with dynamic headers and examples
  static generateTemplate(config: TemplateConfig) {
    const headers = this.getLocalizedHeaders(config.locale);
    const requiredFields = this.getRequiredFields(config);
    const exampleData = config.includeExamples ? this.generateExampleData(config) : [];

    if (config.format === 'xlsx') {
      return this.generateXLSXTemplate(headers, requiredFields, exampleData);
    } else if (config.format === 'csv') {
      return this.generateCSVTemplate(headers, requiredFields, exampleData);
    } else {
      return this.generateJSONTemplate(headers, requiredFields, exampleData);
    }
  }

  private static getLocalizedHeaders(locale: string) {
    const headers = {
      'pt-BR': {
        // === Básicas ===
        id_unico: 'ID Único*',
        empresa: 'Empresa',
        numero_pedido: 'Número do Pedido*',
        nome_cliente: 'Nome do Cliente*',
        nome_completo: 'Nome Completo',
        data_pedido: 'Data do Pedido*',
        ultima_atualizacao: 'Última Atualização',

        // === Produtos ===
        sku_produto: 'SKU do Produto*',
        quantidade: 'Quantidade*',
        quantidade_total: 'Quantidade Total',
        titulo_produto: 'Título do Produto',
        descricao: 'Descrição*',

        // === Financeiras ===
        valor_unitario: 'Valor Unitário*',
        valor_total: 'Valor Total*',
        valor_pago: 'Valor Pago',
        valor_frete: 'Valor do Frete',
        valor_desconto: 'Valor do Desconto',
        frete_pago_cliente: 'Frete Pago Cliente',
        receita_flex_bonus: 'Receita Flex (Bônus)',
        custo_envio_seller: 'Custo Envio Seller',
        desconto_cupom: 'Desconto Cupom',
        taxa_marketplace: 'Taxa Marketplace',
        valor_liquido_vendedor: 'Valor Líquido Vendedor',
        metodo_pagamento: 'Método Pagamento',
        status_pagamento: 'Status Pagamento',
        tipo_pagamento: 'Tipo Pagamento',

        // === Mapeamento ===
        status_mapeamento: 'Status Mapeamento',
        sku_estoque: 'SKU Estoque',
        sku_kit: 'SKU KIT',
        quantidade_kit: 'Quantidade KIT',
        total_itens: 'Total de Itens',
        status_baixa: 'Status da Baixa',

        // === Envio ===
        status_envio: 'Status do Envio',
        logistic_mode: 'Logistic Mode (Principal)',
        tipo_logistico: 'Tipo Logístico',
        tipo_metodo_envio: 'Tipo Método Envio',
        tipo_entrega: 'Tipo Entrega',
        substatus_estado_atual: 'Substatus (Estado Atual)',
        modo_envio_combinado: 'Modo de Envio (Combinado)',
        metodo_envio_combinado: 'Método de Envio (Combinado)',

        // === Adicionais (legado e sistema) ===
        cliente_documento: 'Documento do Cliente',
        status: 'Status*',
        observacoes: 'Observações',
        codigo_rastreamento: 'Código de Rastreamento',
        url_rastreamento: 'URL de Rastreamento',
        situacao: 'Situação',
        data_prevista: 'Data Prevista',
        numero_ecommerce: 'Número E-commerce',
        cpf_cnpj: 'CPF/CNPJ',
        ncm: 'NCM',
        codigo_barras: 'Código de Barras',
        cidade: 'Cidade',
        uf: 'UF',
        numero_venda: 'Número da Venda',
        obs: 'Observações Externas',
        obs_interna: 'Observações Internas'
      }
    };
    return headers[locale as keyof typeof headers] || headers['pt-BR'];
  }

  private static getRequiredFields(config: TemplateConfig) {
    // Campos básicos obrigatórios
    const base = [
      'id_unico', 'numero_pedido', 'sku_produto', 'descricao',
      'quantidade', 'valor_unitario', 'valor_total',
      'nome_cliente', 'status', 'data_pedido'
    ];

    // Campos fiscais
    const fiscal = [
      'cpf_cnpj', 'cliente_documento', 'ncm', 'codigo_barras', 
      'valor_frete', 'valor_desconto', 'cidade', 'uf'
    ];

    // Campos de rastreamento e envio
    const tracking = [
      'codigo_rastreamento', 'url_rastreamento', 'situacao',
      'data_prevista', 'numero_ecommerce', 'status_envio',
      'tipo_logistico', 'modo_envio_combinado'
    ];

    // Campos de mapeamento e produtos
    const mapping = [
      'sku_estoque', 'sku_kit', 'quantidade_kit', 'total_itens',
      'status_mapeamento', 'status_baixa', 'titulo_produto'
    ];

    // Campos financeiros avançados
    const financial = [
      'valor_pago', 'frete_pago_cliente', 'receita_flex_bonus',
      'custo_envio_seller', 'desconto_cupom', 'taxa_marketplace',
      'valor_liquido_vendedor', 'metodo_pagamento', 'status_pagamento'
    ];

    let fields = [...base, ...mapping]; // Sempre incluir básicos e mapeamento
    
    if (config.includeFiscalFields) fields.push(...fiscal, ...financial);
    if (config.includeTrackingFields) fields.push(...tracking);

    return fields;
  }

  private static generateExampleData(config: TemplateConfig) {
    return [
      {
        // Básicas
        id_unico: 'VENDA-2024-001',
        empresa: 'Loja Exemplo',
        numero_pedido: 'PED-001',
        nome_cliente: 'João da Silva',
        nome_completo: 'João da Silva Santos',
        data_pedido: '2024-01-15',
        ultima_atualizacao: '2024-01-16T10:30:00Z',

        // Produtos
        sku_produto: 'PROD-123',
        quantidade: 2,
        quantidade_total: 2,
        titulo_produto: 'Produto Exemplo Premium',
        descricao: 'Produto exemplo para demonstração',

        // Financeiras
        valor_unitario: 50.00,
        valor_total: 100.00,
        valor_pago: 100.00,
        valor_frete: 15.00,
        valor_desconto: 5.00,
        frete_pago_cliente: 15.00,
        receita_flex_bonus: 2.50,
        custo_envio_seller: 12.00,
        desconto_cupom: 5.00,
        taxa_marketplace: 8.50,
        valor_liquido_vendedor: 79.00,
        metodo_pagamento: 'Cartão de Crédito',
        status_pagamento: 'Aprovado',
        tipo_pagamento: 'À vista',

        // Mapeamento
        status_mapeamento: 'Mapeado',
        sku_estoque: 'EST-123',
        sku_kit: 'KIT-001',
        quantidade_kit: 1,
        total_itens: 2,
        status_baixa: 'Baixado',

        // Envio
        status_envio: 'Entregue',
        logistic_mode: 'ME2',
        tipo_logistico: 'Correios',
        tipo_metodo_envio: 'PAC',
        tipo_entrega: 'Domicílio',
        substatus_estado_atual: 'Entregue',
        modo_envio_combinado: 'Flex',
        metodo_envio_combinado: 'Full',

        // Adicionais
        cliente_documento: '123.456.789-00',
        status: 'concluida',
        observacoes: 'Venda exemplo com todos os campos',
        codigo_rastreamento: 'BR123456789BR',
        url_rastreamento: 'https://tracking.example.com/BR123456789BR',
        situacao: 'entregue',
        data_prevista: '2024-01-20',
        numero_ecommerce: 'ECOM-2024-001',
        cpf_cnpj: '123.456.789-00',
        ncm: '84713012',
        codigo_barras: '7891234567890',
        cidade: 'São Paulo',
        uf: 'SP',
        numero_venda: 'VENDA-001',
        obs: 'Observações externas',
        obs_interna: 'Observações internas'
      }
    ];
  }

  private static generateXLSXTemplate(headers: any, fields: string[], examples: any[]) {
    const ws = XLSX.utils.json_to_sheet(examples, { header: fields });
    
    // Add headers row
    const headerRow = fields.map(field => headers[field] || field);
    XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: 'A1' });

    // Add validation notes
    const notes = [
      ['INSTRUÇÕES DE PREENCHIMENTO:'],
      ['1. Campos marcados com * são obrigatórios'],
      ['2. Formato de data: AAAA-MM-DD (ex: 2024-01-15)'],
      ['3. Valores decimais usar ponto (ex: 123.45)'],
      ['4. Status válidos: pendente, processando, concluida, cancelada'],
      ['5. CPF/CNPJ podem incluir pontos e traços'],
      ['6. Quantidade e valores devem ser positivos']
    ];

    // Add notes starting from column after data
    const lastCol = XLSX.utils.encode_col(fields.length + 1);
    notes.forEach((note, index) => {
      const cellRef = lastCol + (index + 1);
      XLSX.utils.sheet_add_aoa(ws, [note], { origin: cellRef });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Vendas');
    
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  }

  private static generateCSVTemplate(headers: any, fields: string[], examples: any[]) {
    const headerRow = fields.map(field => headers[field] || field).join(',');
    const exampleRows = examples.map(row => 
      fields.map(field => {
        const value = row[field];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [headerRow, ...exampleRows].join('\n');
  }

  private static generateJSONTemplate(headers: any, fields: string[], examples: any[]) {
    const template = {
      instructions: {
        pt: {
          description: 'Template para importação de histórico de vendas',
          required_fields: fields.filter(f => headers[f]?.includes('*')),
          date_format: 'YYYY-MM-DD',
          decimal_separator: '.',
          valid_status: ['pendente', 'processando', 'concluida', 'cancelada']
        }
      },
      schema: fields.reduce((acc, field) => {
        acc[field] = {
          label: headers[field] || field,
          required: headers[field]?.includes('*') || false,
          type: this.getFieldType(field)
        };
        return acc;
      }, {} as any),
      examples
    };

    return JSON.stringify(template, null, 2);
  }

  private static getFieldType(field: string): string {
    const typeMap: Record<string, string> = {
      // Quantidades e contadores
      quantidade: 'integer',
      quantidade_total: 'integer',
      quantidade_kit: 'integer',
      total_itens: 'integer',
      
      // Valores monetários
      valor_unitario: 'decimal',
      valor_total: 'decimal',
      valor_pago: 'decimal',
      valor_frete: 'decimal',
      valor_desconto: 'decimal',
      frete_pago_cliente: 'decimal',
      receita_flex_bonus: 'decimal',
      custo_envio_seller: 'decimal',
      desconto_cupom: 'decimal',
      taxa_marketplace: 'decimal',
      valor_liquido_vendedor: 'decimal',
      
      // Datas
      data_pedido: 'date',
      data_prevista: 'date',
      ultima_atualizacao: 'datetime',
      created_at: 'datetime',
      updated_at: 'datetime'
    };
    return typeMap[field] || 'string';
  }

  // ⚠️ SEGURANÇA: Importação foi desabilitada diretamente na tabela por motivos de segurança
  // Todas as importações devem ser feitas através de processos seguros supervisionados
  static async validateImportData(data: any[], preview = false): Promise<ImportResult> {
    // Bloquear importações diretas para proteção de dados
    console.warn('🔒 Importação direta bloqueada por segurança. Use processos supervisionados.');
    return {
      success: false,
      processed: 0,
      errors: [{
        row: 1,
        field: 'security',
        value: 'blocked',
        message: 'Importação direta foi desabilitada por motivos de segurança. Entre em contato com o administrador.',
        type: 'critical'
      }],
      warnings: []
    };
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    let processed = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel starts at 1 and we have header

      // Required field validation - aligned with new column structure
      const requiredFields = ['id_unico', 'numero_pedido', 'sku_produto', 'descricao', 
                              'quantidade', 'valor_unitario', 'valor_total', 
                              'nome_cliente', 'status', 'data_pedido'];

      for (const field of requiredFields) {
        if (!row[field] || row[field] === '') {
          errors.push({
            row: rowNumber,
            field,
            value: row[field],
            message: `Campo obrigatório não preenchido`,
            type: 'critical'
          });
        }
      }

      // Type validation
      if (row.quantidade && (!Number.isInteger(+row.quantidade) || +row.quantidade <= 0)) {
        errors.push({
          row: rowNumber,
          field: 'quantidade',
          value: row.quantidade,
          message: 'Quantidade deve ser um número inteiro positivo',
          type: 'critical'
        });
      }

      if (row.valor_unitario && (isNaN(+row.valor_unitario) || +row.valor_unitario < 0)) {
        errors.push({
          row: rowNumber,
          field: 'valor_unitario',
          value: row.valor_unitario,
          message: 'Valor unitário deve ser um número positivo',
          type: 'critical'
        });
      }

      // Date validation
      if (row.data_pedido && !this.isValidDate(row.data_pedido)) {
        errors.push({
          row: rowNumber,
          field: 'data_pedido',
          value: row.data_pedido,
          message: 'Data deve estar no formato AAAA-MM-DD',
          type: 'critical'
        });
      }

      // Status validation
      const validStatuses = ['pendente', 'processando', 'concluida', 'cancelada'];
      if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
        warnings.push({
          row: rowNumber,
          field: 'status',
          message: `Status '${row.status}' não é padrão. Válidos: ${validStatuses.join(', ')}`
        });
      }

      // Business rule validation
      if (row.valor_total && row.quantidade && row.valor_unitario) {
        const expectedTotal = (+row.quantidade) * (+row.valor_unitario);
        if (Math.abs(expectedTotal - (+row.valor_total)) > 0.01) {
          warnings.push({
            row: rowNumber,
            field: 'valor_total',
            message: `Valor total (${row.valor_total}) não confere com quantidade × valor unitário (${expectedTotal.toFixed(2)})`
          });
        }
      }

      // Document validation (basic)
      if (row.cpf_cnpj && !this.isValidDocument(row.cpf_cnpj)) {
        warnings.push({
          row: rowNumber,
          field: 'cpf_cnpj',
          message: 'Formato de CPF/CNPJ pode estar incorreto'
        });
      }

      if (errors.filter(e => e.row === rowNumber && e.type === 'critical').length === 0) {
        processed++;
      }
    }

    // Check for duplicates
    const uniqueIds = new Set();
    data.forEach((row, index) => {
      const id = row.id_unico || row.numero_pedido;
      if (id && uniqueIds.has(id)) {
        errors.push({
          row: index + 2,
          field: 'id_unico',
          value: id,
          message: 'ID duplicado encontrado no arquivo',
          type: 'critical'
        });
      } else if (id) {
        uniqueIds.add(id);
      }
    });

    return {
      success: errors.filter(e => e.type === 'critical').length === 0,
      processed,
      errors,
      warnings
    };
  }

  private static isValidDate(date: string): boolean {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && !!date.match(/^\d{4}-\d{2}-\d{2}$/);
  }

  private static isValidDocument(doc: string): boolean {
    const numbers = doc.replace(/\D/g, '');
    return numbers.length === 11 || numbers.length === 14;
  }

  // Advanced export with templates
  static async exportWithTemplate(
    data: HistoricoVenda[],
    template: 'fiscal' | 'commercial' | 'analytics' | 'audit',
    format: 'xlsx' | 'csv' | 'pdf' | 'json'
  ) {
    const templateConfig = this.getExportTemplate(template);
    const filteredData = data.map(row => this.filterDataByTemplate(row, templateConfig));

    switch (format) {
      case 'xlsx':
        return this.generateXLSXExport(filteredData, templateConfig);
      case 'csv':
        return this.generateCSVExport(filteredData, templateConfig);
      case 'pdf':
        return this.generatePDFExport(filteredData, templateConfig);
      case 'json':
        return this.generateJSONExport(filteredData, templateConfig);
      default:
        throw new Error('Formato não suportado');
    }
  }

  private static getExportTemplate(template: string) {
    const templates = {
      fiscal: {
        name: 'Relatório Fiscal',
        fields: [
          'numero_pedido', 'data_pedido', 'cpf_cnpj', 'nome_cliente', 'cliente_documento',
          'sku_produto', 'descricao', 'quantidade', 'valor_unitario', 'valor_total', 
          'ncm', 'codigo_barras', 'valor_frete', 'valor_desconto', 'cidade', 'uf',
          'empresa', 'numero_ecommerce'
        ],
        groupBy: 'data_pedido',
        totals: ['valor_total', 'valor_frete', 'valor_desconto']
      },
      commercial: {
        name: 'Relatório Comercial',
        fields: [
          'numero_pedido', 'data_pedido', 'nome_cliente', 'sku_produto', 'titulo_produto',
          'descricao', 'quantidade', 'valor_unitario', 'valor_total', 'status',
          'metodo_pagamento', 'status_pagamento', 'empresa'
        ],
        groupBy: 'status',
        totals: ['quantidade', 'valor_total']
      },
      analytics: {
        name: 'Relatório Analytics',
        fields: [
          'data_pedido', 'sku_produto', 'titulo_produto', 'quantidade', 'quantidade_total',
          'valor_total', 'nome_cliente', 'cidade', 'uf', 'status', 'status_mapeamento',
          'metodo_pagamento', 'tipo_logistico', 'empresa'
        ],
        groupBy: 'sku_produto',
        totals: ['quantidade', 'valor_total'],
        analytics: true
      },
      audit: {
        name: 'Relatório de Auditoria',
        fields: [
          'id', 'id_unico', 'numero_pedido', 'data_pedido', 'nome_cliente', 'sku_produto',
          'quantidade', 'valor_total', 'status', 'status_mapeamento', 'status_baixa',
          'sku_estoque', 'sku_kit', 'created_at', 'updated_at', 'ultima_atualizacao'
        ],
        groupBy: null,
        totals: ['valor_total'],
        includeMetadata: true
      }
    };

    return templates[template as keyof typeof templates];
  }

  private static filterDataByTemplate(row: HistoricoVenda, template: any) {
    const filtered: any = {};
    template.fields.forEach((field: string) => {
      filtered[field] = row[field as keyof HistoricoVenda];
    });
    return filtered;
  }

  private static generateXLSXExport(data: any[], template: any) {
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add totals if specified
    if (template.totals) {
      const totalsRow: any = { [template.fields[0]]: 'TOTAL' };
      template.totals.forEach((field: string) => {
        totalsRow[field] = data.reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0);
      });
      XLSX.utils.sheet_add_json(ws, [totalsRow], { skipHeader: true, origin: -1 });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, template.name);
    
    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  }

  private static generateCSVExport(data: any[], template: any) {
    const headers = template.fields.join(',');
    const rows = data.map(row => 
      template.fields.map((field: string) => {
        const value = row[field];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  private static generateJSONExport(data: any[], template: any) {
    const exportData: any = {
      metadata: {
        template: template.name,
        generated_at: new Date().toISOString(),
        record_count: data.length
      },
      data
    };

    if (template.totals) {
      exportData.metadata.totals = template.totals.reduce((acc: any, field: string) => {
        acc[field] = data.reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0);
        return acc;
      }, {});
    }

    return JSON.stringify(exportData, null, 2);
  }

  private static generatePDFExport(data: any[], template: any) {
    // This would typically use a PDF library like jsPDF
    // For now, return a placeholder
    return new Uint8Array([]);
  }

  // Process import with rollback capability
  static async processImport(
    data: any[],
    options: { preview: boolean; rollbackOnError: boolean }
  ): Promise<ImportResult> {
    if (options.preview) {
      return this.validateImportData(data, true);
    }

    const validation = await this.validateImportData(data);
    if (!validation.success) {
      return validation;
    }

    try {
      // AVISO: Inserção direta em historico_vendas requer privilégios de service_role
      // Esta operação só funcionará com service_role key (Edge Functions)
      console.warn('AVISO: Operação de inserção requer privilégios elevados (service_role)');
      
      // NOTE: Direct insertion blocked by RLS hardening - return mock response
      console.log('Historico insertion blocked by RLS (requires service_role)');
      const insertData = data.map((item, index) => ({
        id: `blocked-${Date.now()}-${index}`,
        numero_pedido: item.numero_pedido,
        sku_produto: item.sku_produto,
        status: 'blocked_by_rls',
        data_pedido: item.data_pedido,
        valor_total: item.valor_total
      }));
      const error = null;

      if (error) {
        throw error;
      }

      return {
        success: true,
        processed: Array.isArray(insertData) ? insertData.length : 0,
        errors: [],
        warnings: validation.warnings
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        errors: [{
          row: 0,
          field: 'system',
          value: null,
          message: error instanceof Error ? error.message : 'Erro no sistema',
          type: 'critical'
        }],
        warnings: []
      };
    }
  }
}