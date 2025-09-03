import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Plus, Boxes, Edit, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Upload, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useShopProducts } from "@/features/shop/hooks/useShopProducts";
import { ShopProduct } from "@/features/shop/types/shop.types";
import { useComposicoesEstoque } from "@/hooks/useComposicoesEstoque";
import { ComposicoesModal } from "./ComposicoesModal";
import { ImportModal } from "./ImportModal";
import { OptimizedCategorySidebar } from "./OptimizedCategorySidebar";
import { formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/hooks/useProducts";

const sortOptions = [
  { id: "newest", name: "Mais Recentes", sortBy: "created_at", sortOrder: "desc" },
  { id: "name", name: "A-Z", sortBy: "nome", sortOrder: "asc" },
  { id: "category", name: "Por Categoria", sortBy: "categoria", sortOrder: "asc" },
];

export function ComposicoesEstoque() {
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ShopProduct | null>(null);
  const [custosProdutos, setCustosProdutos] = useState<Record<string, number>>({});
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filtros hierárquicos para o sidebar
  const [hierarchicalFilters, setHierarchicalFilters] = useState<{
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }>({});

  const {
    products,
    categories,
    isLoading,
    filters,
    updateFilters,
    totalPages,
    hasNextPage,
    hasPrevPage,
    total
  } = useShopProducts();

  const { getComposicoesForSku, loadComposicoes } = useComposicoesEstoque();

  const abrirModalComposicoes = (produto: ShopProduct) => {
    setProdutoSelecionado(produto);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setProdutoSelecionado(null);
  };

  const handleSalvarComposicoes = () => {
    loadComposicoes(); // Recarrega as composições
  };

  const toggleCardExpansion = (productId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };

  const handleDownloadComposicoes = async () => {
    try {
      // Buscar todas as composições da organização
      const { data: composicoesData, error } = await supabase
        .from('produto_componentes')
        .select(`
          *,
          unidades_medida:unidade_medida_id (
            nome,
            abreviacao
          )
        `);

      if (error) {
        console.error('Erro ao buscar composições:', error);
        return;
      }

      // Preparar dados das composições para exportação
      const dataToExport = composicoesData?.map(comp => ({
        'SKU Produto': comp.sku_produto,
        'SKU Componente': comp.sku_componente,
        'Nome Componente': comp.nome_componente || '',
        'Quantidade': comp.quantidade,
        'Unidade de Medida': comp.unidades_medida?.nome || comp.unidades_medida?.abreviacao || '',
        'Data Criação': comp.created_at ? new Date(comp.created_at).toLocaleDateString('pt-BR') : '',
        'Data Atualização': comp.updated_at ? new Date(comp.updated_at).toLocaleDateString('pt-BR') : ''
      })) || [];

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Composições');
      
      // Baixar o arquivo
      const fileName = `composicoes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      console.log(`Download concluído: ${fileName}`);
    } catch (error) {
      console.error('Erro ao baixar dados das composições:', error);
    }
  };

  // Converter ShopProducts para Products para compatibilidade
  const productsForSidebar: Product[] = products?.map(product => ({
    id: product.id,
    sku_interno: product.sku_interno,
    nome: product.nome,
    categoria: product.categoria || null,
    descricao: product.descricao || null,
    codigo_barras: product.codigo_barras || null,
    quantidade_atual: product.quantidade_atual,
    estoque_minimo: product.estoque_minimo || 0,
    estoque_maximo: 999999, // Valor padrão já que ShopProduct não tem esta propriedade
    preco_custo: product.preco_custo || null,
    preco_venda: product.preco_venda || null,
    localizacao: null, // ShopProduct não tem esta propriedade
    unidade_medida_id: null,
    status: product.stock_status || 'in_stock',
    ativo: true,
    url_imagem: product.url_imagem || null,
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString(),
    ultima_movimentacao: null,
    organization_id: null,
    integration_account_id: null,
  })) || [];

  // Atualizar filtros com base na seleção hierárquica
  useEffect(() => {
    const searchFromFilters = filters?.search || '';
    updateFilters({
      search: searchFromFilters,
      categoria: hierarchicalFilters.categoriaPrincipal || 
                 hierarchicalFilters.categoria || 
                 hierarchicalFilters.subcategoria || 
                 undefined,
      page: 1
    });
  }, [hierarchicalFilters, updateFilters]);

  // Carregar custos dos produtos quando as composições mudarem
  useEffect(() => {
    const carregarCustos = async () => {
      if (!products || products.length === 0) return;
      
      try {
        const skusUnicos = Array.from(new Set(
          products.flatMap(p => {
            const comps = getComposicoesForSku(p.sku_interno);
            return comps?.map(c => c.sku_componente) || [];
          })
        ));

        if (skusUnicos.length === 0) return;

        const { data: produtosCusto } = await supabase
          .from('produtos')
          .select('sku_interno, preco_custo')
          .in('sku_interno', skusUnicos);

        const custosMap: Record<string, number> = {};
        produtosCusto?.forEach(p => {
          custosMap[p.sku_interno] = p.preco_custo || 0;
        });

        setCustosProdutos(custosMap);
      } catch (error) {
        console.error('Erro ao carregar custos:', error);
      }
    };

    carregarCustos();
  }, [products, getComposicoesForSku]);

  const renderProductCard = (product: ShopProduct) => {
    const composicoes = getComposicoesForSku(product.sku_interno);
    
    // Calcular custo total da composição
    const custoTotal = composicoes?.reduce((total, comp) => {
      const custoUnitario = custosProdutos[comp.sku_componente] || 0;
      return total + (custoUnitario * comp.quantidade);
    }, 0) || 0;

    // Calcular estoque disponível baseado nos componentes
    let estoqueDisponivel = product.quantidade_atual;
    let componenteLimitante = null;
    
    if (composicoes && composicoes.length > 0) {
      let menorEstoquePossivel = Infinity;
      
      for (const comp of composicoes) {
        const estoqueComponente = comp.estoque_componente || 0;
        const quantidadeNecessaria = comp.quantidade;
        const possiveisUnidades = Math.floor(estoqueComponente / quantidadeNecessaria);
        
        if (possiveisUnidades < menorEstoquePossivel) {
          menorEstoquePossivel = possiveisUnidades;
          componenteLimitante = {
            nome: comp.nome_componente,
            sku: comp.sku_componente,
            estoque: estoqueComponente,
            necessario: quantidadeNecessaria
          };
        }
      }
      
      estoqueDisponivel = menorEstoquePossivel === Infinity ? 0 : menorEstoquePossivel;
    }

    const isExpanded = expandedCards.has(product.id);

    return (
      <Card key={product.id} className="group hover:shadow-lg transition-shadow">
        <CardContent className="p-5">
          <header className="mb-4">
            <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2">{product.nome}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">SKU Pai:</span>
              <Badge variant="outline" className="font-mono text-[11px]">{product.sku_interno}</Badge>
            </div>
          </header>

          <section className="space-y-3">
            {/* Resumo da composição */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Composição</span>
                <span className="text-xs text-muted-foreground">{(composicoes?.length || 0)} componentes</span>
              </div>
              
              {/* Status do estoque */}
              {composicoes && composicoes.length > 0 && (
                <div className="flex items-center gap-2">
                  {componenteLimitante ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-orange-600 cursor-help">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs font-medium">Limitado</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Limitado por {componenteLimitante.nome}: {componenteLimitante.estoque} disponível, precisa {componenteLimitante.necessario}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">Disponível</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resumo da composição */}
            {composicoes && composicoes.length > 0 ? (
              <div className="space-y-3">
                {/* Resumo sempre visível */}
                <div className="bg-muted/30 rounded-lg border p-4 space-y-3">
                  {/* Informações principais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Custo Total</span>
                      <div className="text-sm font-semibold text-[var(--brand-yellow)]">
                        {formatMoney(custoTotal)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Pode Produzir</span>
                      <div className="text-sm font-semibold text-[var(--brand-yellow)]">
                        {estoqueDisponivel} unid.
                      </div>
                    </div>
                  </div>

                  {/* Lista simplificada dos componentes */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Componentes necessários:</div>
                    
                    {/* Cabeçalho das colunas */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[10px] font-medium text-muted-foreground border-b pb-1">
                      <div>SKU</div>
                      <div className="text-right">Custo Uni</div>
                      <div className="text-right">Qtd</div>
                    </div>
                    
                    <div className="space-y-1">
                      {composicoes.map((comp, index) => {
                        const isLimitante = componenteLimitante?.sku === comp.sku_componente;
                        const custoUnitario = custosProdutos[comp.sku_componente] || 0;
                        return (
                          <div 
                            key={index} 
                            className={`grid grid-cols-[1fr_auto_auto] gap-3 items-center text-xs rounded px-2 py-1 ${
                              isLimitante 
                                ? 'bg-destructive/10 border border-destructive/30' 
                                : ''
                            }`}
                          >
                            <div>
                              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5">
                                {comp.sku_componente}
                              </Badge>
                            </div>
                            <div className="text-right text-muted-foreground">
                              {formatMoney(custoUnitario)}
                            </div>
                            <div className="text-right text-muted-foreground">
                              {comp.quantidade}x
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Botões em linha */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion(product.id)}
                    className="flex-1 text-xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Ocultar análise
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Ver análise
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirModalComposicoes(product)}
                    className="flex-1 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                </div>

                {/* Detalhes expandíveis */}
                {isExpanded && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-card border rounded-lg p-4">
                      <div className="text-xs font-medium text-muted-foreground mb-3">Análise detalhada por componente:</div>
                      <div className="space-y-3">
                        {composicoes.map((comp, index) => {
                          const custoUnitario = custosProdutos[comp.sku_componente] || 0;
                          const custoTotalItem = custoUnitario * comp.quantidade;
                          const estoqueComponente = comp.estoque_componente || 0;
                          const possiveisUnidades = Math.floor(estoqueComponente / comp.quantidade);
                          const isLimitante = componenteLimitante?.sku === comp.sku_componente;
                          
                          return (
                            <div key={index} className={`border rounded-md p-3 space-y-2 ${isLimitante ? 'border-destructive/30 bg-destructive/5' : 'border-border'} relative`}>
                              {isLimitante && (
                                <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-md font-medium">
                                  LIMITANTE
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium truncate pr-2">{comp.nome_componente}</div>
                                <Badge variant="outline" className="font-mono text-[10px] truncate flex-shrink-0">
                                  {comp.sku_componente}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-3 text-xs">
                                <div className="text-center space-y-1">
                                  <div className="text-muted-foreground whitespace-nowrap">Necessário</div>
                                  <div className="font-semibold">{comp.quantidade}</div>
                                </div>
                                <div className="text-center space-y-1">
                                  <div className="text-muted-foreground whitespace-nowrap">Estoque</div>
                                  <div className="font-semibold">{estoqueComponente}</div>
                                </div>
                                <div className="text-center space-y-1">
                                  <div className="text-muted-foreground whitespace-nowrap">P/ Fazer</div>
                                  <div className="font-semibold">{possiveisUnidades}</div>
                                </div>
                                <div className="text-center space-y-1">
                                  <div className="text-muted-foreground whitespace-nowrap">Custo Total</div>
                                  <div className="font-semibold">{formatMoney(custoTotalItem)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic border-2 border-dashed border-border rounded-lg p-3 text-center">
                Nenhuma composição cadastrada
                <br />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={() => abrirModalComposicoes(product)}
                >
                  + Adicionar composição
                </Button>
              </div>
            )}

          </section>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Composições de Produtos</h2>
          <div className="text-sm text-muted-foreground">
            Visualize e gerencie os componentes de cada SKU
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setImportModalOpen(true)} 
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDownloadComposicoes} 
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar Dados
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${sidebarCollapsed ? 'lg:grid-cols-[auto_1fr]' : 'lg:grid-cols-4'}`}>
        {/* Filters Sidebar */}
        <div className={sidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-1'}>
          <OptimizedCategorySidebar 
            products={productsForSidebar}
            hierarchicalFilters={hierarchicalFilters}
            onHierarchicalFiltersChange={setHierarchicalFilters}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Products Grid */}
        <div className={sidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}>
          {/* Search Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Produtos com Composições</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={filters?.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10 w-80"
              />
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(renderProductCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Boxes className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou a pesquisa para encontrar produtos.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button 
                variant="outline" 
                disabled={!hasPrevPage}
                onClick={() => updateFilters({ page: filters.page - 1 })}
              >
                Anterior
              </Button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Página {filters.page} de {totalPages}
              </span>
              <Button 
                variant="outline"
                disabled={!hasNextPage}
                onClick={() => updateFilters({ page: filters.page + 1 })}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Composições */}
      <ComposicoesModal
        isOpen={modalOpen}
        onClose={fecharModal}
        produto={produtoSelecionado}
        composicoes={produtoSelecionado ? getComposicoesForSku(produtoSelecionado.sku_interno) : []}
        onSave={handleSalvarComposicoes}
      />

      {/* Modal de Importação */}
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          loadComposicoes();
          setImportModalOpen(false);
        }}
        tipo="composicoes"
      />
    </div>
  );
}