import { useState } from "react";
import { IntelligentDashboard } from "@/features/dashboard";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Dashboard</span>
      </div>

      <IntelligentDashboard />
    </div>
  );
};

export default Dashboard;