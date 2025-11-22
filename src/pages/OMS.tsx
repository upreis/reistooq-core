import { useLocation } from "react-router-dom";
import { OMSNav } from "@/features/oms/components/OMSNav";
import OrdersPage from "@/pages/oms/OrdersPage";
import CustomersPage from "@/pages/oms/CustomersPage";
import SalesRepsPage from "@/pages/oms/SalesRepsPage";
import OMSSettingsPage from "@/pages/oms/OMSSettingsPage";

const OMS = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const renderContent = () => {
    if (currentPath.includes('/pedidos')) return <OrdersPage />;
    if (currentPath.includes('/clientes')) return <CustomersPage />;
    if (currentPath.includes('/vendedores')) return <SalesRepsPage />;
    if (currentPath.includes('/configuracoes')) return <OMSSettingsPage />;
    return <OrdersPage />;
  };

  return (
    <div className="space-y-6">
      <OMSNav />
      {renderContent()}
    </div>
  );
};

export default OMS;