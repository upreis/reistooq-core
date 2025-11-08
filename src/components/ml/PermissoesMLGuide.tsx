import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PermissoesMLGuide: React.FC = () => {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-yellow-600" />
          <div>
            <CardTitle>Permissões Necessárias para Devoluções ML</CardTitle>
            <CardDescription>
              Configuração de permissões para acessar tokens do Mercado Livre
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            Para usar a página de Devoluções ML, você precisa da permissão <Badge variant="secondary">integrations:read</Badge>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            Acesse a página de Administração
          </h3>
          <div className="pl-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Navegue para: <span className="font-mono bg-muted px-2 py-1 rounded">/configuracoes/administracao</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Ou clique em: <strong>Configurações → Administração</strong> no menu lateral
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
            Vá para a aba "Cargos e Permissões"
          </h3>
          <div className="pl-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Clique na aba <strong>"Cargos e Permissões"</strong> no topo da página
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
            Encontre seu cargo
          </h3>
          <div className="pl-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Localize o cargo que você possui (provavelmente "Administrador")
            </p>
            <p className="text-sm text-muted-foreground">
              Clique no botão <strong>"Editar"</strong> ao lado do cargo
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
            Adicione a permissão
          </h3>
          <div className="pl-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              Na seção <strong>"⚙️ CONFIGURAÇÕES"</strong>, marque:
            </p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">integrations:read</span>
                <span className="text-muted-foreground">- Ver Integrações</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
            Salve as alterações
          </h3>
          <div className="pl-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Clique no botão <strong>"Atualizar Cargo"</strong> para salvar e recarregue a página
            </p>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-900">
            <strong>💡 Dica:</strong> Se você for o administrador principal da organização, 
            provavelmente já tem todas as permissões. Se o erro persistir, entre em contato 
            com o suporte técnico.
          </AlertDescription>
        </Alert>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Permissões Adicionais Recomendadas:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              <Badge variant="outline">historico:read_full</Badge>
              <span>- Para acessar histórico completo de vendas</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              <Badge variant="outline">orders:read</Badge>
              <span>- Para visualizar pedidos</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
