import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { Settings, CheckCircle, AlertTriangle } from 'lucide-react';

export function PermissionFixButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFixPermissions = async () => {
    setLoading(true);
    try {
      // Chamar função que garante permissões de integração para o usuário atual
      const { data, error } = await supabase.rpc('ensure_integrations_manager_for_current_user');
      
      if (error) {
        console.error('Error fixing permissions:', error);
        toast.error('Erro ao corrigir permissões: ' + error.message);
        setStatus('error');
      } else if ((data as any)?.success) {
        toast.success('✅ Permissões de integração concedidas com sucesso!');
        setStatus('success');
        
        // Aguardar um pouco e então recarregar a página para aplicar as novas permissões
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Falha ao conceder permissões: ' + (data as any)?.error);
        setStatus('error');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado ao corrigir permissões');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getVariant = () => {
    switch (status) {
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getText = () => {
    if (loading) return 'Corrigindo permissões...';
    switch (status) {
      case 'success':
        return 'Permissões corrigidas!';
      case 'error':
        return 'Erro ao corrigir';
      default:
        return 'Corrigir Permissões de Integração';
    }
  };

  return (
    <Button 
      onClick={handleFixPermissions}
      disabled={loading || status === 'success'}
      variant={getVariant()}
      className="gap-2"
    >
      {getIcon()}
      {getText()}
    </Button>
  );
}