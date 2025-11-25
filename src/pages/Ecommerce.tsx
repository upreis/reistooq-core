import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { EcommerceNav } from "@/features/ecommerce/components/EcommerceNav";
import Shop from "@/pages/Shop";
import ProductList from "@/pages/ProductList";
import AddProduct from "@/pages/AddProduct";
import ProductImport from "@/pages/ProductImport";

const Ecommerce = () => {
  const location = useLocation();
  
  const renderContent = () => {
    return (
      <Routes>
        <Route index element={<Navigate to="shop" replace />} />
        <Route path="shop" element={<Shop />} />
        <Route path="list" element={<ProductList />} />
        <Route path="addproduct" element={<AddProduct />} />
        <Route path="import" element={<ProductImport />} />
        <Route path="*" element={<Navigate to="shop" replace />} />
      </Routes>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Ecommerce;