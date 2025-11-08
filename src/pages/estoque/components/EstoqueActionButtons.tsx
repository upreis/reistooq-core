import { Button } from "@/components/ui/button";
import { Plus, Settings, LinkIcon, Trash2, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { ImportModal } from "@/components/estoque/ImportModal";
import { EstoqueExport } from "@/components/estoque/EstoqueExport";
import { EstoqueReports } from "@/components/estoque/EstoqueReports";
import { EstoqueSettings } from "@/components/estoque/EstoqueSettings";
import { Product } from "@/hooks/useProducts";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && (
        <div className="flex flex-wrap gap-2 p-4 bg-card/50 border border-border rounded-lg shadow-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Produto
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onCreateParent}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Produto Pai
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateChild}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Produto Filho
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
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
      )}

    <ImportModal
      open={importModalOpen}
      onOpenChange={setImportModalOpen}
      onSuccess={() => {
        onImportSuccess();
        setImportModalOpen(false);
      }}
      tipo="produtos"
    />
  </>
  );
}
