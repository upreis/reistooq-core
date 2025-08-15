import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings, Bell, Shield, Key, Database, Webhook, Mail, Smartphone, Megaphone, Plus, Trash2, Edit } from "lucide-react";
import { NoticeConfigSection } from "@/components/system/NoticeConfigSection";

const Configuracoes = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações do sistema, alertas e integrações</p>
          </div>
        </div>

        <Tabs defaultValue="alertas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="alertas" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="avisos" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Avisos do Sistema
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Tokens & APIs
            </TabsTrigger>
            <TabsTrigger value="integracao" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="notificacao" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Configurações de Alertas */}
          <TabsContent value="alertas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configurações de Alertas
                </CardTitle>
                <CardDescription>
                  Configure os alertas de estoque, prazo de validade e limites críticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="estoque-min">Estoque Mínimo</Label>
                      <Input 
                        id="estoque-min" 
                        type="number" 
                        placeholder="10" 
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Alerta quando estoque estiver abaixo deste valor
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="validade-dias">Dias para Vencimento</Label>
                      <Input 
                        id="validade-dias" 
                        type="number" 
                        placeholder="30" 
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Alerta X dias antes do vencimento
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alertas por Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar alertas por email
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alertas Push</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar notificações push
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alertas Críticos</Label>
                        <p className="text-sm text-muted-foreground">
                          Alertas para situações críticas
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="email-alertas">Emails para Alertas</Label>
                  <Textarea 
                    id="email-alertas"
                    placeholder="admin@empresa.com&#10;gerente@empresa.com"
                    className="mt-1"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Um email por linha
                  </p>
                </div>
                <Button className="w-full md:w-auto">
                  Salvar Configurações de Alertas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avisos do Sistema */}
          <TabsContent value="avisos" className="space-y-6">
            <NoticeConfigSection />
          </TabsContent>

          {/* Tokens e APIs */}
          <TabsContent value="tokens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Tokens e Chaves de API
                </CardTitle>
                <CardDescription>
                  Configure tokens de acesso para integrações externas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tiny-token">Token Tiny ERP</Label>
                    <Input 
                      id="tiny-token" 
                      type="password" 
                      placeholder="Digite o token do Tiny ERP"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Token de integração com o sistema Tiny ERP
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email-api">API Key Email</Label>
                    <Input 
                      id="email-api" 
                      type="password" 
                      placeholder="Digite a chave da API de email"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Chave para envio de emails (SendGrid, Mailgun, etc.)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="webhook-url">URL do Webhook</Label>
                    <Input 
                      id="webhook-url" 
                      type="url" 
                      placeholder="https://api.exemplo.com/webhook"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      URL para receber notificações de eventos
                    </p>
                  </div>
                </div>
                <Button className="w-full md:w-auto">
                  Salvar Tokens
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrações */}
          <TabsContent value="integracao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Configurações de Integração
                </CardTitle>
                <CardDescription>
                  Configure integrações com sistemas externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Tiny ERP</CardTitle>
                      <CardDescription>Sincronização de produtos e estoque</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Ativo</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Sincronização Automática</Label>
                        <Switch />
                      </div>
                      <div>
                        <Label htmlFor="sync-interval">Intervalo (minutos)</Label>
                        <Input 
                          id="sync-interval" 
                          type="number" 
                          placeholder="30"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Marketplace</CardTitle>
                      <CardDescription>Integração com marketplaces</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Mercado Livre</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Amazon</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Shopee</Label>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Button className="w-full md:w-auto">
                  Salvar Configurações de Integração
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notificacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configurações de Notificação
                </CardTitle>
                <CardDescription>
                  Configure como e quando receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações por email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações no navegador
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Alertas críticos por SMS
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="phone">Telefone para SMS</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+55 11 99999-9999"
                    className="mt-1"
                  />
                </div>
                <Button className="w-full md:w-auto">
                  Salvar Configurações de Notificação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sistema */}
          <TabsContent value="sistema" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription>
                  Configurações gerais do sistema e banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="empresa">Nome da Empresa</Label>
                      <Input 
                        id="empresa" 
                        placeholder="REISTOQ Ltda"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <Input 
                        id="timezone" 
                        placeholder="America/Sao_Paulo"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="moeda">Moeda Padrão</Label>
                      <Input 
                        id="moeda" 
                        placeholder="BRL"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Backup Automático</Label>
                        <p className="text-sm text-muted-foreground">
                          Backup diário dos dados
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Modo Manutenção</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativar modo de manutenção
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Logs Detalhados</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativar logs detalhados
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
                <Button className="w-full md:w-auto">
                  Salvar Configurações do Sistema
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;