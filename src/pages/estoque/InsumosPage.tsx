/**
 * 📦 PÁGINA - COMPOSIÇÕES DE INSUMOS
 * Gerenciamento de insumos debitados 1x por pedido
 */

import { useState } from 'react';
import { Plus, Package, Upload, Download, Import, CheckCircle, X, Trash2, Search, Filter, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InsumosComposicoesTable } from '@/features/estoque/components/insumos/InsumosComposicoesTable';
import { InsumoForm } from '@/features/estoque/components/insumos/InsumoForm';
import { InsumoDeleteDialog } from '@/features/estoque/components/insumos/InsumoDeleteDialog';
import { ImportarProdutosModal } from '@/components/composicoes/ImportarProdutosModal';
import { useInsumosComposicoes, useImportarInsumosDoEstoque } from '@/features/estoque/hooks/useInsumosComposicoes';
import { useComposicoesSelection } from "@/features/estoque/hooks/useComposicoesSelection";
import type { ComposicaoInsumoEnriquecida } from '@/features/estoque/types/insumos.types';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function InsumosPage({ hideHeader = false, localId, localVendaId }: { hideHeader?: boolean; localId?: string; localVendaId?: string }) {
  const { createInsumo, updateInsumo, deleteInsumo, deleteProduto, insumosEnriquecidos } = useInsumosComposicoes(localId, localVendaId);
  const { importarDoEstoque, isImporting } = useImportarInsumosDoEstoque(localVendaId);
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<ComposicaoInsumoEnriquecida | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [visibleSkus, setVisibleSkus] = useState<string[]>([]);

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

  const handleCreate = () => {
    setInsumoSelecionado(null);
    setFormOpen(true);
  };

  const handleEdit = (insumo: ComposicaoInsumoEnriquecida) => {
    setInsumoSelecionado(insumo);
    setFormOpen(true);
  };

  const handleDelete = (insumo: ComposicaoInsumoEnriquecida) => {
    setInsumoSelecionado(insumo);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (!localVendaId) {
      toast.error('Selecione um local de venda primeiro');
      return;
    }
    // O InsumoForm sempre cria novos registros (ele deleta os antigos se estiver editando)
    await createInsumo({ ...data, local_venda_id: localVendaId });
  };

  const handleConfirmDelete = async () => {
    if (insumoSelecionado) {
      await deleteInsumo(insumoSelecionado.id);
      setDeleteDialogOpen(false);
      setInsumoSelecionado(null);
    }
  };

  const handleDeleteSelected = async () => {
    // selectedItems contém os SKUs dos produtos selecionados
    const skusParaDeletar = Array.from(selectedItems);
    
    if (skusParaDeletar.length === 0) {
      toast.error('Nenhum item selecionado');
      return;
    }

    console.log('🗑️ DEBUG - Deletando SKUs:', skusParaDeletar);

    try {
      let insumosExcluidos = 0;
      let produtosExcluidos = 0;
      
      for (const skuProduto of skusParaDeletar) {
        // 1. Primeiro deletar todas as composições (insumos) deste produto no local de venda atual
        const insumosDesteProduto = (insumosEnriquecidos || []).filter(
          insumo => insumo.sku_produto === skuProduto
        );
        
        for (const insumo of insumosDesteProduto) {
          console.log('🗑️ Deletando insumo:', insumo.id, insumo.sku_produto, insumo.sku_insumo);
          await deleteInsumo(insumo.id);
          insumosExcluidos++;
        }
        
        // 2. Depois remover o produto da lista (produtos_composicoes)
        console.log('🗑️ Removendo produto da lista:', skuProduto);
        await deleteProduto(skuProduto);
        produtosExcluidos++;
      }
      
      clearSelection();
      toggleSelectMode();
      
      // Montar mensagem de sucesso
      const partes: string[] = [];
      if (produtosExcluidos > 0) {
        partes.push(`${produtosExcluidos} produto(s)`);
      }
      if (insumosExcluidos > 0) {
        partes.push(`${insumosExcluidos} composição(ões)`);
      }
      
      toast.success(`Excluído: ${partes.join(' e ')}`);
    } catch (error: any) {
      console.error('❌ Erro ao excluir:', error);
      toast.error(error.message || 'Erro ao excluir itens selecionados');
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Barra de busca + botões de ação na mesma linha */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Campo de busca */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar insumos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Botões de ação */}
          {!isSelectMode ? (
            <>
              <Button onClick={handleCreate} className="gap-1.5 h-9 text-sm">
                <Plus className="w-3.5 h-3.5" />
                Nova Composição
              </Button>
              <Button
                variant="secondary"
                onClick={() => setImportModalOpen(true)}
                className="gap-1.5 h-9 text-sm"
              >
                <Import className="w-3.5 h-3.5" />
                Importar do Estoque
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.info('Importar Excel - Em breve')}
                className="gap-1.5 h-9 text-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Importar Excel
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.info('Baixar Dados - Em breve')}
                className="gap-1.5 h-9 text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Dados
              </Button>
              <Button
                variant="secondary"
                onClick={toggleSelectMode}
                className="gap-1.5 h-9 text-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Selecionar
              </Button>
            </>
          ) : (
            <>
              <Badge variant="secondary" className="text-sm px-3 py-1.5">
                {selectedCount} selecionado(s)
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const skus = visibleSkus.length
                    ? visibleSkus
                    : Array.from(new Set((insumosEnriquecidos || []).map(i => i.sku_produto)));

                  selectAll(skus.map(sku => ({ id: sku })));
                }}
                className="gap-1.5 h-9"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Selecionar Todos
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedCount === 0}
                    className="gap-1.5 h-9"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir ({selectedCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir {selectedCount} insumo{selectedCount === 1 ? '' : 's'}? 
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
                variant="secondary"
                size="sm"
                onClick={toggleSelectMode}
                className="gap-1.5 h-9"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </Button>
            </>
          )}
        </div>

        {/* Botão Como funciona? no final da linha */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="text-muted-foreground hover:text-foreground gap-1 h-auto py-1 px-2"
        >
          <Info className="h-4 w-4" />
          <span className="text-xs">Como funciona?</span>
          {showInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {/* Header moderno melhorado - oculto no mobile ou quando hideHeader */}
      {!hideHeader && (
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-r from-primary/2 via-primary/4 to-primary/2 border border-border/30 rounded-xl p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>🏠</span>
                <span>/</span>
                <span>Estoque</span>
                <span>/</span>
                <span className="text-primary font-medium">Insumos</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Composições de Insumos</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Gerencie insumos debitados <strong>1 vez por pedido</strong> (etiquetas, embalagens, etc.)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout principal */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Info Box - Como funciona (exibido quando showInfo=true) */}
        {showInfo && (
          <div className="border rounded-lg bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-4 text-sm space-y-4">
            <div className="text-muted-foreground">
              <p className="mb-3">
                A composição de insumos é configurada <strong>por local de venda</strong>, não por tipo de estoque.
                Isso permite que cada canal tenha suas próprias regras de consumo de materiais.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Full/Fulfillment */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📦</span>
                  <h4 className="font-semibold text-emerald-600 dark:text-emerald-400">Estoque Full (Fulfillment)</h4>
                </div>
                <p className="text-muted-foreground text-xs">
                  Quando o estoque é transferido para o Full, os insumos já vão junto com os produtos.
                  <strong className="block mt-1">Não há saída adicional do estoque físico na venda</strong> — apenas o que já foi enviado 
                  (ex: etiqueta de identificação já colada no produto).
                </p>
              </div>

              {/* In-house */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏠</span>
                  <h4 className="font-semibold text-amber-600 dark:text-amber-400">Vendas In-house</h4>
                </div>
                <p className="text-muted-foreground text-xs">
                  A composição de insumos deve ser cadastrada <strong>para cada local de venda</strong>, 
                  pois cada canal pode ter exigências diferentes.
                </p>
              </div>
            </div>

            {/* Exemplo prático */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📋</span>
                <h4 className="font-semibold">Exemplo Prático</h4>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Mercado Livre:</strong> 1 etiqueta 10x15 por venda</li>
                <li>• <strong>Shopee:</strong> 2 etiquetas 10x15 por venda</li>
                <li>• <strong>Loja própria:</strong> 1 etiqueta + 1 nota fiscal por venda</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Cada local de venda consome insumos de forma diferente, por isso a configuração é individual.
              </p>
            </div>
          </div>
        )}

        {/* Tabela */}
        <InsumosComposicoesTable
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchQuery={searchQuery}
          isSelectMode={isSelectMode}
          selectedItems={selectedItems}
          onSelectItem={selectItem}
          isSelected={isSelected}
          localId={localId}
          localVendaId={localVendaId}
          onVisibleSkusChange={setVisibleSkus}
        />
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
                onClick={() => {
                  const skus = visibleSkus.length
                    ? visibleSkus
                    : Array.from(new Set((insumosEnriquecidos || []).map(i => i.sku_produto)));

                  selectAll(skus.map(sku => ({ id: sku })));
                }}
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
                      Tem certeza que deseja excluir {selectedCount} insumo{selectedCount === 1 ? '' : 's'}? 
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

      {/* Formulário */}
      <InsumoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setInsumoSelecionado(null);
        }}
        onSubmit={handleFormSubmit}
        insumo={insumoSelecionado}
      />

      {/* Diálogo de exclusão */}
      <InsumoDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setInsumoSelecionado(null);
        }}
        onConfirm={handleConfirmDelete}
        insumo={insumoSelecionado}
      />

      {/* Modal de Importação de Produtos do Estoque */}
      <ImportarProdutosModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportar={importarDoEstoque}
        isImporting={isImporting}
      />
    </div>
  );
}
