import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Search, Trash2, Calculator, Package } from "lucide-react";
import { ProductSelector } from "./ProductSelector";

interface OrderItem {
  id: string;
  sku: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  icms: number;
  icmsSt: number;
  ipi: number;
  fcp: number;
  fcpSt: number;
}

interface OrderItemsTableProps {
  items: OrderItem[];
  onAddItem: (item: Omit<OrderItem, 'id'>) => void;
  onUpdateItem: (id: string, updates: Partial<OrderItem>) => void;
  onRemoveItem: (id: string) => void;
}

export function OrderItemsTable({ 
  items, 
  onAddItem, 
  onUpdateItem, 
  onRemoveItem 
}: OrderItemsTableProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '',
    descricao: '',
    quantidade: 1,
    valorUnitario: 0,
    icms: 0,
    icmsSt: 0,
    ipi: 0,
    fcp: 0,
    fcpSt: 0
  });

  const handleAddNewItem = () => {
    if (newItem.sku && newItem.descricao) {
      const valorTotal = newItem.quantidade * newItem.valorUnitario;
      onAddItem({
        ...newItem,
        valorTotal
      });
      setNewItem({
        sku: '',
        descricao: '',
        quantidade: 1,
        valorUnitario: 0,
        icms: 0,
        icmsSt: 0,
        ipi: 0,
        fcp: 0,
        fcpSt: 0
      });
      setIsAddingItem(false);
    }
  };

  const handleUpdateQuantidade = (id: string, quantidade: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const valorTotal = quantidade * item.valorUnitario;
      onUpdateItem(id, { quantidade, valorTotal });
    }
  };

  const handleUpdateValorUnitario = (id: string, valorUnitario: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const valorTotal = item.quantidade * valorUnitario;
      onUpdateItem(id, { valorUnitario, valorTotal });
    }
  };

  const handleProductSelect = (product: any) => {
    setNewItem(prev => ({
      ...prev,
      sku: product.sku,
      descricao: product.nome,
      valorUnitario: product.preco_venda || 0
    }));
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho da tabela com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingItem(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar outro item
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            <Search className="w-4 h-4 mr-1" />
            Busca avançada de itens
          </Button>
        </div>
      </div>

      {/* Tabela de itens */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">Nº</TableHead>
              <TableHead className="min-w-64">Descrição</TableHead>
              <TableHead className="w-32">Código (SKU)</TableHead>
              <TableHead className="w-20">Qtde</TableHead>
              <TableHead className="w-20">UN</TableHead>
              <TableHead className="w-24">Preço un</TableHead>
              <TableHead className="w-24">Preço total</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <Input
                    value={item.descricao}
                    onChange={(e) => onUpdateItem(item.id, { descricao: e.target.value })}
                    className="min-w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.sku}
                    onChange={(e) => onUpdateItem(item.id, { sku: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => handleUpdateQuantidade(item.id, parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="text-center">UN</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.valorUnitario}
                    onChange={(e) => handleUpdateValorUnitario(item.id, parseFloat(e.target.value) || 0)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.valorTotal.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600 hover:text-green-700"
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* Linha para adicionar novo item */}
            {isAddingItem && (
              <TableRow className="bg-blue-50 dark:bg-blue-950">
                <TableCell className="font-medium">{items.length + 1}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <ProductSelector
                      onSelect={handleProductSelect}
                      placeholder="Pesquise por descrição, código (SKU) ou código de barras"
                    />
                    <Input
                      value={newItem.descricao}
                      onChange={(e) => setNewItem(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Ou digite a descrição manualmente"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    value={newItem.sku}
                    onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="SKU"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantidade}
                    onChange={(e) => setNewItem(prev => ({ 
                      ...prev, 
                      quantidade: parseInt(e.target.value) || 1 
                    }))}
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="text-center">UN</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.valorUnitario}
                    onChange={(e) => setNewItem(prev => ({ 
                      ...prev, 
                      valorUnitario: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={(newItem.quantidade * newItem.valorUnitario).toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAddNewItem}
                      className="text-green-600 hover:text-green-700"
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingItem(false)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Resumo dos itens */}
      {items.length === 0 && !isAddingItem && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum item adicionado ainda</p>
          <Button
            variant="outline"
            onClick={() => setIsAddingItem(true)}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar primeiro item
          </Button>
        </div>
      )}
    </div>
  );
}