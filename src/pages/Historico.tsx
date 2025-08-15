// src/pages/Historico.tsx
import { HistoricoNewPageLayout } from "@/features/historico/components/HistoricoNewPageLayout";

export default function Historico() {
  console.info('HISTORICO refatorado', new Date().toISOString());
  return <HistoricoNewPageLayout />; 
}