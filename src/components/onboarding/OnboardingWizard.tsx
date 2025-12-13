import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  LayoutDashboard, 
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink
} from 'lucide-react';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StepConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  tips?: string[];
}

const STEP_CONFIG: Record<OnboardingStep, StepConfig> = {
  'welcome': {
    icon: <Rocket className="h-12 w-12 text-primary" />,
    title: 'Bem-vindo ao Sistema!',
    description: 'Vamos configurar sua conta em alguns passos simples para você começar a vender de forma mais eficiente.',
    tips: [
      'O processo leva cerca de 5 minutos',
      'Você pode pular etapas e voltar depois',
      'Todas as configurações podem ser alteradas posteriormente'
    ]
  },
  'connect-marketplace': {
    icon: <ShoppingCart className="h-12 w-12 text-primary" />,
    title: 'Conectar sua Conta do Mercado Livre',
    description: 'Conecte sua conta do Mercado Livre para sincronizar seus pedidos, vendas e reclamações automaticamente.',
    actionLabel: 'Ir para Integrações',
    actionRoute: '/configuracoes/integracoes',
    tips: [
      'Seus dados ficam seguros e criptografados',
      'A sincronização acontece automaticamente',
      'Você pode conectar múltiplas contas'
    ]
  },
  'register-products': {
    icon: <Package className="h-12 w-12 text-primary" />,
    title: 'Cadastrar seus Produtos',
    description: 'Cadastre seus produtos no sistema para controlar estoque e ter uma visão completa das suas vendas.',
    actionLabel: 'Ir para Estoque',
    actionRoute: '/estoque',
    tips: [
      'Você pode importar produtos via planilha',
      'Configure SKUs para melhor organização',
      'Adicione imagens para facilitar identificação'
    ]
  },
  'configure-stock': {
    icon: <Warehouse className="h-12 w-12 text-primary" />,
    title: 'Configurar Locais de Estoque',
    description: 'Configure seus locais de estoque (casa, galpão, fulfillment) para controlar onde seus produtos estão armazenados.',
    actionLabel: 'Gerenciar Locais',
    actionRoute: '/estoque',
    tips: [
      'Separe estoque por local físico',
      'Configure estoque mínimo para alertas',
      'Acompanhe movimentações em tempo real'
    ]
  },
  'understand-dashboard': {
    icon: <LayoutDashboard className="h-12 w-12 text-primary" />,
    title: 'Conhecer o Dashboard',
    description: 'O dashboard é sua central de controle. Aqui você acompanha vendas em tempo real, métricas importantes e atalhos rápidos.',
    actionLabel: 'Ver Dashboard',
    actionRoute: '/dashboardinicial/visao-geral',
    tips: [
      'Personalize atalhos rápidos para suas páginas favoritas',
      'Acompanhe vendas do dia e do mês',
      'Veja alertas de estoque baixo em tempo real'
    ]
  },
  'configure-alerts': {
    icon: <Bell className="h-12 w-12 text-primary" />,
    title: 'Configurar Alertas',
    description: 'Configure alertas para ser notificado sobre estoque baixo, novas reclamações e outras situações importantes.',
    actionLabel: 'Configurar Alertas',
    actionRoute: '/configuracoes/alertas',
    tips: [
      'Receba alertas de estoque baixo',
      'Seja notificado sobre novas reclamações',
      'Personalize quais alertas deseja receber'
    ]
  },
  'complete': {
    icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    title: 'Configuração Concluída!',
    description: 'Parabéns! Você concluiu a configuração inicial. Agora você pode explorar todas as funcionalidades do sistema.',
    tips: [
      'Explore o menu lateral para todas as funcionalidades',
      'Use a busca rápida para encontrar pedidos',
      'Acesse Configurações para personalizar mais opções'
    ]
  }
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const {
    progress,
    isWizardOpen,
    closeWizard,
    goToStep,
    completeStep,
    skipStep,
    allSteps,
    stepLabels,
    totalSteps,
    completedCount
  } = useOnboarding();

  const currentConfig = STEP_CONFIG[progress.currentStep];
  const currentIndex = allSteps.indexOf(progress.currentStep);
  const progressPercentage = ((completedCount) / totalSteps) * 100;

  const handleAction = () => {
    if (currentConfig.actionRoute) {
      navigate(currentConfig.actionRoute);
      closeWizard();
    }
  };

  const handleComplete = () => {
    completeStep(progress.currentStep);
  };

  const handleSkip = () => {
    skipStep();
  };

  const handlePrevious = () => {
    const prevStep = allSteps[currentIndex - 1];
    if (prevStep) {
      goToStep(prevStep);
    }
  };

  const handleFinish = () => {
    closeWizard();
  };

  const isFirstStep = progress.currentStep === 'welcome';
  const isLastStep = progress.currentStep === 'complete';
  const isActionStep = currentConfig.actionRoute && !isLastStep;

  return (
    <Dialog open={isWizardOpen} onOpenChange={closeWizard}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {/* Header with Progress */}
        <div className="bg-muted/30 px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="text-lg font-semibold">
              Primeiros Passos
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={closeWizard}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2 mb-2">
            {allSteps.slice(1, -1).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors cursor-pointer",
                    progress.completedSteps.includes(step)
                      ? "bg-green-500 text-white"
                      : step === progress.currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  onClick={() => goToStep(step)}
                >
                  {progress.completedSteps.includes(step) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < allSteps.slice(1, -1).length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    progress.completedSteps.includes(step) ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          
          <Progress value={progressPercentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount} de {totalSteps} passos concluídos
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {currentConfig.icon}
            </div>
            <h2 className="text-xl font-bold mb-2">{currentConfig.title}</h2>
            <p className="text-muted-foreground">{currentConfig.description}</p>
          </div>

          {/* Tips */}
          {currentConfig.tips && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium mb-2">💡 Dicas:</p>
              <ul className="space-y-1">
                {currentConfig.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button */}
          {isActionStep && (
            <Button
              onClick={handleAction}
              className="w-full mb-4"
              size="lg"
            >
              {currentConfig.actionLabel}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div>
            {!isFirstStep && !isLastStep && (
              <Button variant="ghost" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isLastStep && !isFirstStep && (
              <Button variant="outline" onClick={handleSkip}>
                Pular
              </Button>
            )}
            
            {isFirstStep && (
              <Button onClick={handleComplete}>
                Começar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {!isFirstStep && !isLastStep && (
              <Button onClick={handleComplete}>
                Concluir Passo
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {isLastStep && (
              <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                Finalizar
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
