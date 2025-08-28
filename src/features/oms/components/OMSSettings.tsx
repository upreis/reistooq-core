import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings,
  Bell,
  Shield,
  Zap,
  Users,
  Database,
  Mail,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Key,
  Workflow,
  BarChart3
} from "lucide-react";

export function OMSSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [automaticApproval, setAutomaticApproval] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações do OMS</h1>
          <p className="text-muted-foreground">
            Configure automações, alertas, segurança e integrações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Main Settings */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" placeholder="Sua Empresa Ltda" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-currency">Moeda Padrão</Label>
                  <Select defaultValue="BRL">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select defaultValue="America/Sao_Paulo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Formato de Data</Label>
                  <Select defaultValue="dd/mm/yyyy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Dashboard & Métricas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atualização Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Atualizar dados do dashboard automaticamente
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Intervalo de Atualização</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 segundos</SelectItem>
                      <SelectItem value="30">30 segundos</SelectItem>
                      <SelectItem value="60">1 minuto</SelectItem>
                      <SelectItem value="300">5 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Widgets Personalizáveis</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir reorganizar widgets no dashboard
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Compacto</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir mais informações em menos espaço
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Alertas do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Gerais</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações do sistema
                    </p>
                  </div>
                  <Switch 
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar alertas importantes por email
                    </p>
                  </div>
                  <Switch 
                    checked={emailAlerts}
                    onCheckedChange={setEmailAlerts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Estoque Baixo</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertar quando produtos estiverem com estoque baixo
                    </p>
                  </div>
                  <Switch 
                    checked={lowStockAlerts}
                    onCheckedChange={setLowStockAlerts}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-address">Email para Alertas</Label>
                  <Input 
                    id="email-address" 
                    type="email" 
                    placeholder="seu@email.com" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Notificações Push
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações push no navegador
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novos Pedidos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre novos pedidos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status de Entrega</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates sobre status de entrega
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Horário de Funcionamento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="time" defaultValue="08:00" />
                    <Input type="time" defaultValue="18:00" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Notificações só serão enviadas neste horário
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Workflow className="w-5 h-5 mr-2" />
                Automações Order-to-Cash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Aprovação Automática</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-aprovar Pedidos</Label>
                      <p className="text-sm text-muted-foreground">
                        Aprovar automaticamente pedidos que atendem critérios
                      </p>
                    </div>
                    <Switch 
                      checked={automaticApproval}
                      onCheckedChange={setAutomaticApproval}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Máximo para Auto-aprovação</Label>
                    <Input type="number" placeholder="1000" />
                  </div>

                  <div className="space-y-2">
                    <Label>Clientes VIP</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto-approve">Auto-aprovar sempre</SelectItem>
                        <SelectItem value="priority">Prioridade alta</SelectItem>
                        <SelectItem value="notify">Apenas notificar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Estoque e Logística</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reserva Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Reservar estoque ao aprovar pedido
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Integração Transportadora</Label>
                      <p className="text-sm text-muted-foreground">
                        Gerar etiquetas automaticamente
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="space-y-2">
                    <Label>Prazo Máximo Expedição</Label>
                    <Select defaultValue="2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia útil</SelectItem>
                        <SelectItem value="2">2 dias úteis</SelectItem>
                        <SelectItem value="3">3 dias úteis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Regras de Negócio Personalizadas</h4>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Desconto Automático - Black Friday</span>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aplicar 20% de desconto em pedidos acima de R$ 500 em novembro
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Frete Grátis Automático</span>
                      <Switch />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aplicar frete grátis para pedidos acima de R$ 200
                    </p>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Criar Nova Regra de Automação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Segurança e Acesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicionar camada extra de segurança
                    </p>
                  </div>
                  <Switch 
                    checked={twoFactorAuth}
                    onCheckedChange={setTwoFactorAuth}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tempo de Sessão</Label>
                  <Select defaultValue="8">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="4">4 horas</SelectItem>
                      <SelectItem value="8">8 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Logout Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Fazer logout após período de inatividade
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Log de Auditoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações dos usuários
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Chaves de API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Chave API Principal</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type="password" 
                      value="sk_live_••••••••••••••••••••"
                      readOnly
                    />
                    <Button variant="outline" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type="password" 
                      value="whsec_••••••••••••••••••••"
                      readOnly
                    />
                    <Button variant="outline" size="icon">
                      <EyeOff className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  Gerar Nova Chave
                </Button>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Cuidado com as Chaves
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-300">
                        Nunca compartilhe suas chaves de API. Mantenha-as seguras.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Integrações Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Mercado Livre', status: 'connected', icon: '🛒' },
                  { name: 'Shopee', status: 'available', icon: '🛍️' },
                  { name: 'Correios', status: 'connected', icon: '📦' },
                  { name: 'PagSeguro', status: 'available', icon: '💳' },
                  { name: 'WhatsApp API', status: 'pending', icon: '💬' },
                  { name: 'Google Analytics', status: 'available', icon: '📊' }
                ].map((integration, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{integration.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {integration.status === 'connected' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">Conectado</span>
                            </>
                          )}
                          {integration.status === 'available' && (
                            <>
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Disponível</span>
                            </>
                          )}
                          {integration.status === 'pending' && (
                            <>
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-yellow-600">Pendente</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                      >
                        {integration.status === 'connected' ? 'Configurar' : 'Conectar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Configurações Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Performance e Cache</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cache Inteligente</Label>
                      <p className="text-sm text-muted-foreground">
                        Otimizar carregamento de dados
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label>Tempo de Cache (minutos)</Label>
                    <Input type="number" defaultValue="15" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo Offline</Label>
                      <p className="text-sm text-muted-foreground">
                        Funcionar sem conexão (PWA)
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Backup e Recuperação</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Backup Automático</Label>
                      <p className="text-sm text-muted-foreground">
                        Backup diário dos dados críticos
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label>Horário do Backup</Label>
                    <Input type="time" defaultValue="02:00" />
                  </div>

                  <Button variant="outline" className="w-full">
                    <Database className="w-4 h-4 mr-2" />
                    Fazer Backup Manual
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Logs e Depuração</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Logs Detalhados</Label>
                      <p className="text-sm text-muted-foreground">
                        Registrar logs detalhados para depuração
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="space-y-2">
                    <Label>Nível de Log</Label>
                    <Select defaultValue="info">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Apenas Erros</SelectItem>
                        <SelectItem value="warn">Avisos e Erros</SelectItem>
                        <SelectItem value="info">Informações</SelectItem>
                        <SelectItem value="debug">Debug (Todos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook de Monitoramento</Label>
                    <Input placeholder="https://seu-webhook.com/monitoring" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}