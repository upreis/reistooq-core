// src/pages/Historico.tsx - Versão simplificada
import { HistoricoSimplePage } from "@/features/historico/components/HistoricoSimplePage";

export default function Historico() {
  console.info('HISTORICO simplificado carregado', new Date().toISOString());
  return <HistoricoSimplePage />; 
}