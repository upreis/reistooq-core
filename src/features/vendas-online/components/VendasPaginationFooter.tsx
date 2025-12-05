import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Garantir que página atual está dentro dos limites válidos
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

    // Ajustar start/end para garantir maxButtons mostrados quando possível
    if (endPage - startPage + 1 < maxButtons) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxButtons - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxButtons + 1);
      }
    }

    // Sempre mostrar primeira página se não estiver no range
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Sempre mostrar última página se não estiver no range
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
        "grid grid-cols-3 items-center py-4 px-2 sm:px-6 text-muted-foreground text-sm",
        className
      )}
      role="navigation"
      aria-label="Paginação"
    >
      {/* Informações à esquerda */}
      <div className="flex items-center gap-4 justify-self-start">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Mostrando <span className="font-semibold text-foreground">{startItem}</span> a{' '}
          <span className="font-semibold text-foreground">{endItem}</span> de{' '}
          <span className="font-semibold text-foreground">{totalItems}</span> vendas
        </div>
        
        {/* Select de itens por página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Itens por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]" aria-label="Selecionar itens por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navegação centralizada */}
      <div className="flex items-center gap-1 justify-self-center">
        {/* Botão Primeira Página */}
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={isFirstPage}
            aria-label="Ir para primeira página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Botão Anterior */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(validatedCurrentPage - 1)}
          disabled={isFirstPage}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Números de páginas */}
        <div className="flex items-center gap-1">
          {renderPageNumbers()}
        </div>

        {/* Botão Próxima */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handlePageChange(validatedCurrentPage + 1)}
          disabled={isLastPage}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Botão Última Página */}
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(totalPages)}
            disabled={isLastPage}
            aria-label="Ir para última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Coluna vazia à direita para balancear o grid */}
      <div></div>
    </div>
  );
};
