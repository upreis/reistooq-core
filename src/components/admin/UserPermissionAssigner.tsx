import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, UserPlus, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const UserPermissionAssigner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const assignAdminPermissions = async () => {
    setLoading(true);
    try {
      // Primeiro, vamos verificar se o usuário já tem permissões
      const { data: currentPermissions } = await supabase.rpc('get_user_permissions');
      
      if (currentPermissions && currentPermissions.length > 0) {
        toast({
          title: "Usuário já tem permissões",
          description: `Você já possui ${currentPermissions.length} permissões atribuídas.`,
        });
        return;
      }

      // Se não tem permissões, vamos tentar atribuir um cargo de administrador
      // Primeiro, buscar o cargo de administrador
      const { data: adminRoles } = await supabase
        .from('roles')
        .select('id, name, slug')
        .eq('slug', 'admin')
        .limit(1);

      if (!adminRoles || adminRoles.length === 0) {
        toast({
          title: "Cargo não encontrado",
          description: "Não foi possível encontrar um cargo de administrador. Use o formulário acima para criar cargos.",
          variant: "destructive"
        });
        return;
      }

      // Atribuir o cargo ao usuário atual
      const { error: assignError } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role_id: adminRoles[0].id,
          organization_id: null // será setado automaticamente pela função
        });

      if (assignError) {
        console.error('Erro ao atribuir cargo:', assignError);
        toast({
          title: "Erro ao atribuir cargo",
          description: assignError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Cargo atribuído com sucesso!",
        description: `Você foi atribuído ao cargo de ${adminRoles[0].name}. Recarregue a página para ver as mudanças.`,
      });

      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao atribuir permissões.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Atribuição de Permissões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Se você não tem permissões atribuídas (mostrado como 0 permissões acima), 
            use o botão abaixo para se atribuir automaticamente a um cargo de administrador.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">Ações rápidas:</h4>
          <Button 
            onClick={assignAdminPermissions}
            disabled={loading}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {loading ? 'Atribuindo...' : 'Atribuir Cargo de Administrador'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Como funciona:</strong> Este botão atribui automaticamente o cargo de "Administrador" 
            ao usuário atual, dando acesso a todas as funcionalidades do sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};