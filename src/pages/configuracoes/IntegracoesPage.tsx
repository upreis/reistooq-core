// 🎯 Página de configurações unificada - arquitetura otimizada
// Substitui a versão monolítica antiga com melhorias de performance e UX

import { IntegrationsHub } from '@/features/integrations/components/IntegrationsHub/IntegrationsHub';

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      <IntegrationsHub />
    </div>
  );
}