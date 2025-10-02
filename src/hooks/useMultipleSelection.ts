import { useState, useCallback } from 'react';
import { useCompatibleToast } from '@/utils/toastUtils';
import { ErrorHandler } from '@/utils/errorHandler';

interface UseMultipleSelectionProps {
  items: any[];
  onRefresh: () => void;
  deleteFunction: (id: string) => Promise<boolean>;
}

export const useMultipleSelection = ({ items, onRefresh, deleteFunction }: UseMultipleSelectionProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { toast } = useCompatibleToast();

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedIds([]);
    }
  }, [isSelectMode]);

  const selectItem = useCallback((itemId: string) => {
    if (selectedIds.includes(itemId)) {
      setSelectedIds(selectedIds.filter(id => id !== itemId));
    } else {
      setSelectedIds([...selectedIds, itemId]);
    }
  }, [selectedIds]);

  const selectAll = useCallback(() => {
    if (!Array.isArray(items)) return;
    const allIds = items.map(item => item.id!).filter(Boolean);
    setSelectedIds(allIds);
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const deleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const promises = selectedIds.map(id => deleteFunction(id));
      await Promise.all(promises);
      
      toast({ 
        title: "Itens excluídos!", 
        description: `${selectedIds.length} item(ns) excluído(s) com sucesso.` 
      });
      
      setSelectedIds([]);
      setIsSelectMode(false);
      onRefresh();
    } catch (error) {
      const errorDetails = ErrorHandler.capture(error, {
        component: 'useMultipleSelection',
        action: 'delete_selected'
      });
      
      toast({ 
        title: "Erro ao excluir itens", 
        description: ErrorHandler.getUserMessage(errorDetails), 
        variant: "destructive" 
      });
    }
  }, [selectedIds, deleteFunction, toast, onRefresh]);

  return {
    selectedIds,
    isSelectMode,
    toggleSelectMode,
    selectItem,
    selectAll,
    clearSelection,
    deleteSelected
  };
};
