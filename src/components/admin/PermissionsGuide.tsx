import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Book, CheckCircle } from 'lucide-react';

export const PermissionsGuide: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Como Funciona o Sistema de Permissões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            O sistema agora reflete as páginas reais da aplicação com suas permissões corretas.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Módulos Principais e suas Permissões:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium text-primary">📊 DASHBOARD</h5>
              <p className="text-muted-foreground pl-4">• dashboard:view - Ver Dashboard</p>

              <h5 className="font-medium text-primary">🛒 VENDAS (OMS)</h5>
              <p className="text-muted-foreground pl-4">• pedidos:marketplace - Marketplace</p>
              <p className="text-muted-foreground pl-4">• oms:pedidos - Atacado</p>
              <p className="text-muted-foreground pl-4">• oms:clientes - Clientes</p>
              <p className="text-muted-foreground pl-4">• oms:configuracoes - Configurações OMS</p>

              <h5 className="font-medium text-primary">🛍️ COMPRAS</h5>
              <p className="text-muted-foreground pl-4">• compras:view - Sistema de Compras</p>

              <h5 className="font-medium text-primary">📦 ESTOQUE</h5>
              <p className="text-muted-foreground pl-4">• estoque:view - Ver Estoque</p>
              <p className="text-muted-foreground pl-4">• estoque:create - Criar Produtos</p>
              <p className="text-muted-foreground pl-4">• estoque:edit - Editar Estoque</p>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-primary">👥 CLIENTES</h5>
              <p className="text-muted-foreground pl-4">• oms:clientes - Gerenciar Clientes (via OMS)</p>

              <h5 className="font-medium text-primary">🔧 ADMINISTRAÇÃO</h5>
              <p className="text-muted-foreground pl-4">• admin:access - Acessar Admin</p>
              <p className="text-muted-foreground pl-4">• users:read - Ler Usuários</p>
              <p className="text-muted-foreground pl-4">• users:manage - Gerenciar Usuários</p>

              <h5 className="font-medium text-primary">⚙️ CONFIGURAÇÕES</h5>
              <p className="text-muted-foreground pl-4">• settings:view - Ver Configurações</p>
              <p className="text-muted-foreground pl-4">• integrations:read - Ver Integrações</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Passos para Configurar Permissões:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Se você não tem permissões, use o botão "Atribuir Cargo de Administrador" acima</li>
            <li>Crie novos cargos com as permissões específicas que você quer</li>
            <li>Nas páginas de usuários, atribua os cargos aos colaboradores</li>
            <li>Os usuários verão apenas as páginas para as quais têm permissão</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};