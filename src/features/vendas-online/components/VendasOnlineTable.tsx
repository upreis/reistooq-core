/**
 * 📊 VENDAS ONLINE TABLE
 * Container para a tabela de vendas com filtros e ações
 */

import { useVendasStore } from '../store/vendasStore';
import { VendasTable } from './VendasTable';
import { VendasNoteDialog } from './VendasNoteDialog';
import { VendasPackDialog } from './VendasPackDialog';
import { VendasShippingDialog } from './VendasShippingDialog';
import { VendasFeedbackDialog } from './VendasFeedbackDialog';
import { useState } from 'react';
import type { StatusAnalise } from '../types/venda-analise.types';
import type { UseColumnManagerReturn } from '../types/columns.types'; // 🎯 FASE 3

interface VendasOnlineTableProps {
  onStatusChange?: (orderId: string, newStatus: StatusAnalise) => void;
  activeTab?: 'ativas' | 'historico';
  columnManager?: UseColumnManagerReturn; // 🎯 FASE 3
}

export const VendasOnlineTable = ({ onStatusChange, activeTab, columnManager }: VendasOnlineTableProps) => {
  const { 
    orders, 
    filters, 
    pagination,
    isLoading,
    setPage 
  } = useVendasStore();

  const [noteDialog, setNoteDialog] = useState<{ open: boolean; packId: string } | null>(null);
  const [packDialog, setPackDialog] = useState<{ open: boolean; packId: string } | null>(null);
  const [shippingDialog, setShippingDialog] = useState<{ 
    open: boolean; 
    shippingId: string;
    currentStatus?: string;
  } | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; orderId: string } | null>(null);

  return (
    <>
      <VendasTable
        orders={orders}
        total={pagination.total}
        loading={isLoading}
        currentPage={pagination.currentPage}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={setPage}
        onStatusChange={onStatusChange}
        activeTab={activeTab}
        columnManager={columnManager} // 🎯 FASE 3
      />

      {/* Dialogs */}
      {noteDialog && (
        <VendasNoteDialog
          open={noteDialog.open}
          onOpenChange={(open) => !open && setNoteDialog(null)}
          packId={noteDialog.packId}
          integrationAccountId={filters.integrationAccountId}
        />
      )}
      
      {packDialog && (
        <VendasPackDialog
          open={packDialog.open}
          onOpenChange={(open) => !open && setPackDialog(null)}
          packId={packDialog.packId}
        />
      )}
      
      {shippingDialog && (
        <VendasShippingDialog
          open={shippingDialog.open}
          onOpenChange={(open) => !open && setShippingDialog(null)}
          shippingId={shippingDialog.shippingId}
          currentStatus={shippingDialog.currentStatus}
          integrationAccountId={filters.integrationAccountId}
        />
      )}
      
      {feedbackDialog && (
        <VendasFeedbackDialog
          open={feedbackDialog.open}
          onOpenChange={(open) => !open && setFeedbackDialog(null)}
          orderId={feedbackDialog.orderId}
          integrationAccountId={filters.integrationAccountId}
        />
      )}
    </>
  );
};
