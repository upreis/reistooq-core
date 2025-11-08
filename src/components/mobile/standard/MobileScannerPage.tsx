import React from 'react';
import { MobileAppShell } from './MobileAppShell';
import Scanner from '@/pages/Scanner';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Mobile-optimized wrapper for Scanner page
 * Uses MobileAppShell for consistent mobile experience
 */
export const MobileScannerPage = () => {
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return <Scanner />;
  }

  return (
    <MobileAppShell 
      title="Scanner" 
      showBottomNav={true}
    >
      <Scanner />
    </MobileAppShell>
  );
};
