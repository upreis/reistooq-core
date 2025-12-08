import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Grid3X3 } from "lucide-react";
import { AplicativosGuard } from "@/core/aplicativos/guards/AplicativosGuard";
import { AplicativosNav } from "@/features/aplicativos/components/AplicativosNav";
import { AplicativosStats } from "@/features/aplicativos/components/AplicativosStats";
import AplicativosCalendario from "./aplicativos/AplicativosCalendario";
import AplicativosNotas from "./aplicativos/AplicativosNotas";
import Scanner from "./Scanner";

const AplicativosContent = () => {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <AplicativosStats />
      
      {/* 4. Conteúdo das rotas */}
      <div className="mt-6">
        <Routes>
          <Route index element={<Navigate to="calendario" replace />} />
          <Route path="calendario" element={<AplicativosCalendario />} />
          <Route path="notas" element={<AplicativosNotas />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="*" element={<Navigate to="calendario" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const AplicativosPage: React.FC = () => {
  return (
    <AplicativosGuard>
      <AplicativosContent />
    </AplicativosGuard>
  );
};

export default AplicativosPage;