import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Package, Plus, Boxes, Edit, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Upload, Download, Import, Trash2, MoreHorizontal, Filter, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProdutosComposicoes, ProdutoComposicao } from "@/hooks/useProdutosComposicoes";
import { useComposicoesEstoque } from "@/hooks/useComposicoesEstoque";
import { useComposicoesLocalVenda } from "@/hooks/useComposicoesLocalVenda";
import { useComposicoesSelection } from "@/features/estoque/hooks/useComposicoesSelection";
import { ComposicoesModal } from "./ComposicoesModal";
import { ImportModal } from "./ImportModal";
import { ImportarProdutosModal } from "../composicoes/ImportarProdutosModal";
import { adaptProdutoComposicaoToModalProduct } from "../composicoes/ComposicoesModalAdapter";
import { ProductModal } from "./ProductModal";

import { ComposicoesFilters } from "./ComposicoesFilters";
import { useComposicoesFilters } from "@/features/estoque/hooks/useComposicoesFilters";
import { formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Product, useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const sortOptions = [
  { id: "newest", name: "Mais Recentes", sortBy: "created_at", sortOrder: "desc" },
  { id: "name", name: "A-Z", sortBy: "nome", sortOrder: "asc" },
  { id: "category", name: "Por Categoria", sortBy: "categoria", sortOrder: "asc" },
];

export function ComposicoesEstoque({ localId, localVendaId }: { localId?: string; localVendaId?: string }) {
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

  // Usar produtos de composições GLOBAIS (independente de local de venda)
  const {
    produtos,
    isLoading,
    createProduto,
    createProdutoAsync,
    updateProduto,
    deleteProduto,
    importarDoEstoque,
    sincronizarComponentes,
    isImporting,
    refetch: refetchProdutos
  } = useProdutosComposicoes();

  // Hook para composições de estoque (local de estoque)
  const composicoesEstoqueHook = useComposicoesEstoque(localId);
  
  // Hook para composições de local de venda
  const composicoesVendaHook = useComposicoesLocalVenda(localVendaId);

  // Na página /estoque/composicoes, somente usar composicoes_local_venda
  // NÃO usar fallback para composicoes_insumos (essas são da página /estoque/insumos)
  const isLocalVendaMode = !!localVendaId;
  
  // Sempre usar composições do local de venda nesta página
  // Se não há local de venda, composições ficam vazias (objeto vazio para manter tipo)
  const composicoesAtuais = isLocalVendaMode 
    ? composicoesVendaHook.composicoes 
    : ({} as typeof composicoesVendaHook.composicoes);
  
  const getComposicoesForSku = isLocalVendaMode 
    ? composicoesVendaHook.getComposicoesForSku 
    : () => [];
    
  const loadComposicoes = isLocalVendaMode 
    ? composicoesVendaHook.loadComposicoes 
    : async () => {};

  // Hook para produtos do controle de estoque (para criar novos produtos)
  const { createProduct } = useProducts();

  // Hook para filtros inteligentes
  const { filters, setFilters, filteredData, stats } = useComposicoesFilters(produtos, composicoesAtuais, custosProdutos);

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

  const handleSalvarComposicoes = async () => {
    await loadComposicoes(); // Recarrega as composições
    await refetchProdutos(); // Recarrega a lista de produtos para mostrar novos itens
    sincronizarComponentes(); // Sincroniza componentes em uso
  };

  const limparComposicoesOrfas = async () => {
    try {
      // 1. Buscar todos os SKUs de produtos_composicoes
      const { data: produtosComposicoes, error: prodError } = await supabase
        .from('produtos_composicoes')
        .select('sku_interno');

      if (prodError) throw prodError;

      const skusValidos = new Set(produtosComposicoes?.map(p => p.sku_interno) || []);
      console.log(`✅ SKUs válidos em produtos_composicoes: ${skusValidos.size}`);

      // 2. Buscar todos os componentes
      const { data: componentes, error: compError } = await supabase
        .from('produto_componentes')
        .select('sku_produto, sku_componente');

      if (compError) throw compError;

      // 3. Identificar órfãos (componentes cujo sku_produto NÃO existe em produtos_composicoes)
      const orfas = componentes?.filter(c => !skusValidos.has(c.sku_produto)) || [];

      if (orfas.length === 0) {
        toast.success('✅ Não há composições órfãs para limpar');
        return;
      }

      console.log(`🗑️ Encontradas ${orfas.length} composições órfãs:`, orfas);

      // 4. Deletar composições órfãs
      const skusProdutosOrfaos = [...new Set(orfas.map(o => o.sku_produto))];
      
      const { error: deleteError } = await supabase
        .from('produto_componentes')
        .delete()
        .in('sku_produto', skusProdutosOrfaos);

      if (deleteError) throw deleteError;

      toast.success(`🗑️ ${orfas.length} composição(ões) órfã(s) removida(s) com sucesso!`);
      
      // Recarregar dados
      loadComposicoes();
      sincronizarComponentes();
    } catch (error) {
      console.error('❌ Erro ao limpar composições órfãs:', error);
      toast.error('Erro ao limpar composições órfãs');
    }
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
    const produtosBase = filteredData || [];

    return produtosBase.filter(produto => {
      const matchesSearch =
        !searchQuery ||
        produto.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        produto.sku_interno.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !hierarchicalFilters.categoriaPrincipal ||
        produto.categoria_principal === hierarchicalFilters.categoriaPrincipal ||
        produto.categoria === hierarchicalFilters.categoria ||
        produto.subcategoria === hierarchicalFilters.subcategoria;

      return matchesSearch && matchesCategory;
    });
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
        await deleteProduto(produto.id);
      }
      clearSelection();
      toggleSelectMode(); // Sair do modo de seleção
      toast.success(`${selectedProducts.length} produto(s) excluído(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      toast.error('Erro ao excluir produtos selecionados');
    }
  };

  const handleBulkStatusChange = async (newStatus: boolean) => {
    const selectedProducts = getSelectedItems(produtosFinaisFiltrados);
    if (selectedProducts.length === 0) return;

    try {
      for (const produto of selectedProducts) {
        await updateProduto({ id: produto.id, ativo: newStatus });
      }
      clearSelection();
      toggleSelectMode();
      toast.success(`${selectedProducts.length} produto(s) ${newStatus ? 'ativado(s)' : 'desativado(s)'} com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status dos produtos');
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
        "group hover:shadow-lg transition-all duration-300 relative",
        itemSelected && "ring-2 ring-primary border-primary/50 bg-primary/5"
      )}>
        <CardContent className="p-2.5">
          {/* Checkbox de seleção */}
          {isSelectMode && (
            <div className="absolute top-2 right-2 z-10">
              <Checkbox
                checked={itemSelected}
                onCheckedChange={() => selectItem(product.id)}
                className="h-4 w-4"
              />
            </div>
          )}
          
          <header className="mb-3">
            <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-1.5 pr-6">{product.nome}</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">SKU:</span>
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5 h-5">{product.sku_interno}</Badge>
            </div>
          </header>

          <section className="space-y-2.5">
            {/* Resumo da composição com melhor layout */}
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10">
                  <Boxes className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-medium text-foreground">Composição</span>
                  <p className="text-[10px] text-muted-foreground">{(composicoes?.length || 0)} componentes</p>
                </div>
              </div>
              
              {/* Status do estoque melhorado */}
              {composicoes && composicoes.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {componenteLimitante ? (
                    <div className="flex items-center gap-1 text-orange-600 cursor-help px-1.5 py-1 rounded bg-orange-50" title={`Limitado por ${componenteLimitante.nome}: ${componenteLimitante.estoque} disponível, precisa ${componenteLimitante.necessario}`}>
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-medium">{estoqueDisponivel}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-green-600 px-1.5 py-1 rounded bg-green-50">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">OK</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resumo da composição */}
            {composicoes && composicoes.length > 0 ? (
              <div className="space-y-2">
                {/* Resumo sempre visível */}
                <div className="bg-muted/30 rounded-md border p-2.5 space-y-2">
                  {/* Informações principais */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground">Custo Total</span>
                      <div className="text-xs font-semibold text-[var(--brand-yellow)] break-words">
                        {formatMoney(custoTotal)}
                      </div>
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground">Pode Produzir</span>
                      <div className="text-xs font-semibold text-[var(--brand-yellow)] break-words">
                        {estoqueDisponivel} unid.
                      </div>
                    </div>
                  </div>

                  {/* Lista simplificada dos componentes */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-medium text-muted-foreground">Componentes necessários:</div>
                    
                    {/* Cabeçalho das colunas */}
                    <div className="grid grid-cols-[1fr_50px_40px_60px_32px] gap-2 text-[9px] font-medium text-muted-foreground border-b pb-1">
                      <div className="truncate">SKU</div>
                      <div className="text-center">Estoque</div>
                      <div className="text-center">Faz</div>
                      <div className="text-center">Custo Uni</div>
                      <div className="text-center">Qtd</div>
                    </div>
                    
                    <div className="space-y-0.5">
                      {composicoes.map((comp, index) => {
                        const isLimitante = componenteLimitante?.sku === comp.sku_componente;
                        const custoUnitario = custosProdutos[comp.sku_componente] || 0;
                        // Verifica se o componente não existe no controle de estoque
                        const componenteNaoExiste = comp.nome_componente === comp.sku_componente;
                        
                        return (
                          <div key={index} className="relative">
                            {/* Badge "NÃO CADASTRADO" no canto superior */}
                            <div 
                              className={`grid grid-cols-[1fr_50px_40px_60px_32px] gap-2 items-center text-[10px] rounded px-1.5 py-0.5 min-w-0 ${
                                componenteNaoExiste
                                  ? 'bg-destructive text-destructive-foreground border border-destructive'
                                  : isLimitante 
                                  ? 'bg-destructive/10 border border-destructive/30' 
                                  : ''
                              }`}
                            >
                              {componenteNaoExiste ? (
                                <div className="col-span-5 flex items-center justify-between gap-1.5 min-w-0">
                                  <Badge variant="outline" className="border-destructive-foreground text-destructive-foreground font-mono text-[9px] px-1 py-0 flex-shrink-0 truncate max-w-[70px]">
                                    {comp.sku_componente}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    onClick={() => abrirModalCadastroProduto(comp.sku_componente)}
                                    className="h-4 px-1.5 text-[8px] bg-background/80 hover:bg-background border-primary/50 text-primary hover:text-primary flex-shrink-0"
                                  >
                                    <Plus className="h-2 w-2 mr-0.5" />
                                    Cadastrar
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-0.5 min-w-0">
                                    <Badge variant="outline" className="font-mono text-[8px] px-1 py-0 truncate max-w-full h-4">
                                      {comp.sku_componente}
                                    </Badge>
                                  </div>
                                  <div className="text-center text-muted-foreground text-[9px]">
                                    {comp.estoque_componente || 0}
                                  </div>
                                  <div className="text-center text-muted-foreground text-[9px]">
                                    {Math.floor((comp.estoque_componente || 0) / comp.quantidade)}
                                  </div>
                                  <div className="text-center text-muted-foreground text-[9px]">
                                    {formatMoney(custoUnitario)}
                                  </div>
                                  <div className="text-center text-muted-foreground text-[9px]">
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
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    onClick={() => toggleCardExpansion(product.id)}
                    className="flex-1 h-6 text-[10px] px-2"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-2.5 w-2.5 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-2.5 w-2.5 mr-1" />
                        Ver análise
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => abrirModalComposicoes(product)}
                    className="flex-1 h-6 text-[10px] px-2"
                  >
                    <Edit className="h-2.5 w-2.5 mr-1" />
                    Editar
                  </Button>
                </div>

                {/* Detalhes expandíveis */}
                {isExpanded && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-card border rounded-md p-2.5">
                      <div className="text-[10px] font-medium text-muted-foreground mb-2">Análise detalhada:</div>
                      <div className="space-y-2">
                        {composicoes.map((comp, index) => {
                          const custoUnitario = custosProdutos[comp.sku_componente] || 0;
                          const custoTotalItem = custoUnitario * comp.quantidade;
                          const estoqueComponente = comp.estoque_componente || 0;
                          const possiveisUnidades = Math.floor(estoqueComponente / comp.quantidade);
                          const isLimitante = componenteLimitante?.sku === comp.sku_componente;
                          // Verifica se o componente não existe no controle de estoque
                          const componenteNaoExiste = comp.nome_componente === comp.sku_componente;
                          
                          return (
                            <div key={index} className={`border rounded px-2 py-1.5 space-y-1.5 ${
                              componenteNaoExiste 
                                ? 'border-destructive bg-destructive/10'
                                : isLimitante 
                                ? 'border-destructive/30 bg-destructive/5' 
                                : 'border-border'
                            } relative`}>
                              {false ? (
                                <div className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[8px] px-1.5 py-0.5 rounded font-medium">
                                  NÃO CADASTRADO
                                </div>
                              ) : isLimitante && (
                                <div className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[8px] px-1.5 py-0.5 rounded font-medium">
                                  LIMITANTE
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-medium truncate pr-2">
                                  {componenteNaoExiste ? comp.sku_componente : comp.nome_componente}
                                </div>
                                <Badge variant="outline" className={`font-mono text-[8px] truncate flex-shrink-0 h-4 ${
                                  componenteNaoExiste ? 'border-destructive text-destructive' : ''
                                }`}>
                                  {comp.sku_componente}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 text-[10px]">
                                <div className="text-center space-y-0.5">
                                  <div className="text-muted-foreground whitespace-nowrap">Necessário</div>
                                  <div className="font-semibold">{comp.quantidade}</div>
                                </div>
                                <div className="text-center space-y-0.5">
                                  <div className="text-muted-foreground whitespace-nowrap">Estoque</div>
                                  <div className="font-semibold">{estoqueComponente}</div>
                                </div>
                                <div className="text-center space-y-0.5">
                                  <div className="text-muted-foreground whitespace-nowrap">P/ Fazer</div>
                                  <div className="font-semibold">{possiveisUnidades}</div>
                                </div>
                                <div className="text-center space-y-0.5">
                                  <div className="text-muted-foreground whitespace-nowrap">Custo</div>
                                  <div className="font-semibold">{formatMoney(custoTotalItem)}</div>
                                </div>
                              </div>
                              
                              {/* Botão de cadastro para componentes não cadastrados */}
                              {componenteNaoExiste && (
                                <div className="mt-1.5">
                                  <Button
                                    variant="outline"
                                    onClick={() => abrirModalCadastroProduto(comp.sku_componente)}
                                    className="w-full h-5 text-[9px] bg-background/80 hover:bg-background border-primary/50 text-primary hover:text-primary"
                                  >
                                    <Plus className="h-2.5 w-2.5 mr-1" />
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
              <div className="text-[10px] text-muted-foreground italic border border-dashed border-border rounded px-2 py-2 text-center">
                Nenhuma composição cadastrada
                <br />
                <Button 
                  variant="ghost" 
                  className="mt-1 h-5 px-2 text-[10px]"
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
      {/* Barra de busca + botões de ação na mesma linha */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Campo de busca */}
        <div className="relative min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        {/* Botões de ação */}
        {!isSelectMode ? (
          <>
            <Button
              onClick={async () => {
                try {
                  const novoProduto = await createProdutoAsync({
                    sku_interno: `COMP-${Date.now()}`,
                    nome: "Nova Composição",
                    preco_venda: 0,
                    quantidade_atual: 0,
                    estoque_minimo: 0,
                    status: 'ativo',
                    ativo: true
                  });
                  
                  if (novoProduto) {
                    setProdutoSelecionado(novoProduto);
                    setModalOpen(true);
                  }
                } catch (error) {
                  console.error('Erro ao criar composição:', error);
                }
              }}
              className="gap-1.5 h-7 px-2.5 text-xs"
            >
              <Plus className="w-3 h-3" />
              Nova Composição
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportProdutosModalOpen(true)}
              className="gap-1.5 h-7 px-2.5 text-xs"
            >
              <Import className="w-3 h-3" />
              Importar do Estoque
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="gap-1.5 h-7 px-2.5 text-xs"
            >
              <Upload className="w-3 h-3" />
              Importar Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadComposicoes}
              className="gap-1.5 h-7 px-2.5 text-xs"
            >
              <Download className="w-3 h-3" />
              Baixar Dados
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={limparComposicoesOrfas}
                  className="gap-1.5 h-7 px-2.5 text-xs border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar Órfãs
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove composições de produtos que não existem mais</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              onClick={toggleSelectMode}
              className="gap-1.5 h-7 px-2.5 text-xs"
            >
              <CheckCircle className="w-3 h-3" />
              Selecionar
            </Button>
          </>
        ) : (
          <>
            <Badge variant="secondary" className="text-xs px-2 py-1 h-7 flex items-center">
              {selectedCount} selecionado(s)
            </Badge>
            <Button
              variant="outline"
              onClick={() => selectAll(produtosFinaisFiltrados)}
              className="gap-1.5 h-7 px-2.5 text-xs"
            >
              <CheckCircle className="w-3 h-3" />
              Selecionar Todos
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange(true)}
              disabled={selectedCount === 0}
              className="gap-1.5 h-7 px-2.5 text-xs border-green-500 text-green-600 hover:bg-green-50"
            >
              <Package className="w-3 h-3" />
              Ativar ({selectedCount})
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange(false)}
              disabled={selectedCount === 0}
              className="gap-1.5 h-7 px-2.5 text-xs border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <X className="w-3 h-3" />
              Desativar ({selectedCount})
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={selectedCount === 0}
                  className="gap-1.5 h-7 px-2.5 text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir ({selectedCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedCount} composiç{selectedCount === 1 ? 'ão' : 'ões'}? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              onClick={toggleSelectMode}
              className="gap-1.5 h-7 px-2.5 text-xs"
            >
              <X className="w-3 h-3" />
              Cancelar
            </Button>
          </>
        )}
      </div>

      {/* Layout principal */}
      <div className="space-y-6">

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

      {/* Barra flutuante de ações (Mobile) */}
      {isSelectMode && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Badge variant="secondary" className="text-sm px-3 py-1.5">
                {selectedCount} item(s)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAll(produtosFinaisFiltrados)}
                className="gap-1.5 text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Todos
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectMode}
                className="gap-1.5"
              >
                <X className="w-4 h-4" />
              </Button>
              <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedCount === 0}
                    className="gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir {selectedCount} composiç{selectedCount === 1 ? 'ão' : 'ões'}? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Composições */}
      <ComposicoesModal
        isOpen={modalOpen}
        onClose={fecharModal}
        produto={produtoSelecionado ? adaptProdutoComposicaoToModalProduct(produtoSelecionado) : null}
        composicoes={produtoSelecionado ? getComposicoesForSku(produtoSelecionado.sku_interno) : []}
        onSave={handleSalvarComposicoes}
        localId={localId}
        localVendaId={localVendaId}
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
        localId={localId}
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