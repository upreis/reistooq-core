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
        <TabsList className="grid w-full max-w-md grid-cols-2 h-8">
          <TabsTrigger value="clientes" className="flex items-center gap-1.5 h-7 text-xs px-2.5">
            <Users className="h-3.5 w-3.5" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="vendedores" className="flex items-center gap-1.5 h-7 text-xs px-2.5">
            <UserCheck className="h-3.5 w-3.5" />
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
