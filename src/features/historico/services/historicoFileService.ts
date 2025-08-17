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
        id_unico: 'ID Único*',
        numero_pedido: 'Número do Pedido*',
        sku_produto: 'SKU do Produto*',
        descricao: 'Descrição*',
        quantidade: 'Quantidade*',
        valor_unitario: 'Valor Unitário*',
        valor_total: 'Valor Total*',
        cliente_nome: 'Nome do Cliente*',
        cliente_documento: 'Documento do Cliente',
        status: 'Status*',
        data_pedido: 'Data do Pedido*',
        observacoes: 'Observações',
        codigo_rastreamento: 'Código de Rastreamento',
        url_rastreamento: 'URL de Rastreamento',
        situacao: 'Situação',
        data_prevista: 'Data Prevista',
        numero_ecommerce: 'Número E-commerce',
        cpf_cnpj: 'CPF/CNPJ',
        ncm: 'NCM',
        codigo_barras: 'Código de Barras',
        valor_frete: 'Valor do Frete',
        valor_desconto: 'Valor do Desconto',
        cidade: 'Cidade',
        uf: 'UF',
        empresa: 'Empresa',
        numero_venda: 'Número da Venda',
        obs: 'Observações Externas',
        obs_interna: 'Observações Internas',
        sku_estoque: 'SKU Estoque',
        sku_kit: 'SKU Kit',
        qtd_kit: 'Quantidade Kit',
        total_itens: 'Total de Itens'
      }
    };
    return headers[locale as keyof typeof headers] || headers['pt-BR'];
  }

  private static getRequiredFields(config: TemplateConfig) {
    const base = [
      'id_unico', 'numero_pedido', 'sku_produto', 'descricao',
      'quantidade', 'valor_unitario', 'valor_total',
      'cliente_nome', 'status', 'data_pedido'
    ];

    const fiscal = [
      'cpf_cnpj', 'ncm', 'codigo_barras', 'valor_frete',
      'valor_desconto', 'cidade', 'uf'
    ];

    const tracking = [
      'codigo_rastreamento', 'url_rastreamento', 'situacao',
      'data_prevista', 'numero_ecommerce'
    ];

    let fields = [...base];
    if (config.includeFiscalFields) fields.push(...fiscal);
    if (config.includeTrackingFields) fields.push(...tracking);

    return fields;
  }

  private static generateExampleData(config: TemplateConfig) {
    return [
      {
        id_unico: 'VENDA-2024-001',
        numero_pedido: 'PED-001',
        sku_produto: 'PROD-123',
        descricao: 'Produto Exemplo',
        quantidade: 2,
        valor_unitario: 50.00,
        valor_total: 100.00,
        cliente_nome: 'João da Silva',
        cliente_documento: '123.456.789-00',
        status: 'concluida',
        data_pedido: '2024-01-15',
        observacoes: 'Venda exemplo',
        codigo_rastreamento: 'BR123456789BR',
        url_rastreamento: 'https://tracking.example.com/BR123456789BR',
        situacao: 'entregue',
        data_prevista: '2024-01-20',
        cpf_cnpj: '123.456.789-00',
        ncm: '84713012',
        codigo_barras: '7891234567890',
        valor_frete: 15.00,
        valor_desconto: 5.00,
        cidade: 'São Paulo',
        uf: 'SP',
        empresa: 'Loja Exemplo',
        sku_estoque: 'EST-123',
        sku_kit: 'KIT-001',
        qtd_kit: 1,
        total_itens: 2
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
      quantidade: 'integer',
      valor_unitario: 'decimal',
      valor_total: 'decimal',
      valor_frete: 'decimal',
      valor_desconto: 'decimal',
      qtd_kit: 'integer',
      total_itens: 'integer',
      data_pedido: 'date',
      data_prevista: 'date'
    };
    return typeMap[field] || 'string';
  }

  // Import validation with comprehensive error checking
  static async validateImportData(data: any[], preview = false): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    let processed = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel starts at 1 and we have header

      // Required field validation
      const requiredFields = ['id_unico', 'numero_pedido', 'sku_produto', 'descricao', 
                             'quantidade', 'valor_unitario', 'valor_total', 
                             'cliente_nome', 'status', 'data_pedido'];

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
        fields: ['numero_pedido', 'data_pedido', 'cpf_cnpj', 'cliente_nome', 'sku_produto', 
                'descricao', 'quantidade', 'valor_unitario', 'valor_total', 'ncm', 
                'codigo_barras', 'valor_frete', 'valor_desconto', 'cidade', 'uf'],
        groupBy: 'data_pedido',
        totals: ['valor_total', 'valor_frete', 'valor_desconto']
      },
      commercial: {
        name: 'Relatório Comercial',
        fields: ['numero_pedido', 'data_pedido', 'cliente_nome', 'sku_produto', 
                'descricao', 'quantidade', 'valor_unitario', 'valor_total', 'status'],
        groupBy: 'status',
        totals: ['quantidade', 'valor_total']
      },
      analytics: {
        name: 'Relatório Analytics',
        fields: ['data_pedido', 'sku_produto', 'descricao', 'quantidade', 'valor_total', 
                'cliente_nome', 'cidade', 'uf', 'status'],
        groupBy: 'sku_produto',
        totals: ['quantidade', 'valor_total'],
        analytics: true
      },
      audit: {
        name: 'Relatório de Auditoria',
        fields: ['id', 'id_unico', 'numero_pedido', 'data_pedido', 'cliente_nome', 
                'sku_produto', 'quantidade', 'valor_total', 'status', 'created_at', 'updated_at'],
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
      
      const { data: insertData, error } = await supabase
        .from('historico_vendas')
        .insert(data)
        .select('id, numero_pedido, sku_produto, status, data_pedido, valor_total');

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