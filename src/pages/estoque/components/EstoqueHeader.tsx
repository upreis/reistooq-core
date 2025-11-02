import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { GerenciarLocaisModal } from "@/components/estoque/GerenciarLocaisModal";

interface EstoqueHeaderProps {
  onLocalChange: () => void;
}

export function EstoqueHeader({ onLocalChange }: EstoqueHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background flex items-center justify-between gap-4 pb-4 mb-4 border-b">
      <LocalEstoqueSelector key={`selector-${Date.now()}`} />
      <GerenciarLocaisModal onSuccess={onLocalChange} />
    </div>
  );
}
