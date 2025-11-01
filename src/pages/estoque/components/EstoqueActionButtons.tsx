import { Button } from "@/components/ui/button";
import { Plus, Settings, LinkIcon, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EstoqueImport } from "@/components/estoque/EstoqueImport";
import { EstoqueExport } from "@/components/estoque/EstoqueExport";
import { EstoqueReports } from "@/components/estoque/EstoqueReports";
import { EstoqueSettings } from "@/components/estoque/EstoqueSettings";
import { Product } from "@/hooks/useProducts";

interface EstoqueActionButtonsProps {
  selectedProducts: string[];
  products: Product[];
  finalFilteredProducts: Product[];
  onCreateParent: () => void;
  onCreateChild: () => void;
  onLinkChild: () => void;
  onDelete: () => void;
  onImportSuccess: () => void;
}

export function EstoqueActionButtons({
  selectedProducts,
  products,
  finalFilteredProducts,
  onCreateParent,
  onCreateChild,
  onLinkChild,
  onDelete,
  onImportSuccess
}: EstoqueActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-card/50 border border-border rounded-lg shadow-sm">
      <Button 
        variant="default" 
        size="sm"
        onClick={onCreateParent}
      >
        <Plus className="h-4 w-4 mr-2" />
        Criar Produto Pai
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onCreateChild}
      >
        <Plus className="h-4 w-4 mr-2" />
        Criar Produto Filho
      </Button>

      {selectedProducts.length > 0 && (
        <>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onLinkChild}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Gerenciar Vinculação
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </>
      )}
      
      <EstoqueImport onSuccess={onImportSuccess} />
      
      <EstoqueExport 
        products={products}
        filteredProducts={finalFilteredProducts}
      />
      
      <EstoqueReports products={products} />
      
      <EstoqueSettings />
      
      <Button variant="outline" size="sm" asChild>
        <Link to="/category-manager">
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar Categorias
        </Link>
      </Button>
    </div>
  );
}
