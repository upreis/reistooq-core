import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CotacaoInternacionalForm } from "./CotacaoInternacionalForm";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { CotacaoInternacional } from "@/utils/cotacaoTypeGuards";

interface CotacaoInternacionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CotacaoInternacional;
  mode: 'create' | 'edit';
  onSave?: () => void;
}

export function CotacaoInternacionalDialog({ 
  open, 
  onOpenChange, 
  initialData, 
  mode,
  onSave 
}: CotacaoInternacionalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: CotacaoInternacional) => {
    setIsLoading(true);
    
    try {
      // A lógica de salvar será implementada no formulário
      console.log('Cotação data:', data);
      
      toast({
        title: mode === 'create' ? "Cotação criada" : "Cotação atualizada",
        description: mode === 'create' 
          ? "A cotação foi criada com sucesso." 
          : "A cotação foi atualizada com sucesso.",
      });
      
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a cotação.",
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
            {mode === 'create' ? 'Nova Cotação Internacional' : 'Editar Cotação Internacional'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            <CotacaoInternacionalForm
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
