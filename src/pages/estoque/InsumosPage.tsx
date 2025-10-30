/**
 * 📦 PÁGINA - COMPOSIÇÕES DE INSUMOS
 * Gerenciamento de insumos debitados 1x por pedido
 */

import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InsumosComposicoesTable } from '@/features/estoque/components/insumos/InsumosComposicoesTable';
import { InsumoForm } from '@/features/estoque/components/insumos/InsumoForm';
import { InsumoDeleteDialog } from '@/features/estoque/components/insumos/InsumoDeleteDialog';
import { useInsumosComposicoes } from '@/features/estoque/hooks/useInsumosComposicoes';
import type { ComposicaoInsumoEnriquecida } from '@/features/estoque/types/insumos.types';

export default function InsumosPage() {
  const { createInsumo, updateInsumo, deleteInsumo } = useInsumosComposicoes();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<ComposicaoInsumoEnriquecida | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Composições de Insumos
              </CardTitle>
              <CardDescription>
                Gerencie insumos debitados <strong>1 vez por pedido</strong> (etiquetas, embalagens, etc.)
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Insumo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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

            {/* Tabela */}
            <InsumosComposicoesTable
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
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
