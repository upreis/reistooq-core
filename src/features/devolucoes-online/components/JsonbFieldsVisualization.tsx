/**
 * 🗺️ JSONB FIELDS VISUALIZATION
 * Mapa visual de campos JSONB populados vs vazios
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Database } from 'lucide-react';

interface JsonbFieldsVisualizationProps {
  data: any;
}

interface FieldStatus {
  name: string;
  populated: boolean;
  isEmpty: boolean;
  fieldCount: number;
  populatedCount: number;
}

export function JsonbFieldsVisualization({ data }: JsonbFieldsVisualizationProps) {
  // Campos JSONB que devem ser analisados
  const jsonbFields = [
    { key: 'dados_buyer_info', label: '👤 Comprador' },
    { key: 'dados_product_info', label: '📦 Produto' },
    { key: 'dados_financial_info', label: '💰 Financeiro' },
    { key: 'dados_tracking_info', label: '📍 Tracking' },
    { key: 'dados_quantities', label: '🔢 Quantidades' },
    { key: 'dados_order', label: '📋 Pedido' },
    { key: 'dados_claim', label: '⚖️ Claim' },
    { key: 'dados_return', label: '🔄 Return' },
    { key: 'dados_review', label: '🔍 Review' },
    { key: 'dados_mensagens', label: '💬 Mensagens' },
  ];

  const analyzeField = (fieldData: any): FieldStatus => {
    if (!fieldData || typeof fieldData !== 'object') {
      return {
        name: '',
        populated: false,
        isEmpty: true,
        fieldCount: 0,
        populatedCount: 0,
      };
    }

    const fields = Object.keys(fieldData);
    const populated = fields.filter(key => {
      const value = fieldData[key];
      return value !== null && value !== undefined && value !== '';
    });

    return {
      name: '',
      populated: populated.length > 0,
      isEmpty: fields.length === 0,
      fieldCount: fields.length,
      populatedCount: populated.length,
    };
  };

  const fieldStatuses = jsonbFields.map(field => {
    const status = analyzeField(data[field.key]);
    return {
      ...field,
      ...status,
    };
  });

  const totalFields = fieldStatuses.reduce((sum, f) => sum + f.fieldCount, 0);
  const totalPopulated = fieldStatuses.reduce((sum, f) => sum + f.populatedCount, 0);
  const completionPercentage = totalFields > 0 ? Math.round((totalPopulated / totalFields) * 100) : 0;

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-sm">Mapa de Campos JSONB</h3>
          </div>
          <Badge variant={completionPercentage > 70 ? 'default' : completionPercentage > 40 ? 'secondary' : 'destructive'}>
            {completionPercentage}% Completo
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-background rounded-lg">
            <div className="font-semibold text-lg">{totalPopulated}</div>
            <div className="text-muted-foreground">Populados</div>
          </div>
          <div className="text-center p-2 bg-background rounded-lg">
            <div className="font-semibold text-lg">{totalFields - totalPopulated}</div>
            <div className="text-muted-foreground">Vazios</div>
          </div>
          <div className="text-center p-2 bg-background rounded-lg">
            <div className="font-semibold text-lg">{totalFields}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-2 gap-2">
          {fieldStatuses.map((field) => {
            const percentage = field.fieldCount > 0 
              ? Math.round((field.populatedCount / field.fieldCount) * 100)
              : 0;

            return (
              <div
                key={field.key}
                className="p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{field.label}</span>
                  </div>
                  {field.isEmpty ? (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : field.populated && percentage === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{field.populatedCount}/{field.fieldCount} campos</span>
                    <span className={`font-semibold ${
                      percentage === 100 ? 'text-green-600 dark:text-green-400' :
                      percentage > 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        percentage === 100 ? 'bg-green-500' :
                        percentage > 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Campo Key */}
                <div className="mt-2 text-xs font-mono text-muted-foreground truncate">
                  {field.key}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>100% Completo</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            <span>Parcial</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            <span>Vazio</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
