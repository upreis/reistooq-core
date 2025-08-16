// 🎯 Modal de fluxo OAuth
// Exibe progresso e erros do processo de autenticação OAuth

import React from 'react';
import { X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useOAuthFlow } from '@/features/integrations/hooks/useOAuthFlow';

interface OAuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  open,
  onClose
}) => {
  const { isAuthenticating, authError } = useOAuthFlow();

  const handleRetry = () => {
    // O hook OAuth gerencia seu próprio estado
    // Aqui poderiamos implementar retry se necessário
    console.log('OAuth retry requested');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="oauth-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Autenticação OAuth
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Conectando com o provedor externo...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {isAuthenticating && !authError && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Aguardando autorização...</span>
              </div>
              
              <Progress value={50} className="w-full" />
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Uma nova janela foi aberta</p>
                <p>• Complete a autorização na outra janela</p>
                <p>• Esta janela se fechará automaticamente</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {authError && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Erro na autenticação</p>
                    <p className="text-sm">{authError}</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
                <Button onClick={onClose} variant="ghost" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {!isAuthenticating && !authError && open && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-success">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-success" />
                </div>
                <span className="text-sm">Autenticação concluída com sucesso!</span>
              </div>
              
              <Button onClick={onClose} className="w-full">
                Continuar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};