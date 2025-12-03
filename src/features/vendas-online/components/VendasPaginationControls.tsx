/**
 * 🔄 PAGINATION CONTROLS
 * Controles de paginação para Vendas Canceladas
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useVendasStore } from '../store/vendasStore';

export const VendasPaginationControls = () => {
  const { pagination, setPage } = useVendasStore();
  
  const totalPages = Math.ceil(pagination.total / pagination.itemsPerPage);
  const canGoPrev = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Página {pagination.currentPage} de {totalPages}
      </p>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(pagination.currentPage - 1)}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(pagination.currentPage + 1)}
          disabled={!canGoNext}
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
