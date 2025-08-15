// PostHog analytics configuration
const isDev = import.meta.env.NODE_ENV !== 'production';

export const initAnalytics = () => {
  if (isDev) {
    console.log('Analytics disabled in development');
    return;
  }
  
  // PostHog initialization would go here for production
};

export const trackEvent = (event: string, properties?: any) => {
  if (isDev) return;
  // Track events in production only
};