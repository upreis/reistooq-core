import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { GerenciarLocaisModal } from "@/components/estoque/GerenciarLocaisModal";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EstoqueHeaderProps {
  onLocalChange: () => void;
  onTransferClick: () => void;
  selectedProductsCount: number;
  onCreateParent: () => void;
  onCreateChild: () => void;
}

export function EstoqueHeader({ onLocalChange, onTransferClick, selectedProductsCount, onCreateParent, onCreateChild }: EstoqueHeaderProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col gap-4 pb-4 border-b">
      <div className="flex items-center justify-between gap-4">
        <LocalEstoqueSelector showActions={true} key={`selector-${Date.now()}`} />
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTransferClick}
              disabled={selectedProductsCount === 0}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transferir Estoque
              {selectedProductsCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {selectedProductsCount}
                </span>
              )}
            </Button>
            <GerenciarLocaisModal onSuccess={onLocalChange} />
          </div>
        )}
      </div>
      
      {/* Botão Produto ao lado do Estoque Principal - somente mobile */}
      {isMobile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              Produto
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background z-50">
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
      )}
    </div>
  );
}
