import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Package, Plus, Boxes, Edit, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Upload, Download, Import, Trash2, MoreHorizontal, Filter } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProdutosComposicoes, ProdutoComposicao } from "@/hooks/useProdutosComposicoes";
import { useComposicoesEstoque } from "@/hooks/useComposicoesEstoque";
import { useComposicoesSelection } from "@/features/estoque/hooks/useComposicoesSelection";
import { ComposicoesModal } from "./ComposicoesModal";
import { ImportModal } from "./ImportModal";
import { ImportarProdutosModal } from "../composicoes/ImportarProdutosModal";
import { adaptProdutoComposicaoToModalProduct } from "../composicoes/ComposicoesModalAdapter";
import { ProductModal } from "./ProductModal";
import { ComposicoesCategorySidebar } from "./ComposicoesCategorySidebar";
import { ComposicoesFilters } from "./ComposicoesFilters";
import { useComposicoesFilters } from "@/features/estoque/hooks/useComposicoesFilters";
import { formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Product, useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [skuParaCadastro, setSkuParaCadastro] = useState<string>("");
  const { isCollapsed: sidebarCollapsed, toggleCollapse: toggleSidebar } = useSidebarCollapse();
  
  // Filtros hierárquicos para o sidebar
  const [hierarchicalFilters, setHierarchicalFilters] = useState<{
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }>({});

  // Hook para categorias hierárquicas
  const { categories, getCategoriasPrincipais } = useHierarchicalCategories();

  // Hook para seleção de itens
  const {
    selectedItems,
    isSelectMode,
    toggleSelectMode,
    selectItem,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedItems,
    selectedCount
  } = useComposicoesSelection();

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

  const { getComposicoesForSku, loadComposicoes, composicoes } = useComposicoesEstoque();

  // Hook para produtos do controle de estoque (para criar novos produtos)
  const { createProduct } = useProducts();

  // Hook para filtros inteligentes
  const { filters, setFilters, filteredData, stats } = useComposicoesFilters(produtos, composicoes, custosProdutos);

  // Sincronizar composições quando produtos carregarem
  useEffect(() => {
    if (produtos && produtos.length > 0) {
      loadComposicoes();
    }
  }, [produtos, loadComposicoes]);

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
      // Usar os dados filtrados que já estão sendo exibidos na página
      if (!produtosFinaisFiltrados || produtosFinaisFiltrados.length === 0) {
        toast.error('Nenhum produto de composição disponível para download');
        return;
      }

      // Preparar dados exatamente no template de composições (uma linha por produto)
      const headers: string[] = [
        'Produto',
        'SKU Pai',
        'Categoria Principal',
        // Componentes 1..10 (SKU, Nome, quantidade, Uni medida)
        ...Array.from({ length: 10 }).flatMap((_, i) => [
          `SKU do componente ${i + 1}`,
          `Nome do Componente ${i + 1}`,
          `quantidade ${i + 1}`,
          `Uni medida ${i + 1}`,
        ]),
      ];

      const rows: (string | number)[][] = [];

      for (const produto of produtosFinaisFiltrados) {
        const row: (string | number)[] = Array(headers.length).fill('');
        // Cabeçalho principal
        row[0] = produto.nome;
        row[1] = produto.sku_interno; // SKU Pai
        row[2] = produto.categoria_principal || '';

        // Preencher componentes na ordem
        const composicoesProduto = getComposicoesForSku(produto.sku_interno) || [];
        for (let i = 0; i < 10; i++) {
          const comp = composicoesProduto[i];
          const baseIndex = 3 + i * 4; // início do bloco do componente i
          if (comp) {
            const componenteNaoExiste = comp.nome_componente === comp.sku_componente;
            row[baseIndex + 0] = comp.sku_componente || '';
            row[baseIndex + 1] = componenteNaoExiste ? 'NÃO CADASTRADO' : (comp.nome_componente || '');
            row[baseIndex + 2] = comp.quantidade ?? '';
            row[baseIndex + 3] = comp.unidade_medida_id || '';
          } else {
            // deixa em branco quando não há componente
            row[baseIndex + 0] = '';
            row[baseIndex + 1] = '';
            row[baseIndex + 2] = '';
            row[baseIndex + 3] = '';
          }
        }

        rows.push(row);
      }

      // Criar workbook e worksheet no formato do template
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ...rows,
      ]);

      // Larguras básicas para melhor leitura
      ws['!cols'] = [
        { wpx: 240 }, // Produto
        { wpx: 140 }, // SKU Pai
        { wpx: 160 }, // Categoria Principal
        ...Array.from({ length: 10 }).flatMap(() => ([
          { wpx: 140 }, // SKU do componente
          { wpx: 200 }, // Nome do componente
          { wpx: 100 }, // quantidade
          { wpx: 120 }, // Uni medida
        ])),
      ];

      // Adicionar worksheet ao workbook com o nome do template
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      // Nome do arquivo específico para composições
      const dataAtual = new Date().toISOString().split('T')[0];
      const totalProdutos = produtosFinaisFiltrados.length;
      const fileName = `produtos_composicoes_${totalProdutos}itens_${dataAtual}.xlsx`;
      
      // Baixar o arquivo
      XLSX.writeFile(wb, fileName);
      
      // Feedback de sucesso
      toast.success(`Dados das composições baixados com sucesso! (${totalProdutos} produtos)`);
      console.log(`Dados dos produtos de composição baixados: ${fileName}`);
      console.log(`Total de produtos exportados: ${totalProdutos}`);
      
    } catch (error) {
      console.error('Erro ao baixar dados das composições:', error);
      toast.error('Erro ao baixar dados das composições');
    }
  };


  // Aplicar filtro de busca aos dados já filtrados pelo hook
  const produtosFinaisFiltrados = useMemo(() => {
    return filteredData?.filter(produto => {
      const matchesSearch = !searchQuery || 
        produto.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        produto.sku_interno.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !hierarchicalFilters.categoriaPrincipal || 
        produto.categoria_principal === hierarchicalFilters.categoriaPrincipal ||
        produto.categoria === hierarchicalFilters.categoria ||
        produto.subcategoria === hierarchicalFilters.subcategoria;

      return matchesSearch && matchesCategory;
    }) || [];
  }, [filteredData, searchQuery, hierarchicalFilters]);

  // Carregar custos dos produtos quando as composições mudarem
  useEffect(() => {
    const carregarCustos = async () => {
      if (!produtosFinaisFiltrados || produtosFinaisFiltrados.length === 0) return;
      
      try {
        const skusUnicos = Array.from(new Set(
          produtosFinaisFiltrados.flatMap(p => {
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
  }, [produtosFinaisFiltrados, getComposicoesForSku]);

  // Funções para lidar com seleção
  const handleDeleteSelected = async () => {
    const selectedProducts = getSelectedItems(produtosFinaisFiltrados);
    if (selectedProducts.length === 0) return;

    try {
      for (const produto of selectedProducts) {
        deleteProduto(produto.id);
      }
      clearSelection();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
    }
  };

  // Funções para cadastro de novos produtos
  const abrirModalCadastroProduto = (sku: string) => {
    setSkuParaCadastro(sku);
    setProductModalOpen(true);
  };

  const handleSuccessProduct = () => {
    setProductModalOpen(false);
    setSkuParaCadastro("");
    // Recarregar composições para atualizar dados
    loadComposicoes();
    sincronizarComponentes();
  };

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
    const itemSelected = isSelected(product.id);

    return (
      <Card key={product.id} className={cn(
        "group hover:shadow-xl transition-all duration-300",
        itemSelected && "ring-2 ring-primary border-primary/50 bg-primary/5"
      )}>
        <CardContent className="p-3 md:p-6">
          <header className="mb-5">
            <h3 className="font-semibold text-lg text-foreground leading-snug line-clamp-2 mb-2">{product.nome}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">SKU:</span>
              <Badge variant="outline" className="font-mono text-xs px-2 py-1">{product.sku_interno}</Badge>
            </div>
          </header>

          <section className="space-y-4">
            {/* Resumo da composição com melhor layout */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Boxes className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Composição</span>
                  <p className="text-xs text-muted-foreground">{(composicoes?.length || 0)} componentes</p>
                </div>
              </div>
              
              {/* Status do estoque melhorado */}
              {composicoes && composicoes.length > 0 && (
                <div className="flex items-center gap-2">
                  {componenteLimitante ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 text-orange-600 cursor-help p-2 rounded-md bg-orange-50">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">{estoqueDisponivel}</span>
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
                    <div className="flex items-center gap-2 text-green-600 p-2 rounded-md bg-green-50">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Disponível</span>
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
                        // Verifica se o componente não existe no controle de estoque
                        const componenteNaoExiste = comp.nome_componente === comp.sku_componente;
                        
                        return (
                          <div key={index} className="relative">
                            {/* Badge "NÃO CADASTRADO" no canto superior */}
                            <div 
                              className={`grid grid-cols-[1fr_auto_auto] gap-3 items-center text-xs rounded px-2 py-1 ${
                                componenteNaoExiste
                                  ? 'bg-destructive text-destructive-foreground border border-destructive'
                                  : isLimitante 
                                  ? 'bg-destructive/10 border border-destructive/30' 
                                  : ''
                              }`}
                            >
                              {componenteNaoExiste ? (
                                <div className="col-span-3 flex items-center justify-between gap-2">
                                  <Badge variant="outline" className="border-destructive-foreground text-destructive-foreground font-mono text-[11px] px-1.5 py-0.5 flex-shrink-0">
                                    {comp.sku_componente}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => abrirModalCadastroProduto(comp.sku_componente)}
                                    className="h-5 px-2 text-[10px] bg-background/80 hover:bg-background border-primary/50 text-primary hover:text-primary ml-auto"
                                  >
                                    <Plus className="h-2.5 w-2.5 mr-1" />
                                    Cadastrar
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1">
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
                                </>
                              )}
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
                          // Verifica se o componente não existe no controle de estoque
                          const componenteNaoExiste = comp.nome_componente === comp.sku_componente;
                          
                          return (
                            <div key={index} className={`border rounded-md p-3 space-y-2 ${
                              componenteNaoExiste 
                                ? 'border-destructive bg-destructive/10'
                                : isLimitante 
                                ? 'border-destructive/30 bg-destructive/5' 
                                : 'border-border'
                            } relative`}>
                              {false ? (
                                <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-md font-medium">
                                  NÃO CADASTRADO
                                </div>
                              ) : isLimitante && (
                                <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-md font-medium">
                                  LIMITANTE
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium truncate pr-2">
                                  {componenteNaoExiste ? comp.sku_componente : comp.nome_componente}
                                </div>
                                <Badge variant="outline" className={`font-mono text-[10px] truncate flex-shrink-0 ${
                                  componenteNaoExiste ? 'border-destructive text-destructive' : ''
                                }`}>
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
                              
                              {/* Botão de cadastro para componentes não cadastrados */}
                              {componenteNaoExiste && (
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => abrirModalCadastroProduto(comp.sku_componente)}
                                    className="w-full text-xs bg-background/80 hover:bg-background border-primary/50 text-primary hover:text-primary"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Cadastrar Produto
                                  </Button>
                                </div>
                              )}
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
    <div className="space-y-8">
      {/* Header moderno melhorado - oculto no mobile */}
      <div className="hidden md:block relative overflow-hidden bg-gradient-to-r from-primary/2 via-primary/4 to-primary/2 border border-border/30 rounded-xl p-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>🏠</span>
              <span>/</span>
              <span>Estoque</span>
              <span>/</span>
              <span className="text-primary font-medium">Composições</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Composições de Produtos</h1>
              <p className="text-muted-foreground max-w-2xl">
                Gerencie as composições dos seus produtos, defina componentes e monitore custos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Button
              variant="outline"
              onClick={() => setImportProdutosModalOpen(true)}
              className="gap-2 bg-background/60 backdrop-blur-sm border-border/60"
            >
              <Import className="w-4 h-4" />
              Importar do Estoque
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="gap-2 bg-background/60 backdrop-blur-sm border-border/60"
            >
              <Upload className="w-4 h-4" />
              Importar Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadComposicoes}
              className="gap-2 bg-background/60 backdrop-blur-sm border-border/60"
            >
              <Download className="w-4 h-4" />
              Baixar Dados
            </Button>
          </div>
        </div>
      </div>

      {/* Layout principal com sidebar e conteúdo */}
      <div className="flex gap-6 relative">
        {/* Sidebar de categorias - responsivo - oculto no mobile, overlay quando aberto */}
        <div className={cn(
          "transition-all duration-300 flex-shrink-0",
          "hidden md:block", // Sempre oculto no mobile por padrão
          sidebarCollapsed ? "md:w-12" : "md:w-72"
        )}>
          <div className="sticky top-6">
            <ComposicoesCategorySidebar 
              produtos={produtos || []}
              hierarchicalFilters={hierarchicalFilters}
              onHierarchicalFiltersChange={setHierarchicalFilters}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={toggleSidebar}
            />
          </div>
        </div>

        {/* Sidebar mobile overlay */}
        {!sidebarCollapsed && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
            <div className="absolute left-0 top-0 h-full w-72 bg-background border-r border-border shadow-xl">
              <div className="p-6">
                <ComposicoesCategorySidebar 
                  produtos={produtos || []}
                  hierarchicalFilters={hierarchicalFilters}
                  onHierarchicalFiltersChange={setHierarchicalFilters}
                  isCollapsed={false}
                  onToggleCollapse={toggleSidebar}
                />
              </div>
            </div>
            {/* Área para fechar clicando fora */}
            <div 
              className="absolute inset-0" 
              onClick={toggleSidebar}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-6">
          {/* Filtros Inteligentes - ocultos no mobile */}
          <div className="hidden md:block">
            <ComposicoesFilters 
              filters={filters}
              onFiltersChange={setFilters}
              stats={stats}
            />
          </div>

          {/* Busca e Filtros - layout mobile igual ao controle de estoque */}
          <div className="flex gap-2 md:flex-1">
            {/* Busca - mais compacta no mobile */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/60 border-border/60 h-9 md:h-10 text-sm"
                />
              </div>
            </div>
            
            {/* Filtros - ao lado da busca no mobile */}
            <div className="w-auto md:w-auto">
              <Button
                variant="outline" 
                className="bg-background/60 border-border/60 flex-shrink-0 h-9 md:h-10 text-sm px-3 gap-2"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline">Filtros</span>
              </Button>
            </div>

            {/* Botão de categorias no mobile */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden bg-background/60 border-border/60 flex-shrink-0 h-9"
              onClick={toggleSidebar}
            >
              <Package className="h-4 w-4" />
            </Button>
          </div>

          {/* Header da seção - apenas para desktop */}
          <Card className="hidden md:block border-border/40 bg-card/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">Produtos de Composições</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredData?.length || 0} produtos encontrados
                      {isSelectMode && selectedCount > 0 && (
                        <span className="ml-2 text-primary font-medium">
                          • {selectedCount} selecionado(s)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Controles de seleção - apenas desktop */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isSelectMode ? "default" : "outline"}
                      size="sm"
                      onClick={toggleSelectMode}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isSelectMode ? "Cancelar" : "Selecionar"}
                    </Button>
                    
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={produtosFinaisFiltrados.length > 0 && selectedCount === produtosFinaisFiltrados.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAll(produtosFinaisFiltrados);
                            } else {
                              clearSelection();
                            }
                          }}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-sm text-muted-foreground">Todos</span>
                      </div>
                      {selectedCount > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <MoreHorizontal className="h-4 w-4" />
                              Ações ({selectedCount})
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                           <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                             <AlertDialogTrigger asChild>
                               <DropdownMenuItem 
                                 onSelect={(e) => e.preventDefault()}
                                 className="text-destructive focus:text-destructive"
                               >
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Excluir Selecionados
                               </DropdownMenuItem>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Tem certeza que deseja excluir {selectedCount} produto(s)? Esta ação não pode ser desfeita.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                 <AlertDialogAction 
                                   onClick={handleDeleteSelected}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   Excluir
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/60 border-border/60"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de produtos com melhor espaçamento - lista completa no mobile */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-border/40">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-24 bg-muted rounded" />
                    <div className="flex gap-2">
                      <div className="h-8 bg-muted rounded flex-1" />
                      <div className="h-8 bg-muted rounded w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : produtosFinaisFiltrados && produtosFinaisFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
              {produtosFinaisFiltrados.map(renderProductCard)}
            </div>
          ) : (
            <Card className="border-border/40 bg-card/20">
              <CardContent className="text-center py-16">
                <Boxes className="h-16 w-16 text-muted-foreground/40 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery || Object.values(hierarchicalFilters).some(Boolean) 
                    ? 'Tente ajustar os filtros ou termo de pesquisa para encontrar produtos.' 
                    : 'Comece importando produtos do controle de estoque para criar composições.'}
                </p>
                <Button 
                  onClick={() => setImportProdutosModalOpen(true)} 
                  className="gap-2 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Import className="h-5 w-5" />
                  Importar Produtos do Estoque
                </Button>
              </CardContent>
            </Card>
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

      {/* Modal de Cadastro de Produto */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        initialSku={skuParaCadastro}
        onSuccess={handleSuccessProduct}
      />
    </div>
  );
}