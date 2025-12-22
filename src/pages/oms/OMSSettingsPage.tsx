import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Database, Mail, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function OMSSettingsPage() {
  const { toast } = useToast();

  const handleSeedData = async () => {
    try {
      // Chamar função para popular dados de exemplo
      const { error } = await supabase.rpc('seed_oms_sample_data');
      
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados de exemplo criados com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar dados de exemplo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Configurações OMS</h1>
        <p className="text-xs text-muted-foreground">
          Configure as opções do sistema de gestão de pedidos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs">Nome da Empresa</Label>
              <Input id="company" placeholder="Sua Empresa Ltda" className="h-7 text-xs" />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="cnpj" className="text-xs">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" className="h-7 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prefix" className="text-xs">Prefixo de Pedidos</Label>
              <Input id="prefix" placeholder="PED" className="h-7 text-xs" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-aprovação</Label>
                <p className="text-sm text-muted-foreground">
                  Aprovar pedidos automaticamente
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Verificar estoque</Label>
                <p className="text-sm text-muted-foreground">
                  Validar disponibilidade ao criar pedidos
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de E-mail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configurações de E-mail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="smtp-host" className="text-xs">Servidor SMTP</Label>
              <Input id="smtp-host" placeholder="smtp.gmail.com" className="h-7 text-xs" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="smtp-port" className="text-xs">Porta</Label>
                <Input id="smtp-port" placeholder="587" className="h-7 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtp-user" className="text-xs">Usuário</Label>
                <Input id="smtp-user" placeholder="usuario@empresa.com" className="h-7 text-xs" />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-mail de novo pedido</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar criação de pedidos
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-mail de aprovação</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar aprovação de pedidos
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Comissão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configurações de Comissão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="default-commission" className="text-xs">Comissão Padrão (%)</Label>
              <Input id="default-commission" type="number" placeholder="5.00" step="0.01" className="h-7 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-commission" className="text-xs">Comissão Máxima (%)</Label>
              <Input id="max-commission" type="number" placeholder="15.00" step="0.01" className="h-7 text-xs" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comissão obrigatória</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir representante em todos os pedidos
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comissão sobre frete</Label>
                <p className="text-sm text-muted-foreground">
                  Incluir frete no cálculo da comissão
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Dados de Exemplo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados de Exemplo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs text-muted-foreground">
              Popule o sistema com dados de exemplo para testes e demonstração.
            </p>

            <Button onClick={handleSeedData} className="w-full h-7 text-xs">
              Criar Dados de Exemplo
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>Serão criados:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>3 produtos exemplo</li>
                <li>1 representante comercial</li>
                <li>1 cliente exemplo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-1.5">
        <Button variant="outline" className="h-7 px-2.5 text-xs">Cancelar</Button>
        <Button className="h-7 px-2.5 text-xs">Salvar Configurações</Button>
      </div>
    </div>
  );
}