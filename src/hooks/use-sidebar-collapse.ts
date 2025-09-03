import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export function useSidebarCollapse(defaultCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const isMobile = useIsMobile();

  // Automatically collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return {
    isCollapsed,
    toggleCollapse,
    setIsCollapsed
  };
}