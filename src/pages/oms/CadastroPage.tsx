import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomersPage from "./CustomersPage";
import SalesRepsPage from "./SalesRepsPage";

export default function CadastroPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "clientes";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="vendedores" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Vendedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-6">
          <CustomersPage />
        </TabsContent>

        <TabsContent value="vendedores" className="mt-6">
          <SalesRepsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
