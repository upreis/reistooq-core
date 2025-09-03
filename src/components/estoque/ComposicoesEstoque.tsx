import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Plus, Boxes, Edit, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Upload, Download, Import } from "lucide-react";
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProdutosComposicoes, ProdutoComposicao } from "@/hooks/useProdutosComposicoes";
import { useComposicoesEstoque } from "@/hooks/useComposicoesEstoque";
import { ComposicoesModal } from "./ComposicoesModal";
import { ImportModal } from "./ImportModal";
import { ImportarProdutosModal } from "../composicoes/ImportarProdutosModal";
import { adaptProdutoComposicaoToModalProduct } from "../composicoes/ComposicoesModalAdapter";
import { OptimizedCategorySidebar } from "./OptimizedCategorySidebar";
import { formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/hooks/useProducts";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sortOptions = [
  { id: "newest", name: "Mais Recentes", sortBy: "created_at", sortOrder: "desc" },
  { id: "name", name: "A-Z", sortBy: "nome", sortOrder: "asc" },
  { id: "category", name: "Por Categoria", sortBy: "categoria", sortOrder: "asc" },
];

export function ComposicoesEstoque() {
  const [modalOpen, setModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoComposicao | null>(null);
  const [custosProdutos, setCustosProdutos] = useState<Record<string, number>>({});
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importProdutosModalOpen, setImportProdutosModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isCollapsed: sidebarCollapsed, toggleCollapse: toggleSidebar } = useSidebarCollapse();
  
  // Filtros hierárquicos para o sidebar
  const [hierarchicalFilters, setHierarchicalFilters] = useState<{
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }>({});

  // Hook para categorias hierárquicas
  const { categories, getCategoriasPrincipais } = useHierarchicalCategories();

  // Usar produtos de composições independentes
  const {
    produtos,
    isLoading,
    createProduto,
    updateProduto,
    deleteProduto,
    importarDoEstoque,
    sincronizarComponentes,
    isImporting
  } = useProdutosComposicoes();

  const { getComposicoesForSku, loadComposicoes } = useComposicoesEstoque();

  const abrirModalComposicoes = (produto: ProdutoComposicao) => {
    setProdutoSelecionado(produto);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setProdutoSelecionado(null);
  };

  const handleSalvarComposicoes = () => {
    loadComposicoes(); // Recarrega as composições
    sincronizarComponentes(); // Sincroniza componentes em uso
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
      // Buscar todas as composições da organização com dados dos produtos
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

      // Buscar dados dos produtos para obter categoria principal
      const skusProdutos = Array.from(new Set(composicoesData?.map(comp => comp.sku_produto) || []));
      
      const { data: produtosData } = await supabase
        .from('produtos_composicoes')
        .select('sku_interno, categoria_principal, nome')
        .in('sku_interno', skusProdutos);

      // Criar mapa de produtos para facilitar busca
      const produtosMap = new Map();
      produtosData?.forEach(produto => {
        produtosMap.set(produto.sku_interno, produto);
      });

      // Criar template vazio com estrutura para 10 componentes
      const templateData = [{
        'Produto': '',
        'SKU Pai': '',
        'Categoria Principal': '',
        'SKU do Componente 1': '',
        'Nome do Componente 1': '',
        'Quantidade 1': '',
        'Un medida 1': '',
        'SKU do Componente 2': '',
        'Nome do Componente 2': '',
        'Quantidade 2': '',
        'Un medida 2': '',
        'SKU do Componente 3': '',
        'Nome do Componente 3': '',
        'Quantidade 3': '',
        'Un medida 3': '',
        'SKU do Componente 4': '',
        'Nome do Componente 4': '',
        'Quantidade 4': '',
        'Un medida 4': '',
        'SKU do Componente 5': '',
        'Nome do Componente 5': '',
        'Quantidade 5': '',
        'Un medida 5': '',
        'SKU do Componente 6': '',
        'Nome do Componente 6': '',
        'Quantidade 6': '',
        'Un medida 6': '',
        'SKU do Componente 7': '',
        'Nome do Componente 7': '',
        'Quantidade 7': '',
        'Un medida 7': '',
        'SKU do Componente 8': '',
        'Nome do Componente 8': '',
        'Quantidade 8': '',
        'Un medida 8': '',
        'SKU do Componente 9': '',
        'Nome do Componente 9': '',
        'Quantidade 9': '',
        'Un medida 9': '',
        'SKU do Componente 10': '',
        'Nome do Componente 10': '',
        'Quantidade 10': '',
        'Un medida 10': ''
      }];

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Composições');
      
      // Baixar o arquivo
      const fileName = `template_composicoes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      console.log(`Template baixado: ${fileName}`);
    } catch (error) {
      console.error('Erro ao baixar template das composições:', error);
    }
  };

  // Preparar produtos para o sidebar (converter para formato Product)
  const productsForSidebar: Product[] = useMemo(() => {
    return produtos?.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      sku_interno: produto.sku_interno,
      categoria_principal: produto.categoria_principal || '',
      categoria: produto.categoria || '',
      subcategoria: produto.subcategoria || '',
      preco_venda: produto.preco_venda,
      quantidade_atual: produto.quantidade_atual,
      estoque_minimo: produto.estoque_minimo,
      ativo: produto.ativo,
      organization_id: produto.organization_id,
      created_at: produto.created_at,
      updated_at: produto.updated_at,
      unidade_medida: 'un',
      unidade_medida_id: null,
      codigo_barras: null,
      descricao: null,
      preco_custo: 0,
      estoque_maximo: null,
      localizacao: null,
      fornecedor: null,
      data_validade: null,
      lote: null,
      ncm: null,
      cest: null,
      status: 'ativo',
      url_imagem: null,
      ultima_movimentacao: null,
      integration_account_id: null
    })) || [];
  }, [produtos]);

  // Filtrar produtos baseado na busca e filtros hierárquicos
  const produtosFiltrados = useMemo(() => {
    return produtos?.filter(produto => {
      const matchesSearch = !searchQuery || 
        produto.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        produto.sku_interno.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !hierarchicalFilters.categoriaPrincipal || 
        produto.categoria_principal === hierarchicalFilters.categoriaPrincipal ||
        produto.categoria === hierarchicalFilters.categoria ||
        produto.subcategoria === hierarchicalFilters.subcategoria;

      return matchesSearch && matchesCategory;
    }) || [];
  }, [produtos, searchQuery, hierarchicalFilters]);

  // Carregar custos dos produtos quando as composições mudarem
  useEffect(() => {
    const carregarCustos = async () => {
      if (!produtosFiltrados || produtosFiltrados.length === 0) return;
      
      try {
        const skusUnicos = Array.from(new Set(
          produtosFiltrados.flatMap(p => {
            const comps = getComposicoesForSku(p.sku_interno);
            return comps?.map(c => c.sku_componente) || [];
          })
        ));

        if (skusUnicos.length === 0) return;

        const { data: produtosCusto } = await supabase
          .from('produtos')
          .select('sku_interno, preco_custo')
          .in('sku_interno', skusUnicos as string[]);

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
  }, [produtosFiltrados, getComposicoesForSku]);

  const renderProductCard = (product: ProdutoComposicao) => {
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
          <h1 className="text-2xl font-semibold text-foreground">Composições de Produtos</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>🏠</span>
            <span>/</span>
            <span>Estoque</span>
            <span>/</span>
            <span className="text-primary">Composições</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setImportProdutosModalOpen(true)}
            className="gap-2"
          >
            <Import className="w-4 h-4" />
            Importar do Estoque
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar Excel
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

      {/* Layout principal com sidebar e conteúdo */}
      <div className="flex gap-4">
        {/* Sidebar de categorias - responsivo */}
        <div className={cn(
          "transition-all duration-300 flex-shrink-0",
          sidebarCollapsed ? "w-12" : "w-64"
        )}>
          <div className="sticky top-6">
            <OptimizedCategorySidebar 
              products={productsForSidebar}
              hierarchicalFilters={hierarchicalFilters}
              onHierarchicalFiltersChange={setHierarchicalFilters}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
            />
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Pesquisa */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Produtos de Composições</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>

          {/* Grid de produtos */}
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
          ) : produtosFiltrados && produtosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {produtosFiltrados.map(renderProductCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Boxes className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || Object.values(hierarchicalFilters).some(Boolean) 
                  ? 'Tente ajustar os filtros ou a pesquisa.' 
                  : 'Comece importando produtos do controle de estoque.'}
              </p>
              <Button onClick={() => setImportProdutosModalOpen(true)} className="gap-2">
                <Import className="h-4 w-4" />
                Importar Produtos do Estoque
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Composições */}
      <ComposicoesModal
        isOpen={modalOpen}
        onClose={fecharModal}
        produto={produtoSelecionado ? adaptProdutoComposicaoToModalProduct(produtoSelecionado) : null}
        composicoes={produtoSelecionado ? getComposicoesForSku(produtoSelecionado.sku_interno) : []}
        onSave={handleSalvarComposicoes}
      />

      {/* Modal de Importação de Excel */}
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          loadComposicoes();
          setImportModalOpen(false);
        }}
        tipo="composicoes"
      />

      {/* Modal de Importação de Produtos do Estoque */}
      <ImportarProdutosModal
        open={importProdutosModalOpen}
        onOpenChange={setImportProdutosModalOpen}
        onImportar={importarDoEstoque}
        isImporting={isImporting}
      />
    </div>
  );
}