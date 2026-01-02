import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Package, ShoppingCart, Minus, Plus, Warehouse, Store } from "lucide-react";
// Produtos vêm de produtos_composicoes (composições para OMS)
import { formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  nome: string;
  sku_interno: string;
  preco_custo: number;
  preco_venda: number;
  quantidade_atual: number;
  estoque_minimo?: number;
  categoria?: string;
}

interface ProductSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProducts: (products: any[]) => void;
  selectedProducts?: any[];
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  isOpen,
  onOpenChange,
  onSelectProducts,
  selectedProducts = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<{[key: string]: { product: Product; quantidade: number }}>({});
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para locais de estoque e venda
  const [locaisEstoque, setLocaisEstoque] = useState<{id: string; nome: string; tipo: string}[]>([]);
  const [locaisVenda, setLocaisVenda] = useState<{id: string; nome: string; local_estoque_id: string}[]>([]);
  const [selectedLocalEstoqueId, setSelectedLocalEstoqueId] = useState<string>('');
  const [selectedLocalVendaId, setSelectedLocalVendaId] = useState<string>('');

  // Carregar locais de estoque e venda
  useEffect(() => {
    const loadLocais = async () => {
      try {
        const [estoquesRes, vendasRes] = await Promise.all([
          supabase.from('locais_estoque').select('id, nome, tipo').eq('ativo', true).order('tipo').order('nome'),
          supabase.from('locais_venda').select('id, nome, local_estoque_id').eq('ativo', true).order('nome')
        ]);

        const estoques = estoquesRes.data || [];
        const vendas = vendasRes.data || [];

        setLocaisEstoque(estoques);
        setLocaisVenda(vendas);

        // Priorizar estoque "inhouse" que tenha locais de venda
        const inhouseComVendas = estoques.find(e => 
          e.tipo === 'inhouse' && vendas.some(v => v.local_estoque_id === e.id)
        );
        
        if (inhouseComVendas) {
          setSelectedLocalEstoqueId(inhouseComVendas.id);
          const primeiroLocalVenda = vendas.find(v => v.local_estoque_id === inhouseComVendas.id);
          if (primeiroLocalVenda) setSelectedLocalVendaId(primeiroLocalVenda.id);
        } else {
          const principal = estoques.find(e => e.tipo === 'principal');
          if (principal) setSelectedLocalEstoqueId(principal.id);
        }
      } catch (error) {
        console.error("Error loading locais:", error);
      }
    };
    loadLocais();
  }, []);

  // Locais de venda filtrados pelo estoque selecionado
  const locaisVendaFiltrados = locaisVenda.filter(lv => lv.local_estoque_id === selectedLocalEstoqueId);

  // Carregar produtos de COMPOSIÇÕES com estoque calculado pelos insumos do local de venda
  useEffect(() => {
    const loadProducts = async () => {
      if (isOpen && selectedLocalEstoqueId) {
        setLoading(true);
        try {
          // Buscar produtos da tabela produtos_composicoes (composições para OMS)
          const { data: composicoesData, error: composicoesError } = await supabase
            .from('produtos_composicoes')
            .select('id, sku_interno, nome, categoria, preco_venda, preco_custo, estoque_minimo')
            .eq('ativo', true)
            .order('nome');

          if (composicoesError) {
            console.error("Error loading compositions:", composicoesError);
            setProducts([]);
            return;
          }

          const skus = (composicoesData || []).map((c: any) => c.sku_interno);

          // Se tem local de venda selecionado, buscar composições de insumos
          let composicoesLocalVenda: any[] = [];
          if (selectedLocalVendaId) {
            const { data: compData } = await supabase
              .from('composicoes_local_venda')
              .select('sku_produto, sku_insumo, quantidade')
              .eq('local_venda_id', selectedLocalVendaId)
              .eq('ativo', true)
              .in('sku_produto', skus);
            
            composicoesLocalVenda = compData || [];
          }

          // Buscar os produtos da tabela principal para pegar os IDs (produto principal + insumos)
          const allSkus = [...new Set([
            ...skus,
            ...composicoesLocalVenda.map((c: any) => c.sku_insumo)
          ])];

          // Buscar produtos incluindo preços reais
          const { data: produtosData } = await supabase
            .from('produtos')
            .select('id, sku_interno, preco_venda, preco_custo')
            .in('sku_interno', allSkus);

          const skuToProductId = new Map((produtosData || []).map((p: any) => [p.sku_interno, p.id]));
          const skuToPrecos = new Map((produtosData || []).map((p: any) => [p.sku_interno, { preco_venda: p.preco_venda || 0, preco_custo: p.preco_custo || 0 }]));
          const productIds = Array.from(skuToProductId.values());

          // Buscar estoque por local para todos os produtos e insumos
          const { data: estoqueData } = await supabase
            .from('estoque_por_local')
            .select('produto_id, quantidade')
            .eq('local_id', selectedLocalEstoqueId)
            .in('produto_id', productIds);

          const estoqueMap = new Map((estoqueData || []).map((e: any) => [e.produto_id, e.quantidade]));

          // Função para calcular quantidade produzível baseado nos insumos
          const calcularQuantidadeProduzivel = (skuProduto: string): number => {
            // Filtrar composições deste produto
            const insumosDoProtuto = composicoesLocalVenda.filter((c: any) => c.sku_produto === skuProduto);
            
            if (insumosDoProtuto.length === 0) {
              // Sem composição de insumos, usar estoque do produto principal
              const produtoId = skuToProductId.get(skuProduto);
              return produtoId ? (estoqueMap.get(produtoId) || 0) : 0;
            }

            // Calcular mínimo baseado nos insumos (o insumo mais limitante define a quantidade)
            let minProduzivel = Infinity;

            for (const insumo of insumosDoProtuto) {
              const insumoId = skuToProductId.get(insumo.sku_insumo);
              const estoqueInsumo = insumoId ? (estoqueMap.get(insumoId) || 0) : 0;
              const qtdNecessaria = insumo.quantidade || 1;
              const podeFazer = Math.floor(estoqueInsumo / qtdNecessaria);
              
              if (podeFazer < minProduzivel) {
                minProduzivel = podeFazer;
              }
            }

            return minProduzivel === Infinity ? 0 : minProduzivel;
          };

          // Mapear para o formato esperado com estoque calculado e preços reais da tabela produtos
          const produtosComposicoes = (composicoesData || []).map((item: any) => {
            const quantidadeEstoque = calcularQuantidadeProduzivel(item.sku_interno);
            const precosReais = skuToPrecos.get(item.sku_interno) || { preco_venda: 0, preco_custo: 0 };
            
            return {
              id: item.id,
              nome: item.nome,
              sku_interno: item.sku_interno,
              preco_custo: precosReais.preco_custo || item.preco_custo || 0,
              preco_venda: precosReais.preco_venda || item.preco_venda || 0,
              quantidade_atual: quantidadeEstoque,
              estoque_minimo: item.estoque_minimo || 0,
              categoria: item.categoria
            };
          });

          setProducts(produtosComposicoes);
        } catch (error) {
          console.error("Error loading compositions:", error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      } else if (isOpen && !selectedLocalEstoqueId) {
        setProducts([]);
      }
    };
    loadProducts();
  }, [isOpen, selectedLocalEstoqueId, selectedLocalVendaId]);

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductToggle = (product: Product, checked: boolean) => {
    const newSelected = { ...selectedItems };
    
    if (checked) {
      newSelected[product.id] = { product, quantidade: 1 };
    } else {
      delete newSelected[product.id];
    }
    
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (productId: string, quantidade: number | string) => {
    const newSelected = { ...selectedItems };
    if (newSelected[productId]) {
      // Permitir string vazia ou número
      const value = quantidade === '' || quantidade === 0 ? 0 : Number(quantidade);
      newSelected[productId].quantidade = value < 0 ? 0 : value;
      setSelectedItems(newSelected);
    }
  };

  const handleConfirm = () => {
    const productsToReturn = Object.values(selectedItems).map(({ product, quantidade }) => ({
      id: product.id,
      nome: product.nome,
      sku_interno: product.sku_interno,
      preco_custo: product.preco_custo,
      quantidade: quantidade,
      // Incluir informações do local de estoque e venda
      local_estoque_id: selectedLocalEstoqueId,
      local_venda_id: selectedLocalVendaId || null
    }));

    onSelectProducts(productsToReturn);
    setSelectedItems({});
    setSearchTerm('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedItems({});
    setSearchTerm('');
    onOpenChange(false);
  };

  // Usando formatMoney de src/lib/format.ts para consistência

  const getStockStatus = (product: Product) => {
    const percentage = (product.quantidade_atual / (product.estoque_minimo || 1)) * 100;
    
    if (percentage <= 100) {
      return { variant: "destructive" as const, label: "Estoque Baixo", icon: Package };
    } else if (percentage <= 200) {
      return { variant: "secondary" as const, label: "Estoque OK", icon: Package };
    } else {
      return { variant: "default" as const, label: "Estoque Alto", icon: Package };
    }
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalValue = Object.values(selectedItems).reduce(
    (sum, { product, quantidade }) => sum + (product.preco_custo * quantidade),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Selecionar Produtos
            {selectedCount > 0 && (
              <Badge variant="default" className="ml-2">
                {selectedCount} selecionado(s)
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletores de Estoque e Local de Venda */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Warehouse className="w-4 h-4" />
                  Local de Estoque
                </Label>
                <Select value={selectedLocalEstoqueId} onValueChange={(value) => {
                  setSelectedLocalEstoqueId(value);
                  setSelectedLocalVendaId('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estoque" />
                  </SelectTrigger>
                  <SelectContent>
                    {locaisEstoque.map(local => (
                      <SelectItem key={local.id} value={local.id}>
                        {local.nome} ({local.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {locaisVendaFiltrados.length > 0 && (
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Store className="w-4 h-4" />
                    Local de Venda
                  </Label>
                  <Select value={selectedLocalVendaId} onValueChange={setSelectedLocalVendaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o local de venda" />
                    </SelectTrigger>
                    <SelectContent>
                      {locaisVendaFiltrados.map(local => (
                        <SelectItem key={local.id} value={local.id}>
                          {local.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            
            {/* Informação sobre composições do local de venda */}
            {selectedLocalVendaId && (
              <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span className="font-medium">Local de venda selecionado:</span> 
                  As composições (insumos/embalagens) deste local serão consideradas na baixa de estoque.
                </p>
              </div>
            )}
          </div>
        </div>

          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos por nome, SKU ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Resumo da seleção */}
          {selectedCount > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Resumo da Seleção</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCount} produto(s) selecionado(s)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatMoney(totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de produtos */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Selecionar</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Venda</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="w-32">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isSelected = !!selectedItems[product.id];
                  const quantidade = selectedItems[product.id]?.quantidade || 1;
                  const stockStatus = getStockStatus(product);
                  const StockIcon = stockStatus.icon;

                  return (
                    <TableRow key={product.id} className={isSelected ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleProductToggle(product, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.nome}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {product.sku_interno}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.categoria || 'Sem categoria'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-muted-foreground">
                          {formatMoney(product.preco_custo)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatMoney(product.preco_venda)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockIcon className="h-4 w-4" />
                          <span>{product.quantidade_atual}</span>
                          <Badge variant={stockStatus.variant} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={quantidade === 0 ? '' : quantidade}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                handleQuantityChange(product.id, val === '' ? 0 : parseInt(val));
                              }
                            }}
                            className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Produtos não encontrados */}
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                {selectedLocalEstoqueId 
                  ? "Nenhum produto com estoque disponível neste local. Verifique se há produtos cadastrados no estoque selecionado."
                  : "Selecione um local de estoque para ver os produtos disponíveis."}
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 && (
              <span>
                {selectedCount} produto(s) selecionado(s) • Total: {formatMoney(totalValue)}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={selectedCount === 0}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Confirmar Seleção ({selectedCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};