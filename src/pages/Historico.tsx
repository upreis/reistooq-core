// src/pages/Historico.tsx
import { HistoricoPageLayout } from "@/features/historico/components/HistoricoPageLayout";

export default function Historico() {
  console.info('HISTORICO live', new Date().toISOString());
  return <HistoricoPageLayout />; 
}