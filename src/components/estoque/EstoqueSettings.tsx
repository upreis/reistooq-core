import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEstoqueSettings } from "@/hooks/useEstoqueSettings";

export function EstoqueSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { config, saveSettings, resetToDefaults } = useEstoqueSettings();
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  // Atualizar localConfig quando o dialog abrir ou config mudar
  useEffect(() => {
    if (dialogOpen) {
      setLocalConfig(config);
    }
  }, [dialogOpen, config]);

  const handleConfigChange = (section: keyof typeof config, key: string, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = saveSettings(localConfig);
      
      if (success) {
        toast({
          title: "Configurações salvas",
          description: "As configurações do estoque foram atualizadas com sucesso.",
        });
        setDialogOpen(false);
        
        // Forçar reload da página para aplicar as mudanças
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error("Falha ao salvar");
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const success = resetToDefaults();
    if (success) {
      // Forçar reload das configurações
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      toast({
        title: "Configurações restauradas",
        description: "As configurações foram restauradas para os valores padrão.",
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Estoque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Notificações</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="lowStockAlert">Alertas de estoque baixo</Label>
              <Switch
                id="lowStockAlert"
                checked={localConfig.notifications.lowStockAlert}
                onCheckedChange={(checked) => 
                  handleConfigChange('notifications', 'lowStockAlert', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="outOfStockAlert">Alertas de produtos sem estoque</Label>
              <Switch
                id="outOfStockAlert"
                checked={localConfig.notifications.outOfStockAlert}
                onCheckedChange={(checked) => 
                  handleConfigChange('notifications', 'outOfStockAlert', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="orphanProductsAlert">Alertas de produtos órfãos</Label>
              <Switch
                id="orphanProductsAlert"
                checked={localConfig.notifications.orphanProductsAlert}
                onCheckedChange={(checked) => 
                  handleConfigChange('notifications', 'orphanProductsAlert', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="noPriceAlert">Alertas de produtos sem preço</Label>
              <Switch
                id="noPriceAlert"
                checked={localConfig.notifications.noPriceAlert}
                onCheckedChange={(checked) => 
                  handleConfigChange('notifications', 'noPriceAlert', checked)
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Visualização</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoExpandGroups">Expandir grupos automaticamente</Label>
              <Switch
                id="autoExpandGroups"
                checked={localConfig.display.autoExpandGroups}
                onCheckedChange={(checked) => 
                  handleConfigChange('display', 'autoExpandGroups', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showProductImages">Mostrar imagens de produtos</Label>
              <Switch
                id="showProductImages"
                checked={localConfig.display.showProductImages}
                onCheckedChange={(checked) => 
                  handleConfigChange('display', 'showProductImages', checked)
                }
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleResetToDefaults}>
              Restaurar Padrões
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
