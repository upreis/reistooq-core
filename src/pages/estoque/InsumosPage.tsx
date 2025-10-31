/**
 * 📦 PÁGINA - COMPOSIÇÕES DE INSUMOS
 * Gerenciamento de insumos debitados 1x por pedido
 */

import { useState } from 'react';
import { Plus, Package, Upload, Download, Import, CheckCircle, X, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InsumosComposicoesTable } from '@/features/estoque/components/insumos/InsumosComposicoesTable';
import { InsumoForm } from '@/features/estoque/components/insumos/InsumoForm';
import { InsumoDeleteDialog } from '@/features/estoque/components/insumos/InsumoDeleteDialog';
import { useInsumosComposicoes } from '@/features/estoque/hooks/useInsumosComposicoes';
import { useComposicoesSelection } from "@/features/estoque/hooks/useComposicoesSelection";
import type { ComposicaoInsumoEnriquecida } from '@/features/estoque/types/insumos.types';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function InsumosPage() {
  const { createInsumo, updateInsumo, deleteInsumo, insumosEnriquecidos } = useInsumosComposicoes();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<ComposicaoInsumoEnriquecida | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
    // O InsumoForm sempre cria novos registros (ele deleta os antigos se estiver editando)
    await createInsumo(data);
  };

  const handleConfirmDelete = async () => {
    if (insumoSelecionado) {
      await deleteInsumo(insumoSelecionado.id);
      setDeleteDialogOpen(false);
      setInsumoSelecionado(null);
    }
  };

  const handleDeleteSelected = async () => {
    const selectedInsumos = getSelectedItems(insumosEnriquecidos);
    if (selectedInsumos.length === 0) return;

    try {
      for (const insumo of selectedInsumos) {
        await deleteInsumo(insumo.id);
      }
      clearSelection();
      toggleSelectMode();
      toast.success(`${selectedInsumos.length} insumo(s) excluído(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao excluir insumos:', error);
      toast.error('Erro ao excluir insumos selecionados');
    }
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
              <span className="text-primary font-medium">Insumos</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Composições de Insumos</h1>
              <p className="text-muted-foreground max-w-2xl">
                Gerencie insumos debitados <strong>1 vez por pedido</strong> (etiquetas, embalagens, etc.)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Modo de seleção */}
            {!isSelectMode ? (
              <>
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Insumo
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleSelectMode}
                  className="gap-2 bg-background/60 backdrop-blur-sm border-border/60"
                >
                  <CheckCircle className="w-4 h-4" />
                  Selecionar
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="text-sm px-3 py-1.5">
                  {selectedCount} selecionado(s)
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectAll(insumosEnriquecidos)}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Selecionar Todos
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedCount === 0}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectMode}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Seção de busca */}
        <div className="space-y-4">
          {/* Info Box */}
          <div className="p-4 border rounded-lg bg-blue-500/10 border-blue-500/20">
            <div className="text-sm space-y-2">
              <p>
                <strong>💡 Como funciona:</strong>
              </p>
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

          {/* Busca */}
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar insumos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <InsumosComposicoesTable
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchQuery={searchQuery}
          isSelectMode={isSelectMode}
          selectedItems={selectedItems}
          onSelectItem={selectItem}
          isSelected={isSelected}
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
                onClick={() => selectAll(insumosEnriquecidos)}
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
    </div>
  );
}
