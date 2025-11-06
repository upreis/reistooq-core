import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { GerenciarLocaisModal } from "@/components/estoque/GerenciarLocaisModal";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface EstoqueHeaderProps {
  onLocalChange: () => void;
  onTransferClick: () => void;
  selectedProductsCount: number;
}

export function EstoqueHeader({ onLocalChange, onTransferClick, selectedProductsCount }: EstoqueHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b">
      <LocalEstoqueSelector showActions={true} key={`selector-${Date.now()}`} />
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
    </div>
  );
}
