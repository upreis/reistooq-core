import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Shield, Bell, CreditCard } from "lucide-react";
import jonathanAvatar from "@/assets/jonathan-avatar.jpg";

const AccountSettings = () => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(jonathanAvatar);

  const avatarOptions = [
    { id: 1, src: jonathanAvatar, alt: "Avatar 1" },
    { id: 2, src: "/placeholder.svg", alt: "Avatar 2" },
    { id: 3, src: "/placeholder.svg", alt: "Avatar 3" },
    { id: 4, src: "/placeholder.svg", alt: "Avatar 4" },
    { id: 5, src: "/placeholder.svg", alt: "Avatar 5" },
    { id: 6, src: "/placeholder.svg", alt: "Avatar 6" }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Configurações da Conta</span>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded-full"></div>
            <span>Conta</span>
          </TabsTrigger>
          <TabsTrigger value="notification" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Cobrança</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Alterar Perfil</CardTitle>
                <p className="text-sm text-muted-foreground">Altere sua foto de perfil aqui</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={selectedAvatar} alt="Profile" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  
                  {/* Avatar Selection Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar.src)}
                        className={`relative group ${
                          selectedAvatar === avatar.src ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <Avatar className="w-16 h-16 transition-transform group-hover:scale-105">
                          <AvatarImage src={avatar.src} alt={avatar.alt} />
                          <AvatarFallback>{avatar.id}</AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm">Fazer Upload</Button>
                    <Button variant="outline" size="sm">Redefinir</Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Permitido JPG, GIF ou PNG. Tamanho máximo de 800KB
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <p className="text-sm text-muted-foreground">Para alterar sua senha, confirme aqui</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input id="currentPassword" type="password" autoComplete="current-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input id="confirmPassword" type="password" autoComplete="new-password" />
                </div>
                <Button className="w-full">Atualizar Senha</Button>
              </CardContent>
            </Card>
          </div>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <p className="text-sm text-muted-foreground">Para alterar seus dados pessoais, edite e salve aqui</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="yourName">Seu Nome</Label>
                  <Input id="yourName" defaultValue="João Silva" autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nome da Loja</Label>
                  <Input id="storeName" defaultValue="Minha Empresa" autoComplete="organization" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Select defaultValue="br">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="br">Brasil</SelectItem>
                      <SelectItem value="us">Estados Unidos</SelectItem>
                      <SelectItem value="ca">Canadá</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select defaultValue="brl">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brl">Brasil (BRL)</SelectItem>
                      <SelectItem value="usd">Estados Unidos (USD)</SelectItem>
                      <SelectItem value="eur">Europa (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue="usuario@reistoq.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="+55 11 99999-9999" autoComplete="tel" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" defaultValue="Rua das Flores, 123, São Paulo, SP" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button>Salvar Alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificação</CardTitle>
              <p className="text-sm text-muted-foreground">Gerencie suas preferências de notificação</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conteúdo das configurações de notificação...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Cobrança</CardTitle>
              <p className="text-sm text-muted-foreground">Gerencie seus métodos de cobrança e pagamento</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Informações de cobrança...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <p className="text-sm text-muted-foreground">Gerencie suas configurações de segurança e privacidade</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configurações de segurança...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;