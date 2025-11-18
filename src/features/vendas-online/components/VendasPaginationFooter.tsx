import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VendasPaginationFooterProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  className?: string;
  showFirstLastButtons?: boolean;
  pageButtonLimit?: number;
}

export const VendasPaginationFooter: React.FC<VendasPaginationFooterProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  className,
  showFirstLastButtons = true,
  pageButtonLimit = 5,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validatedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== validatedCurrentPage) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxButtons = Math.max(1, pageButtonLimit);
    const halfLimit = Math.floor(maxButtons / 2);

    let startPage = Math.max(1, validatedCurrentPage - halfLimit);
    let endPage = Math.min(totalPages, validatedCurrentPage + halfLimit);

    if (endPage - startPage + 1 < maxButtons) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxButtons - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxButtons + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages.map((page, index) =>
      page === 'ellipsis' ? (
        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden="true">...</span>
      ) : (
        <Button
          key={page}
          variant={page === validatedCurrentPage ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-8 w-8 text-sm font-semibold transition-colors duration-150",
            page === validatedCurrentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => handlePageChange(page as number)}
          disabled={page === validatedCurrentPage}
          aria-current={page === validatedCurrentPage ? "page" : undefined}
          aria-label={`Ir para página ${page}`}
        >
          {page}
        </Button>
      )
    );
  };

  const isFirstPage = validatedCurrentPage === 1;
  const isLastPage = validatedCurrentPage === totalPages;

  const startItem = totalItems === 0 ? 0 : ((validatedCurrentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(validatedCurrentPage * itemsPerPage, totalItems);

  return (
    <div
      className={cn(
        "flex items-center justify-between py-4 px-2 sm:px-6 text-muted-foreground text-sm",
        className
      )}
      role="navigation"
      aria-label="Paginação"
    >
      {/* Informações à esquerda */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Mostrando {startItem} a {endItem} de {totalItems} vendas
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Itens por página:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="text-sm border border-input bg-background px-3 py-1 rounded-md hover:bg-accent transition-colors"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>
      
      {/* Controles de navegação centralizados */}
      <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
            onClick={() => handlePageChange(1)}
            disabled={isFirstPage}
            aria-label="Ir para primeira página"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Primeira página</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
          onClick={() => handlePageChange(validatedCurrentPage - 1)}
          disabled={isFirstPage}
          aria-label="Ir para página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Página anterior</span>
        </Button>

        {renderPageNumbers()}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
          onClick={() => handlePageChange(validatedCurrentPage + 1)}
          disabled={isLastPage}
          aria-label="Ir para próxima página"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Próxima página</span>
        </Button>
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
            onClick={() => handlePageChange(totalPages)}
            disabled={isLastPage}
            aria-label="Ir para última página"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Última página</span>
          </Button>
        )}
      </div>
      
      {/* Espaçador para manter layout balanceado */}
      <div className="w-[300px]"></div>
    </div>
  );
};
