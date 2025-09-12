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

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  category: 'basic' | 'ml' | 'mapping' | 'financial';
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  // Colunas básicas
  { key: 'id_unico', label: 'ID Único', visible: true, category: 'basic' },
  { key: 'numero', label: 'Número', visible: true, category: 'basic' },
  { key: 'nome_cliente', label: 'Cliente', visible: true, category: 'basic' },
  { key: 'nome_completo', label: 'Nome Completo', visible: true, category: 'basic' },
  { key: 'cpf_cnpj', label: 'CPF/CNPJ', visible: true, category: 'basic' },
  { key: 'data_pedido', label: 'Data Pedido', visible: true, category: 'basic' },
  { key: 'sku', label: 'SKU', visible: true, category: 'basic' },
  { key: 'quantidade', label: 'Quantidade', visible: true, category: 'basic' },
  { key: 'situacao', label: 'Status do Pagamento', visible: true, category: 'basic' },
  { key: 'obs', label: 'Obs', visible: true, category: 'basic' },
  
  // Colunas financeiras
  { key: 'valor_total', label: 'Valor Total', visible: true, category: 'financial' },
  { key: 'valor_frete', label: 'Valor Frete', visible: true, category: 'financial' },
  { key: 'valor_desconto', label: 'Valor Desconto', visible: true, category: 'financial' },
  { key: 'paid_amount', label: 'Valor Pago', visible: false, category: 'financial' },
  { key: 'currency_id', label: 'Moeda', visible: false, category: 'financial' },
  { key: 'coupon_amount', label: 'Desconto Cupom', visible: false, category: 'financial' },
  
  // Colunas de mapeamento
  { key: 'sku_estoque', label: 'SKU Estoque', visible: true, category: 'mapping' },
  { key: 'sku_kit', label: 'SKU Kit', visible: true, category: 'mapping' },
  { key: 'qtd_kit', label: 'QTD Kit', visible: true, category: 'mapping' },
  { key: 'total_itens', label: 'Total Itens', visible: true, category: 'mapping' },
  { key: 'status_estoque', label: 'Status', visible: true, category: 'mapping' },
  
  // Colunas específicas do Mercado Livre
  { key: 'date_created', label: 'Data Criação ML', visible: false, category: 'ml' },
  { key: 'date_closed', label: 'Data Fechamento ML', visible: false, category: 'ml' },
  { key: 'last_updated', label: 'Última Atualização ML', visible: false, category: 'ml' },
  { key: 'pack_id', label: 'Pack ID', visible: false, category: 'ml' },
  { key: 'pickup_id', label: 'Pickup ID', visible: false, category: 'ml' },
  { key: 'status_detail', label: 'Status Detalhe', visible: false, category: 'ml' },
  { key: 'tags', label: 'Tags ML', visible: false, category: 'ml' },
  { key: 'buyer_id', label: 'ID Comprador', visible: false, category: 'ml' },
  { key: 'seller_id', label: 'ID Vendedor', visible: false, category: 'ml' },
  { key: 'shipping_id', label: 'ID Envio', visible: false, category: 'ml' },
  
  // Outras colunas
  { key: 'numero_ecommerce', label: 'Nº eCommerce', visible: false, category: 'basic' },
  { key: 'numero_venda', label: 'Nº Venda', visible: false, category: 'basic' },
  { key: 'empresa', label: 'Empresa', visible: false, category: 'basic' },
  { key: 'cidade', label: 'Cidade', visible: true, category: 'basic' },
  { key: 'uf', label: 'UF', visible: true, category: 'basic' },
  { key: 'cep', label: 'CEP', visible: true, category: 'basic' },
  { key: 'endereco_rua', label: 'Rua', visible: false, category: 'basic' },
  { key: 'endereco_numero', label: 'Número', visible: false, category: 'basic' },
  { key: 'endereco_bairro', label: 'Bairro', visible: false, category: 'basic' },

  // Envio (ML)
  { key: 'shipping_status', label: 'Status do Envio', visible: true, category: 'ml' },
  { key: 'shipping_mode', label: 'Modo de Envio', visible: true, category: 'ml' },
  { key: 'shipping_substatus', label: 'Sub-status Detalhado', visible: true, category: 'ml' },

  // ✅ NOVAS COLUNAS PÓS-VENDA (com feature flag)
  { key: 'post_sale_status_pedido', label: 'Status do Pedido', visible: false, category: 'ml' },
  { key: 'post_sale_status_envio', label: 'Status do Envio', visible: false, category: 'ml' },
  { key: 'post_sale_substatus', label: 'Substatus/Motivo', visible: false, category: 'ml' },
  { key: 'post_sale_devolucao', label: 'Devolução', visible: false, category: 'ml' },
  { key: 'post_sale_prev_entrega', label: 'Prev. Entrega', visible: false, category: 'ml' },
];

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export function ColumnSelector({ columns, onColumnsChange }: ColumnSelectorProps) {
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
    onColumnsChange(DEFAULT_COLUMNS);
  };

  const groupedColumns = columns.reduce((acc, col) => {
    if (!acc[col.category]) {
      acc[col.category] = [];
    }
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  const categoryLabels = {
    basic: 'Básicas',
    financial: 'Financeiras',
    mapping: 'Mapeamento',
    ml: 'Mercado Livre'
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
          <SheetTitle>Configurar Colunas</SheetTitle>
          <SheetDescription>
            Selecione as colunas que deseja exibir na tabela de pedidos
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium">
              {visibleColumnsCount} de {columns.length} colunas visíveis
            </span>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              Restaurar Padrão
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