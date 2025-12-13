import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Rocket, X, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface OnboardingReminderProps {
  variant?: 'banner' | 'card';
  className?: string;
}

export function OnboardingReminder({ variant = 'banner', className }: OnboardingReminderProps) {
  const {
    showReminder,
    openWizard,
    dismissBanner,
    completedCount,
    totalSteps,
    progress
  } = useOnboarding();

  if (!showReminder) return null;

  const progressPercentage = (completedCount / totalSteps) * 100;

  if (variant === 'banner') {
    return (
      <div className={cn(
        "bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between gap-4",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 rounded-full p-2">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Complete a configuração inicial
            </p>
            <p className="text-xs text-muted-foreground">
              {completedCount} de {totalSteps} passos concluídos
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Progress value={progressPercentage} className="w-24 h-2" />
          <Button size="sm" onClick={openWizard}>
            Continuar
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={dismissBanner}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20", className)}>
      <div className="flex items-start gap-4">
        <div className="bg-primary/20 rounded-full p-3 flex-shrink-0">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">Primeiros Passos</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete a configuração inicial para aproveitar todas as funcionalidades do sistema.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 -mt-1 -mr-1"
              onClick={dismissBanner}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{completedCount}/{totalSteps} passos</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <Button className="mt-4 w-full" onClick={openWizard}>
            {completedCount === 0 ? 'Começar Configuração' : 'Continuar Configuração'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
