import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type OnboardingStep = 
  | 'welcome'
  | 'connect-marketplace'
  | 'register-products'
  | 'configure-stock'
  | 'understand-dashboard'
  | 'configure-alerts'
  | 'complete';

interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isCompleted: boolean;
  bannerDismissed: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'connect-marketplace',
  'register-products',
  'configure-stock',
  'understand-dashboard',
  'configure-alerts',
  'complete'
];

const STEP_LABELS: Record<OnboardingStep, string> = {
  'welcome': 'Bem-vindo',
  'connect-marketplace': 'Conectar Marketplace',
  'register-products': 'Cadastrar Produtos',
  'configure-stock': 'Configurar Estoque',
  'understand-dashboard': 'Entender o Dashboard',
  'configure-alerts': 'Configurar Alertas',
  'complete': 'Concluído'
};

const DEFAULT_PROGRESS: OnboardingProgress = {
  currentStep: 'welcome',
  completedSteps: [],
  isCompleted: false,
  bannerDismissed: false
};

export function useOnboarding() {
  const [progress, setProgress] = useState<OnboardingProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Load progress from Supabase
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_completed_at, onboarding_banner_dismissed')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Load local storage for step progress
          const savedProgress = localStorage.getItem(`onboarding_progress_${user.id}`);
          const localProgress = savedProgress ? JSON.parse(savedProgress) : null;

          setProgress({
            currentStep: localProgress?.currentStep || 'welcome',
            completedSteps: localProgress?.completedSteps || [],
            isCompleted: profile.onboarding_completed || false,
            bannerDismissed: profile.onboarding_banner_dismissed || false
          });
        }
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Save progress to localStorage and Supabase
  const saveProgress = useCallback(async (newProgress: Partial<OnboardingProgress>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedProgress = { ...progress, ...newProgress };
    setProgress(updatedProgress);

    // Save to localStorage for step tracking
    localStorage.setItem(`onboarding_progress_${user.id}`, JSON.stringify({
      currentStep: updatedProgress.currentStep,
      completedSteps: updatedProgress.completedSteps
    }));

    // Save completion status to Supabase
    if (newProgress.isCompleted !== undefined || newProgress.bannerDismissed !== undefined) {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: updatedProgress.isCompleted,
          onboarding_completed_at: updatedProgress.isCompleted ? new Date().toISOString() : null,
          onboarding_banner_dismissed: updatedProgress.bannerDismissed
        })
        .eq('id', user.id);
    }
  }, [progress]);

  const goToStep = useCallback((step: OnboardingStep) => {
    saveProgress({ currentStep: step });
  }, [saveProgress]);

  const completeStep = useCallback((step: OnboardingStep) => {
    const newCompletedSteps = [...new Set([...progress.completedSteps, step])];
    const currentIndex = ONBOARDING_STEPS.indexOf(step);
    const nextStep = ONBOARDING_STEPS[currentIndex + 1] || 'complete';
    
    saveProgress({
      completedSteps: newCompletedSteps,
      currentStep: nextStep,
      isCompleted: nextStep === 'complete'
    });
  }, [progress.completedSteps, saveProgress]);

  const skipStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEPS.indexOf(progress.currentStep);
    const nextStep = ONBOARDING_STEPS[currentIndex + 1] || 'complete';
    
    saveProgress({
      currentStep: nextStep,
      isCompleted: nextStep === 'complete'
    });
  }, [progress.currentStep, saveProgress]);

  const dismissBanner = useCallback(() => {
    saveProgress({ bannerDismissed: true });
  }, [saveProgress]);

  const resetOnboarding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    localStorage.removeItem(`onboarding_progress_${user.id}`);
    setProgress(DEFAULT_PROGRESS);

    await supabase
      .from('profiles')
      .update({
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_banner_dismissed: false
      })
      .eq('id', user.id);
  }, []);

  const openWizard = useCallback(() => setIsWizardOpen(true), []);
  const closeWizard = useCallback(() => setIsWizardOpen(false), []);

  const getStepNumber = (step: OnboardingStep) => ONBOARDING_STEPS.indexOf(step);
  const totalSteps = ONBOARDING_STEPS.length - 2; // Exclude 'welcome' and 'complete'
  const completedCount = progress.completedSteps.filter(s => s !== 'welcome' && s !== 'complete').length;

  return {
    progress,
    isLoading,
    isWizardOpen,
    openWizard,
    closeWizard,
    goToStep,
    completeStep,
    skipStep,
    dismissBanner,
    resetOnboarding,
    getStepNumber,
    totalSteps,
    completedCount,
    stepLabels: STEP_LABELS,
    allSteps: ONBOARDING_STEPS,
    showReminder: !progress.isCompleted && !progress.bannerDismissed && !isLoading
  };
}
