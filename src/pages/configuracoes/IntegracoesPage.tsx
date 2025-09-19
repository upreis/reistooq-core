// 🎯 Página de configurações unificada - arquitetura otimizada
// Substitui a versão monolítica antiga com melhorias de performance e UX

import { IntegrationsHubSimple } from '@/features/integrations/components/IntegrationsHub/IntegrationsHubSimple';

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      <IntegrationsHubSimple />
    </div>
  );
}