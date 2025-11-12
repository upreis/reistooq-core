/**
 * 📊 JSONB FIELDS REPORT
 * Relatório visual de campos JSONB populados vs vazios
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface JsonbFieldsReportProps {
  data: any;
}

interface FieldStatus {
  field: string;
  status: 'populated' | 'empty' | 'partial';
  value: any;
  type: string;
}

export function JsonbFieldsReport({ data }: JsonbFieldsReportProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['dados_order']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const analyzeField = (value: any): FieldStatus['status'] => {
    if (value === null || value === undefined) return 'empty';
    if (typeof value === 'string' && value.trim() === '') return 'empty';
    if (Array.isArray(value) && value.length === 0) return 'empty';
    if (typeof value === 'object' && Object.keys(value).length === 0) return 'empty';
    
    // Check if object has some null values
    if (typeof value === 'object' && !Array.isArray(value)) {
      const values = Object.values(value);
      const nonNullCount = values.filter(v => v !== null && v !== undefined).length;
      if (nonNullCount === 0) return 'empty';
      if (nonNullCount < values.length) return 'partial';
    }
    
    return 'populated';
  };

  const getFieldType = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return `array[${value.length}]`;
    return typeof value;
  };

  const getStatusIcon = (status: FieldStatus['status']) => {
    switch (status) {
      case 'populated':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'empty':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: FieldStatus['status']) => {
    const variants = {
      populated: 'default',
      partial: 'outline',
      empty: 'destructive',
    } as const;

    const labels = {
      populated: 'Completo',
      partial: 'Parcial',
      empty: 'Vazio',
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  // Categorizar campos JSONB
  const jsonbSections = {
    'Dados do Pedido': 'dados_order',
    'Dados do Claim': 'dados_claim',
    'Dados de Mensagens': 'dados_mensagens',
    'Dados de Return': 'dados_return',
    'Dados de Review': 'dados_review',
    'Dados de Tracking': 'dados_tracking_info',
    'Dados do Comprador': 'dados_buyer_info',
    'Dados do Produto': 'dados_product_info',
    'Dados Financeiros': 'dados_financial_info',
    'Dados de Quantidades': 'dados_quantities',
  };

  const analyzeSection = (sectionData: any): FieldStatus[] => {
    if (!sectionData) return [];
    
    const fields: FieldStatus[] = [];
    
    const traverse = (obj: any, prefix = '') => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.keys(obj).forEach(key => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        const status = analyzeField(value);
        
        fields.push({
          field: fullKey,
          status,
          value,
          type: getFieldType(value),
        });
        
        // Não expandir objetos complexos para evitar verbosidade
        if (typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length <= 5) {
          traverse(value, fullKey);
        }
      });
    };
    
    traverse(sectionData);
    return fields;
  };

  const getSectionStats = (fields: FieldStatus[]) => {
    const total = fields.length;
    const populated = fields.filter(f => f.status === 'populated').length;
    const partial = fields.filter(f => f.status === 'partial').length;
    const empty = fields.filter(f => f.status === 'empty').length;
    
    return { total, populated, partial, empty };
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            📊 Relatório de Campos JSONB
          </h3>
          <Badge variant="secondary" className="text-xs">
            {Object.keys(jsonbSections).length} seções
          </Badge>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {Object.entries(jsonbSections).map(([sectionName, fieldKey]) => {
              const sectionData = data[fieldKey];
              const fields = analyzeSection(sectionData);
              const stats = getSectionStats(fields);
              const isExpanded = expandedSections.has(fieldKey);
              const hasData = sectionData !== null && sectionData !== undefined;

              return (
                <div
                  key={fieldKey}
                  className="border rounded-lg bg-background overflow-hidden"
                >
                  {/* Header da Seção */}
                  <button
                    onClick={() => toggleSection(fieldKey)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{sectionName}</span>
                      {!hasData && (
                        <Badge variant="secondary" className="text-xs">
                          Sem dados
                        </Badge>
                      )}
                    </div>
                    
                    {hasData && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ {stats.populated}
                        </span>
                        {stats.partial > 0 && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            ⚠ {stats.partial}
                          </span>
                        )}
                        {stats.empty > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            ✗ {stats.empty}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          / {stats.total}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Conteúdo Expandível */}
                  {isExpanded && hasData && (
                    <div className="border-t p-3 space-y-2">
                      {fields.map((field, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {getStatusIcon(field.status)}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-mono text-foreground truncate">
                                {field.field}
                              </div>
                              {field.status !== 'empty' && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  {typeof field.value === 'object' && !Array.isArray(field.value)
                                    ? JSON.stringify(field.value).substring(0, 100) + '...'
                                    : Array.isArray(field.value)
                                    ? `${field.value.length} itens`
                                    : String(field.value).substring(0, 100)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-[10px]">
                              {field.type}
                            </Badge>
                            {getStatusBadge(field.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Resumo Geral */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <strong>Legenda:</strong> Verde = Completo • Amarelo = Parcial • Vermelho = Vazio
          </div>
        </div>
      </div>
    </Card>
  );
}
