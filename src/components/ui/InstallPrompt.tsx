// ============================================================================
// INSTALL PROMPT COMPONENT - PWA Installation banner
// ============================================================================

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { usePWA, PWAUtils } from '@/hooks/usePWA';

interface InstallPromptProps {
  onDismiss?: () => void;
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  onDismiss,
  className = ''
}) => {
  const [pwaState, pwaActions] = usePWA();
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  const installInfo = PWAUtils.getInstallInfo();
  const instructions = PWAUtils.getInstallInstructions();

  const handleInstall = async () => {
    const success = await pwaActions.showInstallPrompt();
    if (success) {
      setDismissed(true);
      onDismiss?.();
    } else if (installInfo.isIOS || installInfo.isAndroid) {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Não mostrar se já foi dismissido, já está instalado, ou não é instalável
  if (dismissed || pwaState.isStandalone || !pwaState.isInstallable) {
    return null;
  }

  if (showInstructions) {
    return (
      <Card className={`border-primary/20 bg-primary/5 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {installInfo.isIOS && <Smartphone className="w-5 h-5 text-primary" />}
                {installInfo.isAndroid && <Smartphone className="w-5 h-5 text-primary" />}
                {!installInfo.isIOS && !installInfo.isAndroid && <Monitor className="w-5 h-5 text-primary" />}
                <h3 className="font-semibold text-primary">
                  Como Instalar no {instructions.platform}
                </h3>
              </div>
              
              <div className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </Badge>
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowInstructions(false)}
                >
                  Voltar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleDismiss}
                >
                  Entendi
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>
            
            <div>
              <h3 className="font-semibold text-primary mb-1">
                Instalar REISTOQ Scanner
              </h3>
              <p className="text-sm text-muted-foreground">
                Acesso rápido e funcionamento offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={pwaState.installing}
              className="bg-primary hover:bg-primary/90"
            >
              {pwaState.installing ? 'Instalando...' : 'Instalar'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            📱 Ícone na tela inicial
          </Badge>
          <Badge variant="secondary" className="text-xs">
            🚀 Carregamento mais rápido
          </Badge>
          <Badge variant="secondary" className="text-xs">
            📶 Funciona offline
          </Badge>
          {installInfo.isIOS && (
            <Badge variant="secondary" className="text-xs">
              🍎 Nativo no iOS
            </Badge>
          )}
          {installInfo.isAndroid && (
            <Badge variant="secondary" className="text-xs">
              🤖 Nativo no Android
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};