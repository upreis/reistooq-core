import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2, Shield, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DiagnosticResult = {
  hasPermission: boolean;
  hasRole: boolean;
  canAccessSecrets: boolean;
  userId: string | null;
  orgId: string | null;
};

type FixResult = {
  success: boolean;
  organization_id?: string;
  role_id?: string;
  error?: string;
};

export function PermissionFixer() {
  const [diagnosing, setDiagnosing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);

  const runDiagnostic = async () => {
    setDiagnosing(true);
    setDiagnostic(null);
    setFixResult(null);

    try {
      // Check current user and org
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orgId } = await supabase.rpc('get_current_org_id');
      
      // Check if user has integrations:manage permission
      const { data: hasPermission } = await supabase.rpc('has_permission', { 
        permission_key: 'integrations:manage' 
      });

      // Check roles (this might fail if no permission, that's expected)
      let hasRole = false;
      try {
        const { data: roles } = await supabase
          .from('user_role_assignments')
          .select(`
            roles!inner(name, slug, 
              role_permissions!inner(permission_key)
            )
          `)
          .eq('user_id', user?.id);
        
        hasRole = roles?.some(r => 
          r.roles.role_permissions.some(p => p.permission_key === 'integrations:manage')
        ) || false;
      } catch (e) {
        console.warn('Could not check roles:', e);
      }

      // Test secret access
      let canAccessSecrets = false;
      try {
        // Use a dummy account ID to test access (will fail but we check the error type)
        await supabase.functions.invoke('integrations-get-secret', {
          body: { 
            integration_account_id: '00000000-0000-0000-0000-000000000000',
            provider: 'mercadolivre' 
          }
        });
        canAccessSecrets = true; // If no error, permission is OK
      } catch (e: any) {
        // If error is about missing account (not permission), then access is OK
        const errorMsg = e?.message || '';
        canAccessSecrets = !errorMsg.includes('Permissão insuficiente') && 
                          !errorMsg.includes('Acesso negado');
      }

      setDiagnostic({
        hasPermission: !!hasPermission,
        hasRole,
        canAccessSecrets,
        userId: user?.id || null,
        orgId: orgId || null
      });

    } catch (error: any) {
      console.error('Diagnostic failed:', error);
      toast.error('Falha no diagnóstico: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setDiagnosing(false);
    }
  };

  const fixPermissions = async () => {
    setFixing(true);
    setFixResult(null);

    try {
      const { data, error } = await supabase.rpc('ensure_integrations_manager_for_current_user');
      
      if (error) throw error;
      
      const result = data as FixResult;
      setFixResult(result);
      
      if (result?.success) {
        toast.success('Permissões de integração corrigidas com sucesso!');
        // Re-run diagnostic to confirm fix
        setTimeout(() => runDiagnostic(), 1000);
      } else {
        toast.error('Falha ao corrigir permissões: ' + (result?.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('Fix failed:', error);
      const errorMsg = error?.message || 'Erro desconhecido';
      setFixResult({ success: false, error: errorMsg });
      toast.error('Falha ao corrigir permissões: ' + errorMsg);
    } finally {
      setFixing(false);
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    );
  };

  const needsFix = diagnostic && (!diagnostic.hasPermission || !diagnostic.canAccessSecrets);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Diagnóstico de Permissões - Integrações
        </CardTitle>
        <CardDescription>
          Verifica e corrige problemas de acesso aos segredos de integração
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic}
            disabled={diagnosing}
            variant="outline"
          >
            {diagnosing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Diagnosticar
          </Button>

          {needsFix && (
            <Button 
              onClick={fixPermissions}
              disabled={fixing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {fixing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Corrigir Automaticamente
            </Button>
          )}
        </div>

        {diagnostic && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium">Resultado do Diagnóstico:</h4>
            
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Usuário autenticado:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(!!diagnostic.userId)}
                  <span className="text-xs text-muted-foreground">
                    {diagnostic.userId ? `ID: ${diagnostic.userId.slice(0, 8)}...` : 'Não logado'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Organização detectada:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(!!diagnostic.orgId)}
                  <span className="text-xs text-muted-foreground">
                    {diagnostic.orgId ? `ID: ${diagnostic.orgId.slice(0, 8)}...` : 'Não encontrada'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Permissão integrations:manage:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostic.hasPermission)}
                  <span className="text-xs text-muted-foreground">
                    {diagnostic.hasPermission ? 'Concedida' : 'Ausente'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Cargo com permissão:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostic.hasRole)}
                  <span className="text-xs text-muted-foreground">
                    {diagnostic.hasRole ? 'Atribuído' : 'Não atribuído'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Acesso aos segredos:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostic.canAccessSecrets)}
                  <span className="text-xs text-muted-foreground">
                    {diagnostic.canAccessSecrets ? 'Permitido' : 'Bloqueado'}
                  </span>
                </div>
              </div>
            </div>

            {needsFix && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Problema detectado:</strong> Você não tem a permissão <code>integrations:manage</code> 
                  necessária para acessar os segredos das integrações. Clique em "Corrigir Automaticamente" 
                  para resolver.
                </AlertDescription>
              </Alert>
            )}

            {diagnostic.hasPermission && diagnostic.canAccessSecrets && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Tudo funcionando!</strong> Você tem todas as permissões necessárias 
                  para gerenciar integrações.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {fixResult && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium mb-2">Resultado da Correção:</h4>
            {fixResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Permissões corrigidas com sucesso! Você agora pode acessar os segredos de integração.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Falha na correção: {fixResult.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}