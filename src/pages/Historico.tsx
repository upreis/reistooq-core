// 🛡️ PÁGINA PROTEGIDA - Sistema de Permissões Ativo
import { HistoricoGuard } from '@/core/historico/guards/HistoricoGuard';
import { HistoricoSimplePage } from "@/features/historico/components/HistoricoSimplePage";

export default function Historico() {
  return (
    <HistoricoGuard>
      <HistoricoSimplePage />
    </HistoricoGuard>
  );
}