import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderForm } from "./OrderForm";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  mode: 'create' | 'edit';
}

export function OrderDialog({ open, onOpenChange, initialData, mode }: OrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      // TODO: Implement actual order creation/update logic
      console.log('Order data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: mode === 'create' ? "Pedido criado" : "Pedido atualizado",
        description: mode === 'create' 
          ? "O pedido foi criado com sucesso." 
          : "O pedido foi atualizado com sucesso.",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o pedido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {mode === 'create' ? 'Novo Pedido de Venda' : 'Editar Pedido de Venda'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            <OrderForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}