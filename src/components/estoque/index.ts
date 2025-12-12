// =============================================================================
// ESTOQUE COMPONENTS - EXPORTS CENTRALIZADOS
// =============================================================================
// Este arquivo centraliza os exports dos componentes de estoque para facilitar
// imports e manutenção. Organizado por categoria de funcionalidade.
// =============================================================================

// -----------------------------------------------------------------------------
// COMPONENTES PRINCIPAIS DA PÁGINA
// -----------------------------------------------------------------------------
export { EstoqueFilters } from './EstoqueFilters';
export { EstoqueFilterSheet } from './EstoqueFilterSheet';
export { EstoqueTable } from './EstoqueTable';
export { HierarchicalEstoqueTable } from './HierarchicalEstoqueTable';
export { EstoqueSkeleton } from './EstoqueSkeleton';
export { EstoqueNotifications } from './EstoqueNotifications';
export { EstoqueStats } from './EstoqueStats';

// -----------------------------------------------------------------------------
// MODAIS DE PRODUTO
// -----------------------------------------------------------------------------
export { ProductModal } from './ProductModal';
export { ProductDetailsModal } from './ProductDetailsModal';
export { CreateParentProductModal } from './CreateParentProductModal';
export { CreateChildProductModal } from './CreateChildProductModal';
export { LinkChildToParentModal } from './LinkChildToParentModal';
export { LinkProductModal } from './LinkProductModal';
export { BulkPriceUpdateModal } from './BulkPriceUpdateModal';
export { AjusteEstoqueModal } from './AjusteEstoqueModal';
export { TransferenciaEstoqueModal } from './TransferenciaEstoqueModal';

// -----------------------------------------------------------------------------
// COMPOSIÇÕES
// -----------------------------------------------------------------------------
export { ComposicoesEstoque } from './ComposicoesEstoque';
export { ComposicoesFilters } from './ComposicoesFilters';
export { ComposicoesModal } from './ComposicoesModal';
export { ComposicoesCategorySidebar } from './ComposicoesCategorySidebar';

// -----------------------------------------------------------------------------
// CATEGORIAS
// -----------------------------------------------------------------------------
export { CategoryManager } from './CategoryManager';
export { CategoryCreationModal } from './CategoryCreationModal';
export { CategoryImportModal } from './CategoryImportModal';
export { CategoryHierarchyButton } from './CategoryHierarchyButton';
export { OptimizedCategorySidebar } from './OptimizedCategorySidebar';
export { HierarchicalFilters } from './HierarchicalFilters';

// -----------------------------------------------------------------------------
// IMPORTAÇÃO E EXPORTAÇÃO
// -----------------------------------------------------------------------------
export { ImportModal } from './ImportModal';
export { ImportPreview } from './ImportPreview';
export { EstoqueImport } from './EstoqueImport';
export { EstoqueExport } from './EstoqueExport';
export { EstoqueReports } from './EstoqueReports';
export { ColumnMapper } from './ColumnMapper';
export { DragDropUpload } from './DragDropUpload';

// -----------------------------------------------------------------------------
// LOCAIS E MOVIMENTAÇÕES
// -----------------------------------------------------------------------------
export { LocalEstoqueSelector } from './LocalEstoqueSelector';
export { GerenciarLocaisModal } from './GerenciarLocaisModal';
export { MovimentacoesHistorico } from './MovimentacoesHistorico';
export { MovimentacaoObservacoesModal } from './MovimentacaoObservacoesModal';

// -----------------------------------------------------------------------------
// UTILITÁRIOS
// -----------------------------------------------------------------------------
export { BulkActions } from './BulkActions';
export { EstoqueSettings } from './EstoqueSettings';
export { ImageGallery } from './ImageGallery';
export { SKUGenerator } from './SKUGenerator';
export { MobileEstoquePage } from './MobileEstoquePage';
