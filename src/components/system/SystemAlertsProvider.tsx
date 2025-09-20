import React from 'react';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { config } from '@/config/environment';

export const SystemAlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sistema de alertas automáticos (apenas para admins)
  const { permissions } = useUserPermissions();
  const hasAdminAccess = permissions.includes('admin:access') || permissions.includes('system:admin');
  useSystemAlerts(hasAdminAccess && config.features.enableErrorReporting);

  return <>{children}</>;
};