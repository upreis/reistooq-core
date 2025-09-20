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
        .select('onboarding_banner_dismissed, created_at')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      const isNewUser = profile?.created_at && 
        new Date(profile.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Últimas 24h

      setStatus({
        isRequired: isNewUser && !profile?.onboarding_banner_dismissed,
        isCompleted: profile?.onboarding_banner_dismissed || false,
        completedAt: profile?.created_at,
        loading: false
      });

      logger.debug('Onboarding status checked', {
        userId: user?.id,
        isRequired: isNewUser && !profile?.onboarding_banner_dismissed,
        isCompleted: profile?.onboarding_banner_dismissed
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
          onboarding_banner_dismissed: true
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