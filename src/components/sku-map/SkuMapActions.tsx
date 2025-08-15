import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Trash2, X } from "lucide-react";
import { useBulkSkuActions } from "@/hooks/useSkuMappings";

interface SkuMapActionsProps {
  selectedItems: string[];
  onClearSelection: () => void;
}

export function SkuMapActions({ selectedItems, onClearSelection }: SkuMapActionsProps) {
  const bulkActions = useBulkSkuActions();
  const [pendingAction, setPendingAction] = useState<"activate" | "deactivate" | "delete" | null>(null);

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    try {
      await bulkActions.mutateAsync({
        action,
        ids: selectedItems,
      });
      onClearSelection();
      setPendingAction(null);
    } catch (error) {
      setPendingAction(null);
    }
  };

  const actionConfigs = {
    activate: {
      title: "Ativar mapeamentos",
      description: `Tem certeza que deseja ativar ${selectedItems.length} mapeamento(s)?`,
      icon: CheckCircle,
      variant: "default" as const,
      color: "text-success",
    },
    deactivate: {
      title: "Desativar mapeamentos",
      description: `Tem certeza que deseja desativar ${selectedItems.length} mapeamento(s)?`,
      icon: XCircle,
      variant: "outline" as const,
      color: "text-warning",
    },
    delete: {
      title: "Excluir mapeamentos",
      description: `Tem certeza que deseja excluir ${selectedItems.length} mapeamento(s)? Esta ação não pode ser desfeita.`,
      icon: Trash2,
      variant: "destructive" as const,
      color: "text-destructive",
    },
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedItems.length} selecionado{selectedItems.length > 1 ? 's' : ''}
            </Badge>
            <div className="flex gap-2">
              {(Object.keys(actionConfigs) as Array<keyof typeof actionConfigs>).map((action) => {
                const config = actionConfigs[action];
                const Icon = config.icon;
                
                return (
                  <AlertDialog key={action}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={config.variant}
                        size="sm"
                        disabled={bulkActions.isPending}
                        onClick={() => setPendingAction(action)}
                      >
                        <Icon className={`w-4 h-4 mr-2 ${config.color}`} />
                        {action === "activate" && "Ativar"}
                        {action === "deactivate" && "Desativar"}
                        {action === "delete" && "Excluir"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{config.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {config.description}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingAction(null)}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleBulkAction(action)}
                          className={action === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              })}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}