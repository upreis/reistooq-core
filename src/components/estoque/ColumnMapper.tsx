import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  RotateCcw, 
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Target,
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnMapping {
  excelColumn: string;
  systemField: string | null;
  required: boolean;
  dataType: 'text' | 'number' | 'decimal' | 'boolean';
  sampleValues: any[];
}

interface ColumnMapperProps {
  excelHeaders: string[];
  sampleData: any[][];
  onMappingChange: (mapping: Record<string, string>) => void;
  onContinue: () => void;
  onCancel: () => void;
}

const SYSTEM_FIELDS = [
  { key: 'sku_interno', label: 'SKU Interno', required: true, type: 'text' },
  { key: 'nome', label: 'Nome do Produto', required: true, type: 'text' },
  { key: 'categoria', label: 'Categoria', required: false, type: 'text' },
  { key: 'descricao', label: 'Descrição', required: false, type: 'text' },
  { key: 'quantidade_atual', label: 'Quantidade Atual', required: false, type: 'number' },
  { key: 'estoque_minimo', label: 'Estoque Mínimo', required: false, type: 'number' },
  { key: 'estoque_maximo', label: 'Estoque Máximo', required: false, type: 'number' },
  { key: 'preco_custo', label: 'Preço de Custo', required: false, type: 'decimal' },
  { key: 'preco_venda', label: 'Preço de Venda', required: false, type: 'decimal' },
  { key: 'codigo_barras', label: 'Código de Barras', required: false, type: 'text' },
  { key: 'localizacao', label: 'Localização', required: false, type: 'text' }
];

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  excelHeaders,
  sampleData,
  onMappingChange,
  onContinue,
  onCancel
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [autoMapAttempted, setAutoMapAttempted] = useState(false);

  useEffect(() => {
    if (!autoMapAttempted) {
      autoMapColumns();
      setAutoMapAttempted(true);
    }
  }, [excelHeaders, autoMapAttempted]);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const autoMapColumns = () => {
    const newMappings: Record<string, string> = {};
    
    excelHeaders.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Tentativas de mapeamento automático baseado em palavras-chave
      const mappingRules = [
        { patterns: ['sku', 'codigo', 'código'], field: 'sku_interno' },
        { patterns: ['nome', 'produto', 'title', 'titulo'], field: 'nome' },
        { patterns: ['categoria', 'category', 'tipo'], field: 'categoria' },
        { patterns: ['descricao', 'descrição', 'description'], field: 'descricao' },
        { patterns: ['quantidade', 'qtd', 'estoque', 'stock'], field: 'quantidade_atual' },
        { patterns: ['minimo', 'mínimo', 'min'], field: 'estoque_minimo' },
        { patterns: ['maximo', 'máximo', 'max'], field: 'estoque_maximo' },
        { patterns: ['custo', 'cost'], field: 'preco_custo' },
        { patterns: ['venda', 'preco', 'preço', 'price'], field: 'preco_venda' },
        { patterns: ['barras', 'barcode', 'ean'], field: 'codigo_barras' },
        { patterns: ['localizacao', 'localização', 'location'], field: 'localizacao' }
      ];

      for (const rule of mappingRules) {
        if (rule.patterns.some(pattern => normalizedHeader.includes(pattern))) {
          // Verificar se o campo ainda não foi mapeado
          if (!Object.values(newMappings).includes(rule.field)) {
            newMappings[header] = rule.field;
            break;
          }
        }
      }
    });

    setMappings(newMappings);
  };

  const handleMappingChange = (excelColumn: string, systemField: string | null) => {
    const newMappings = { ...mappings };
    
    if (systemField === null || systemField === '' || systemField === '__unmapped__') {
      delete newMappings[excelColumn];
    } else {
      // Remover mapeamento anterior do mesmo campo do sistema
      Object.keys(newMappings).forEach(key => {
        if (newMappings[key] === systemField) {
          delete newMappings[key];
        }
      });
      
      newMappings[excelColumn] = systemField;
    }
    
    setMappings(newMappings);
  };

  const resetMappings = () => {
    setMappings({});
  };

  const getSampleValues = (columnIndex: number) => {
    const samples = sampleData.slice(1, 4).map(row => row[columnIndex]);
    return samples.filter(val => val !== null && val !== undefined && val !== '');
  };

  const getFieldStatus = (fieldKey: string) => {
    const isMapped = Object.values(mappings).includes(fieldKey);
    const field = SYSTEM_FIELDS.find(f => f.key === fieldKey);
    
    if (field?.required && !isMapped) return 'required';
    if (isMapped) return 'mapped';
    return 'optional';
  };

  const getMappedColumnForField = (fieldKey: string) => {
    return Object.keys(mappings).find(key => mappings[key] === fieldKey);
  };

  const canContinue = () => {
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
    return requiredFields.every(field => Object.values(mappings).includes(field.key));
  };

  const getMappingStats = () => {
    const totalColumns = excelHeaders.length;
    const mappedColumns = Object.keys(mappings).length;
    const requiredFieldsMapped = SYSTEM_FIELDS.filter(f => f.required && Object.values(mappings).includes(f.key)).length;
    const totalRequiredFields = SYSTEM_FIELDS.filter(f => f.required).length;
    
    return {
      totalColumns,
      mappedColumns,
      requiredFieldsMapped,
      totalRequiredFields
    };
  };

  const stats = getMappingStats();

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Mapeamento de Colunas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalColumns}</div>
              <div className="text-sm text-muted-foreground">Colunas Excel</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.mappedColumns}</div>
              <div className="text-sm text-muted-foreground">Mapeadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.requiredFieldsMapped}/{stats.totalRequiredFields}
              </div>
              <div className="text-sm text-muted-foreground">Obrigatórios</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                canContinue() ? "text-green-600" : "text-red-600"
              )}>
                {canContinue() ? <CheckCircle className="h-8 w-8 mx-auto" /> : <AlertTriangle className="h-8 w-8 mx-auto" />}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={autoMapColumns}>
              <Wand2 className="h-4 w-4 mr-2" />
              Auto Mapear
            </Button>
            <Button variant="outline" size="sm" onClick={resetMappings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar Tudo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerta se campos obrigatórios não mapeados */}
      {!canContinue() && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            Alguns campos obrigatórios ainda não foram mapeados. 
            Mapeie todos os campos marcados como "Obrigatório" para continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Mapeamento das colunas */}
      <div className="grid gap-4">
        {excelHeaders.map((header, index) => (
          <Card key={index} className={cn(
            "transition-colors",
            mappings[header] ? "border-green-200 bg-green-50" : "border-muted"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Coluna Excel */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <Badge variant="outline">Coluna {String.fromCharCode(65 + index)}</Badge>
                    <span className="font-medium">{header}</span>
                  </div>
                  
                  {/* Amostras de dados */}
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Amostras: </span>
                    {getSampleValues(index).slice(0, 3).map((sample, idx) => (
                      <span key={idx} className="mr-2">
                        "{String(sample).substring(0, 20)}{String(sample).length > 20 ? '...' : ''}"
                      </span>
                    ))}
                  </div>
                </div>

                {/* Seta */}
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                {/* Campo do Sistema */}
                <div className="flex-1">
                  <Select
                    value={mappings[header] || ''}
                    onValueChange={(value) => handleMappingChange(header, value === '__unmapped__' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unmapped__">Não mapear</SelectItem>
                      <Separator className="my-1" />
                      {SYSTEM_FIELDS.map((field) => {
                        const status = getFieldStatus(field.key);
                        const mappedColumn = getMappedColumnForField(field.key);
                        const isDisabled = mappedColumn && mappedColumn !== header;
                        
                        return (
                          <SelectItem 
                            key={field.key} 
                            value={field.key}
                            disabled={isDisabled}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={isDisabled ? 'text-muted-foreground' : ''}>
                                {field.label}
                              </span>
                              <div className="flex items-center gap-1 ml-2">
                                {field.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Obrigatório
                                  </Badge>
                                )}
                                {status === 'mapped' && (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                )}
                                {isDisabled && (
                                  <Badge variant="secondary" className="text-xs">
                                    Em uso
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo dos campos do sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Campos do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {SYSTEM_FIELDS.map((field) => {
              const status = getFieldStatus(field.key);
              const mappedColumn = getMappedColumnForField(field.key);
              
              return (
                <div key={field.key} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {status === 'mapped' ? (
                      <>
                        <span className="text-sm text-muted-foreground">
                          ← {mappedColumn}
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </>
                    ) : status === 'required' ? (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <span className="text-sm text-muted-foreground">Não mapeado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={onContinue}
          disabled={!canContinue()}
        >
          Continuar para Preview
        </Button>
      </div>
    </div>
  );
};