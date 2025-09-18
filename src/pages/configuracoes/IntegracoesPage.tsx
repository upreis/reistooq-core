// 🎯 Página de configurações unificada - arquitetura otimizada
// Substitui a versão monolítica antiga com melhorias de performance e UX

import { IntegrationsHub } from '@/features/integrations/components/IntegrationsHub/IntegrationsHub';
import { MLDiagnosticsTest } from '@/features/integrations/components/MLDiagnosticsTest';
import { PermissionFixer } from '@/components/integrations/PermissionFixer';

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      <PermissionFixer />
      <MLDiagnosticsTest />
      <IntegrationsHub />
    </div>
  );
}