import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { EcommerceNav } from "@/features/ecommerce/components/EcommerceNav";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import ProductList from "@/pages/ProductList";
import AddProduct from "@/pages/AddProduct";
import EditProduct from "@/pages/EditProduct";
import ProductImport from "@/pages/ProductImport";

const Ecommerce = () => {
  const location = useLocation();
  
  const renderContent = () => {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/apps/ecommerce/shop" replace />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/detail/:id" element={<ProductDetail />} />
        <Route path="/list" element={<ProductList />} />
        <Route path="/addproduct" element={<AddProduct />} />
        <Route path="/editproduct" element={<EditProduct />} />
        <Route path="/import" element={<ProductImport />} />
        <Route path="*" element={<Navigate to="/apps/ecommerce/shop" replace />} />
      </Routes>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>📦</span>
        <span>/</span>
        <span className="text-primary">Cadastro de Produtos</span>
      </div>

      <EcommerceNav />
      
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Ecommerce;