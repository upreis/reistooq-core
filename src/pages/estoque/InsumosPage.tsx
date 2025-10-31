/**
 * 📦 PÁGINA - COMPOSIÇÕES DE INSUMOS
 * Gerenciamento de insumos debitados 1x por pedido
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, Package, Filter, Download, Trash2, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { InsumosComposicoesTable } from '@/features/estoque/components/insumos/InsumosComposicoesTable';
import { InsumoForm } from '@/features/estoque/components/insumos/InsumoForm';
import { InsumoDeleteDialog } from '@/features/estoque/components/insumos/InsumoDeleteDialog';
import { useInsumosComposicoes } from '@/features/estoque/hooks/useInsumosComposicoes';
import type { ComposicaoInsumoEnriquecida } from '@/features/estoque/types/insumos.types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function InsumosPage() {
  const { 
    insumosEnriquecidos,
    createInsumo, 
    updateInsumo, 
    deleteInsumo,
    isLoading 
  } = useInsumosComposicoes();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<ComposicaoInsumoEnriquecida | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  // Filtrar insumos
  const insumosFiltrados = useMemo(() => {
    if (!searchQuery) return insumosEnriquecidos;
    
    const termo = searchQuery.toLowerCase();
    return insumosEnriquecidos.filter(insumo => 
      insumo.sku_produto.toLowerCase().includes(termo) ||
      insumo.nome_produto?.toLowerCase().includes(termo) ||
      insumo.sku_insumo.toLowerCase().includes(termo) ||
      insumo.nome_insumo?.toLowerCase().includes(termo)
    );
  }, [insumosEnriquecidos, searchQuery]);

  // Estatísticas
  const totalProdutos = useMemo(() => {
    const skus = new Set(insumosFiltrados.map(i => i.sku_produto));
    return skus.size;
  }, [insumosFiltrados]);

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
    if (insumoSelecionado) {
      await updateInsumo({ id: insumoSelecionado.id, data });
    } else {
      await createInsumo(data);
    }
    setFormOpen(false);
    setInsumoSelecionado(null);
  };

  const handleConfirmDelete = async () => {
    if (insumoSelecionado) {
      await deleteInsumo(insumoSelecionado.id);
      setDeleteDialogOpen(false);
      setInsumoSelecionado(null);
    }
  };

  // Seleção em massa
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedItems(new Set());
    }
  };

  const selectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === insumosFiltrados.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(insumosFiltrados.map(i => i.id)));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      for (const id of Array.from(selectedItems)) {
        await deleteInsumo(id);
      }
      setSelectedItems(new Set());
      setIsSelectMode(false);
      setDeleteConfirmOpen(false);
      toast.success(`${selectedItems.size} insumo(s) excluído(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir insumos selecionados');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8" />
              Composições de Insumos
            </h1>
            <p className="text-muted-foreground">
              Gerencie insumos debitados <strong>1 vez por pedido</strong> (etiquetas, embalagens, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            {isSelectMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={toggleSelectMode}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={selectedItems.size === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir ({selectedItems.size})
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={toggleSelectMode}>
                  <Checkbox className="mr-2" />
                  Selecionar
                </Button>
                <Button onClick={handleCreate} className="bg-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)]/90 text-[var(--brand-navy)]">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Insumo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Info Banner */}
        {showInfo && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">💡 Como funciona:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                      <li>
                        <strong>Composições de Produtos:</strong> Componentes multiplicados pela quantidade 
                        (ex: 3 produtos = 3x cada componente)
                      </li>
                      <li>
                        <strong>Composições de Insumos:</strong> Sempre 1 unidade por pedido 
                        (ex: 3 produtos do mesmo comprador = 1 etiqueta, 1 embalagem)
                      </li>
                    </ul>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfo(false)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barra de busca e filtros */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Buscar por SKU ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="text-sm text-muted-foreground">
            {totalProdutos} {totalProdutos === 1 ? 'produto' : 'produtos'} • {insumosFiltrados.length} {insumosFiltrados.length === 1 ? 'insumo' : 'insumos'}
          </div>
        </div>
      </div>

      {/* Tabela/Cards */}
      <Card>
        <CardContent className="p-6">
          <InsumosComposicoesTable
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

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

      {/* Diálogo de exclusão individual */}
      <InsumoDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setInsumoSelecionado(null);
        }}
        onConfirm={handleConfirmDelete}
        insumo={insumoSelecionado}
      />

      {/* Diálogo de exclusão em massa */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedItems.size} insumo(s) selecionado(s)? Esta ação não pode ser desfeita.
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
  );
}