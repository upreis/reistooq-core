import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export interface HistoricoColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  category: 'basic' | 'financial' | 'mapping' | 'shipping' | 'products';
}

export const DEFAULT_HISTORICO_COLUMNS: HistoricoColumnConfig[] = [
  // Básicas
  { key: 'id_unico', label: 'ID-Único', visible: true, category: 'basic' },
  { key: 'empresa', label: 'Empresa', visible: true, category: 'basic' },
  { key: 'numero_pedido', label: 'Número do Pedido', visible: true, category: 'basic' },
  { key: 'cliente_nome', label: 'Nome do Cliente', visible: true, category: 'basic' },
  { key: 'cliente_documento', label: 'Nome Completo', visible: true, category: 'basic' },
  { key: 'data_pedido', label: 'Data do Pedido', visible: true, category: 'basic' },
  { key: 'updated_at', label: 'Última Atualização', visible: false, category: 'basic' },

  // Produtos
  { key: 'sku_produto', label: 'SKUs/Produtos', visible: true, category: 'products' },
  { key: 'quantidade', label: 'Quantidade Total', visible: true, category: 'products' },
  { key: 'descricao', label: 'Título do Produto', visible: true, category: 'products' },

  // Financeiras
  { key: 'valor_total', label: 'Valor Total', visible: true, category: 'financial' },
  { key: 'valor_unitario', label: 'Valor Pago', visible: false, category: 'financial' },
  { key: 'valor_frete', label: 'Frete Pago Cliente', visible: true, category: 'financial' },
  { key: 'receita_flex', label: 'Receita Flex (Bônus)', visible: false, category: 'financial' },
  { key: 'custo_envio_seller', label: 'Custo Envio Seller', visible: false, category: 'financial' },
  { key: 'valor_desconto', label: 'Desconto Cupom', visible: true, category: 'financial' },
  { key: 'taxa_marketplace', label: 'Taxa Marketplace', visible: false, category: 'financial' },
  { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', visible: false, category: 'financial' },
  { key: 'metodo_pagamento', label: 'Método Pagamento', visible: false, category: 'financial' },
  { key: 'situacao', label: 'Status Pagamento', visible: true, category: 'financial' },
  { key: 'tipo_pagamento', label: 'Tipo Pagamento', visible: false, category: 'financial' },

  // Mapeamento
  { key: 'status_mapeamento', label: 'Status Mapeamento', visible: false, category: 'mapping' },
  { key: 'sku_estoque', label: 'SKU Estoque', visible: true, category: 'mapping' },
  { key: 'sku_kit', label: 'SKU KIT', visible: true, category: 'mapping' },
  { key: 'qtd_kit', label: 'Quantidade KIT', visible: true, category: 'mapping' },
  { key: 'total_itens', label: 'Total de Itens', visible: true, category: 'mapping' },
  { key: 'status', label: 'Status da Baixa', visible: true, category: 'mapping' },

  // Envio
  { key: 'status_pagamento', label: 'Status do Pagamento', visible: false, category: 'shipping' },
  { key: 'status_envio', label: 'Status do Envio', visible: true, category: 'shipping' },
  { key: 'logistic_mode', label: 'Logistic Mode (Principal)', visible: false, category: 'shipping' },
  { key: 'tipo_logistico', label: 'Tipo Logístico', visible: false, category: 'shipping' },
  { key: 'tipo_metodo_envio', label: 'Tipo Método Envio', visible: false, category: 'shipping' },
  { key: 'tipo_entrega', label: 'Tipo Entrega', visible: false, category: 'shipping' },
  { key: 'substatus', label: 'Substatus (Estado Atual)', visible: false, category: 'shipping' },
  { key: 'modo_envio_combinado', label: 'Modo de Envio (Combinado)', visible: false, category: 'shipping' },
  { key: 'metodo_envio_combinado', label: 'Método de Envio (Combinado)', visible: false, category: 'shipping' },
  { key: 'cidade', label: 'Cidade', visible: false, category: 'shipping' },
  { key: 'uf', label: 'UF', visible: false, category: 'shipping' },
  { key: 'codigo_rastreamento', label: 'Código Rastreamento', visible: false, category: 'shipping' },
  { key: 'url_rastreamento', label: 'URL Rastreamento', visible: false, category: 'shipping' },
];

interface HistoricoColumnSelectorProps {
  columns: HistoricoColumnConfig[];
  onColumnsChange: (columns: HistoricoColumnConfig[]) => void;
}

export function HistoricoColumnSelector({ columns, onColumnsChange }: HistoricoColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColumnToggle = (key: string, checked: boolean) => {
    const updatedColumns = columns.map(col => 
      col.key === key ? { ...col, visible: checked } : col
    );
    onColumnsChange(updatedColumns);
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const updatedColumns = columns.map(col => 
      col.category === category ? { ...col, visible: checked } : col
    );
    onColumnsChange(updatedColumns);
  };

  const resetToDefault = () => {
    onColumnsChange(DEFAULT_HISTORICO_COLUMNS);
  };

  const groupedColumns = columns.reduce((acc, col) => {
    if (!acc[col.category]) {
      acc[col.category] = [];
    }
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, HistoricoColumnConfig[]>);

  const categoryLabels = {
    basic: 'Básicas',
    products: 'Produtos',
    financial: 'Financeiras',
    mapping: 'Mapeamento',
    shipping: 'Envio'
  };

  const visibleColumnsCount = columns.filter(col => col.visible).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Colunas ({visibleColumnsCount})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Selecionar Colunas</SheetTitle>
          <SheetDescription>
            Escolha as colunas que deseja exibir na tabela de histórico
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium">
              {visibleColumnsCount} de {columns.length} colunas visíveis
            </span>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Padrão
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {Object.entries(groupedColumns).map(([category, cols]) => {
              const visibleInCategory = cols.filter(col => col.visible).length;
              const allVisible = visibleInCategory === cols.length;
              const someVisible = visibleInCategory > 0 && visibleInCategory < cols.length;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center space-x-2 border-b pb-2">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={allVisible}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisible;
                      }}
                      onChange={(e) => 
                        handleCategoryToggle(category, e.target.checked)
                      }
                      className="rounded border-border"
                    />
                    <label 
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {categoryLabels[category as keyof typeof categoryLabels]} 
                      <span className="text-muted-foreground ml-1">
                        ({visibleInCategory}/{cols.length})
                      </span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 ml-6">
                    {cols.map((col) => (
                      <div key={col.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={col.key}
                          checked={col.visible}
                          onChange={(e) => 
                            handleColumnToggle(col.key, e.target.checked)
                          }
                          className="rounded border-border"
                        />
                        <label 
                          htmlFor={col.key}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}