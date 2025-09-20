import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface OnboardingStatus {
  isRequired: boolean;
  isCompleted: boolean;
  currentStep?: string;
  completedAt?: string;
  loading: boolean;
  error?: string;
}

export const useOnboarding = () => {
  const [status, setStatus] = useState<OnboardingStatus>({
    isRequired: false,
    isCompleted: false,
    loading: true
  });
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;

    checkOnboardingStatus();
  }, [user, authLoading]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_completed_at, created_at')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      const isNewUser = profile.created_at && 
        new Date(profile.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Últimas 24h

      setStatus({
        isRequired: isNewUser && !profile.onboarding_completed,
        isCompleted: profile.onboarding_completed || false,
        completedAt: profile.onboarding_completed_at,
        loading: false
      });

      logger.debug('Onboarding status checked', {
        userId: user?.id,
        isRequired: isNewUser && !profile.onboarding_completed,
        isCompleted: profile.onboarding_completed
      });

    } catch (error) {
      logger.error('Failed to check onboarding status', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao verificar status do onboarding'
      }));
    }
  };

  const markAsCompleted = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      setStatus(prev => ({
        ...prev,
        isRequired: false,
        isCompleted: true,
        completedAt: new Date().toISOString()
      }));

      logger.info('Onboarding marked as completed', { userId: user?.id });

    } catch (error) {
      logger.error('Failed to mark onboarding as completed', error);
      throw error;
    }
  };

  const skipOnboarding = async () => {
    await markAsCompleted();
  };

  return {
    ...status,
    markAsCompleted,
    skipOnboarding,
    refresh: checkOnboardingStatus
  };
};