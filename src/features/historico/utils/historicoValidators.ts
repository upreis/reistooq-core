// Validadores para o sistema de histórico
import { z } from 'zod';
import { HISTORICO_CONSTANTS } from './historicoConstants';

// Schema base para validação de filtros
export const HistoricoFiltersSchema = z.object({
  search: z.string().max(HISTORICO_CONSTANTS.VALIDATION.MAX_SEARCH_LENGTH).optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.array(z.string()).optional(),
  valorMin: z.number().min(0).optional(),
  valorMax: z.number().min(0).optional(),
  cidades: z.array(z.string()).optional(),
  uf: z.array(z.string().length(2)).optional(),
  situacao: z.array(z.string()).optional(),
  cliente: z.string().optional(),
  sku: z.string().optional(),
  integrationAccount: z.string().uuid().optional()
});

// Schema para validação de paginação
export const HistoricoPaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(HISTORICO_CONSTANTS.PAGINATION.MIN_PAGE_SIZE)
    .max(HISTORICO_CONSTANTS.PAGINATION.MAX_PAGE_SIZE),
  sortBy: z.enum(['data_pedido', 'valor_total', 'quantidade', 'cliente_nome', 'status', 'created_at']),
  sortOrder: z.enum(['asc', 'desc'])
});

// Schema para validação de exportação
export const HistoricoExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf', 'json']),
  includeHeaders: z.boolean(),
  includeFilters: z.boolean(),
  includeMetadata: z.boolean(),
  maxRecords: z.number().min(1).max(HISTORICO_CONSTANTS.EXPORT.MAX_RECORDS_BACKGROUND),
  compression: z.enum(['none', 'zip', 'gzip']).optional(),
  password: z.string().min(8).optional(),
  backgroundProcessing: z.boolean(),
  customFilename: z.string().max(100).optional()
});

export class HistoricoValidators {
  // Validação de filtros
  static validateFilters(filters: any) {
    try {
      const validated = HistoricoFiltersSchema.parse(filters);
      
      // Validações customizadas
      if (validated.dataInicio && validated.dataFim) {
        const inicio = new Date(validated.dataInicio);
        const fim = new Date(validated.dataFim);
        
        if (inicio > fim) {
          throw new Error('Data inicial deve ser anterior à data final');
        }
        
        // Limite de período (ex: máximo 1 ano)
        const diffMs = fim.getTime() - inicio.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
          throw new Error('Período máximo permitido é de 1 ano');
        }
      }
      
      if (validated.valorMin !== undefined && validated.valorMax !== undefined) {
        if (validated.valorMin > validated.valorMax) {
          throw new Error('Valor mínimo deve ser menor que o valor máximo');
        }
      }
      
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          data: null,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'general', message: error.message }]
      };
    }
  }

  // Validação de paginação
  static validatePagination(pagination: any) {
    try {
      const validated = HistoricoPaginationSchema.parse(pagination);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          data: null,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'general', message: error.message }]
      };
    }
  }

  // Validação de exportação
  static validateExport(options: any) {
    try {
      const validated = HistoricoExportSchema.parse(options);
      
      // Validações customizadas
      if (validated.format === 'pdf' && validated.maxRecords > 50000) {
        throw new Error('Exportação PDF limitada a 50.000 registros');
      }
      
      if (validated.backgroundProcessing === false && 
          validated.maxRecords > HISTORICO_CONSTANTS.EXPORT.MAX_RECORDS_IMMEDIATE) {
        throw new Error(`Exportação imediata limitada a ${HISTORICO_CONSTANTS.EXPORT.MAX_RECORDS_IMMEDIATE.toLocaleString()} registros`);
      }
      
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          data: null,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'general', message: error.message }]
      };
    }
  }

  // Validação de preset de filtros
  static validateFilterPreset(preset: any) {
    const schema = z.object({
      name: z.string().min(1).max(50),
      description: z.string().max(200).optional(),
      filters: z.any(), // TODO: validar estrutura de filtros
      global: z.boolean()
    });
    
    try {
      const validated = schema.parse(preset);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          data: null,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'general', message: error.message }]
      };
    }
  }

  // Validação de busca
  static validateSearch(search: string) {
    if (!search || search.trim().length === 0) {
      return { isValid: true, data: '', errors: [] };
    }
    
    const trimmed = search.trim();
    
    if (trimmed.length < HISTORICO_CONSTANTS.VALIDATION.MIN_SEARCH_LENGTH) {
      return {
        isValid: false,
        data: null,
        errors: [{
          field: 'search',
          message: `Busca deve ter pelo menos ${HISTORICO_CONSTANTS.VALIDATION.MIN_SEARCH_LENGTH} caracteres`
        }]
      };
    }
    
    if (trimmed.length > HISTORICO_CONSTANTS.VALIDATION.MAX_SEARCH_LENGTH) {
      return {
        isValid: false,
        data: null,
        errors: [{
          field: 'search',
          message: `Busca deve ter no máximo ${HISTORICO_CONSTANTS.VALIDATION.MAX_SEARCH_LENGTH} caracteres`
        }]
      };
    }
    
    // Verificar caracteres perigosos para SQL injection (básico)
    const dangerousChars = /[;<>'"\\]/;
    if (dangerousChars.test(trimmed)) {
      return {
        isValid: false,
        data: null,
        errors: [{
          field: 'search',
          message: 'Busca contém caracteres não permitidos'
        }]
      };
    }
    
    return { isValid: true, data: trimmed, errors: [] };
  }

  // Validação de IDs para bulk operations
  static validateBulkIds(ids: any) {
    if (!Array.isArray(ids)) {
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'ids', message: 'IDs devem ser um array' }]
      };
    }
    
    if (ids.length === 0) {
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'ids', message: 'Selecione pelo menos um item' }]
      };
    }
    
    if (ids.length > 1000) {
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'ids', message: 'Máximo de 1000 itens por operação' }]
      };
    }
    
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = ids.filter(id => typeof id !== 'string' || !uuidRegex.test(id));
    
    if (invalidIds.length > 0) {
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'ids', message: `IDs inválidos: ${invalidIds.slice(0, 5).join(', ')}` }]
      };
    }
    
    return { isValid: true, data: ids, errors: [] };
  }

  // Validação de configuração de coluna
  static validateColumnConfig(config: any) {
    const schema = z.object({
      id: z.string(),
      header: z.string(),
      accessorKey: z.string(),
      sortable: z.boolean(),
      filterable: z.boolean(),
      visible: z.boolean(),
      width: z.number().min(50).max(500).optional(),
      align: z.enum(['left', 'center', 'right']).optional(),
      sticky: z.enum(['left', 'right']).optional()
    });
    
    try {
      const validated = schema.parse(config);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          data: null,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'general', message: error.message }]
      };
    }
  }

  // Validação de período para analytics
  static validateAnalyticsPeriod(start: string, end: string) {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Datas inválidas');
      }
      
      if (startDate > endDate) {
        throw new Error('Data inicial deve ser anterior à data final');
      }
      
      const now = new Date();
      if (startDate > now) {
        throw new Error('Data inicial não pode ser futura');
      }
      
      // Limite para analytics (ex: máximo 2 anos)
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > 730) {
        throw new Error('Período máximo para analytics é de 2 anos');
      }
      
      return { isValid: true, data: { start: startDate, end: endDate }, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'period', message: error.message }]
      };
    }
  }

  // Validação de configuração de chart
  static validateChartConfig(config: any) {
    const schema = z.object({
      type: z.enum(['line', 'bar', 'pie', 'area', 'scatter']),
      title: z.string().max(100),
      xAxis: z.string(),
      yAxis: z.string(),
      groupBy: z.string().optional(),
      aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
      colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).optional(),
      height: z.number().min(200).max(800).optional()
    });
    
    try {
      const validated = schema.parse(config);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          data: null,
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'general', message: error.message }]
      };
    }
  }
}