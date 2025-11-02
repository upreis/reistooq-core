import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { GerenciarLocaisModal } from "@/components/estoque/GerenciarLocaisModal";

interface EstoqueHeaderProps {
  onLocalChange: () => void;
}

export function EstoqueHeader({ onLocalChange }: EstoqueHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b bg-background">
      <LocalEstoqueSelector key={`selector-${Date.now()}`} />
      <GerenciarLocaisModal onSuccess={onLocalChange} />
    </div>
  );
}
