import { useState } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

export function useEstoqueActions(products: Product[], loadProducts: () => void) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<{
    failedProducts: string[];
    errorMessage: string;
  } | null>(null);

  const { deleteProduct, updateProduct } = useProducts();
  const { toast } = useToast();

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione ao menos um produto para excluir.",
        variant: "destructive",
      });
      return;
    }

    const validProductIds = selectedProducts.filter(id => 
      products.some(p => p.id === id)
    );

    if (validProductIds.length === 0) {
      toast({
        title: "Produtos não encontrados",
        description: "Os produtos selecionados não foram encontrados.",
        variant: "destructive",
      });
      setSelectedProducts([]);
      return;
    }

    console.log('🗑️ Excluindo produtos:', validProductIds);
    
    try {
      const results = await Promise.allSettled(
        validProductIds.map(id => {
          console.log(`🗑️ Excluindo produto ID: ${id}`);
          return deleteProduct(id);
        })
      );
      
      const sucessos = results.filter(r => r.status === 'fulfilled').length;
      const falhas = results.filter(r => r.status === 'rejected').length;
      
      const erros = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message || 'Erro desconhecido');
      
      const failedProductIds = validProductIds.filter((_, index) => 
        results[index].status === 'rejected'
      );
      
      const failedProductNames = failedProductIds
        .map(id => products.find(p => p.id === id)?.nome || id)
        .join(', ');
      
      console.log(`✅ Exclusão concluída: ${sucessos} sucessos, ${falhas} falhas`);
      
      if (falhas > 0) {
        const isComponentInUseError = erros.some(e => 
          e.includes('COMPONENTE_EM_USO') || e.includes('composições')
        );
        
        if (isComponentInUseError) {
          setDeleteErrors({
            failedProducts: failedProductNames.split(', '),
            errorMessage: erros[0]
          });
          setDeleteConfirmOpen(true);
        } else {
          toast({
            title: "Exclusão parcial",
            description: `${sucessos} produto(s) excluído(s). ${falhas} falhou(aram): ${erros[0]}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Produtos excluídos",
          description: `${sucessos} produto(s) excluído(s) com sucesso.`,
        });
      }
      
      setSelectedProducts([]);
      
      setTimeout(() => {
        console.log('🔄 Recarregando produtos após exclusão...');
        loadProducts();
      }, 300);
      
    } catch (error) {
      console.error('❌ Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Não foi possível excluir os produtos selecionados.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    console.log('🗑️ Excluindo produto individual:', productId);
    try {
      await deleteProduct(productId);
      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso.",
      });
      
      setTimeout(() => {
        console.log('🔄 Recarregando produtos após exclusão individual...');
        loadProducts();
      }, 300);
    } catch (error) {
      console.error('❌ Erro ao excluir produto:', error);
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (productIds: string[], newStatus: boolean) => {
    if (productIds.length === 0) return;
    
    try {
      await Promise.all(
        productIds.map(id => updateProduct(id, { ativo: newStatus }))
      );
      
      toast({
        title: "Status atualizado",
        description: `${productIds.length} produto(s) ${newStatus ? 'ativado(s)' : 'desativado(s)'} com sucesso.`,
      });
      
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Erro ao atualizar status em massa:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o status dos produtos selecionados.",
        variant: "destructive",
      });
    }
  };

  const handleStockMovement = async (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || quantity <= 0) {
      toast({
        title: "Erro",
        description: "Produto não encontrado ou quantidade inválida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { stockMovementService } = await import('@/features/scanner/services/StockMovementService');
      
      let result;
      if (type === 'entrada') {
        result = await stockMovementService.processStockIn({
          produto_id: productId,
          tipo: 'entrada',
          quantidade: quantity,
          motivo: reason || 'Movimentação manual via estoque',
          observacoes: 'Movimentação feita pela página de estoque'
        });
      } else {
        result = await stockMovementService.processStockOut({
          produto_id: productId,
          tipo: 'saida',
          quantidade: quantity,
          motivo: reason || 'Movimentação manual via estoque',
          observacoes: 'Movimentação feita pela página de estoque'
        });
      }

      if (result.success) {
        toast({
          title: "Movimentação realizada",
          description: `${type === 'entrada' ? 'Entrada' : 'Saída'} de ${quantity} unidades realizada com sucesso.`,
        });
        loadProducts();
      } else {
        toast({
          title: "Erro na movimentação",
          description: result.error || "Não foi possível realizar a movimentação.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro na movimentação:', error);
      toast({
        title: "Erro na movimentação",
        description: "Não foi possível realizar a movimentação de estoque.",
        variant: "destructive",
      });
    }
  };

  return {
    selectedProducts,
    setSelectedProducts,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteErrors,
    setDeleteErrors,
    handleSelectProduct,
    handleDeleteSelected,
    handleDeleteProduct,
    handleBulkStatusChange,
    handleStockMovement
  };
}
