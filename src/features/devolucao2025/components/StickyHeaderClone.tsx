/**
 * 📌 COMPONENTE - Clone Fixo do Cabeçalho
 * Aparece no topo da tela quando usuário rola para baixo
 */

import { Table, TableHeader } from '@/components/ui/table';
import { TableHeaderContent } from './TableHeaderContent';
import { RefObject } from 'react';

interface StickyHeaderCloneProps {
  isVisible: boolean;
  headerRef: RefObject<HTMLDivElement>;
  visibleColumns: string[];
  isVisibleColumn: (columnId: string) => boolean;
}

export const StickyHeaderClone = ({ 
  isVisible, 
  headerRef, 
  visibleColumns, 
  isVisibleColumn 
}: StickyHeaderCloneProps) => {
  if (!isVisible) return null;

  return (
    <div 
      ref={headerRef}
      className="fixed top-0 z-[9999] overflow-x-auto bg-background shadow-md border-b-2 pointer-events-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <Table className="min-w-max">
        <TableHeader className="bg-background">
            <TableHeaderContent 
              visibleColumns={visibleColumns} 
              isVisible={isVisibleColumn} 
            />
        </TableHeader>
      </Table>
    </div>
  );
};
