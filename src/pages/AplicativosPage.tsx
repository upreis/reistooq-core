import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Grid3X3 } from "lucide-react";
import { AplicativosNav } from "@/features/aplicativos/components/AplicativosNav";
import { AplicativosStats } from "@/features/aplicativos/components/AplicativosStats";
import AplicativosCalendario from "./aplicativos/AplicativosCalendario";
import AplicativosNotas from "./aplicativos/AplicativosNotas";

const AplicativosContent = () => {
  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Grid3X3 className="h-4 w-4" />
        <span>/</span>
        <span className="text-primary">Aplicativos</span>
      </div>

      {/* 2. Navigation tabs */}
      <AplicativosNav />

      {/* 3. Stats cards */}
      <AplicativosStats />
      
      {/* 4. Conteúdo das rotas */}
      <div className="mt-6">
        <Routes>
          <Route index element={<Navigate to="calendario" replace />} />
          <Route path="calendario" element={<AplicativosCalendario />} />
          <Route path="notas" element={<AplicativosNotas />} />
          <Route path="*" element={<Navigate to="calendario" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const AplicativosPage: React.FC = () => {
  return <AplicativosContent />;
};

export default AplicativosPage;