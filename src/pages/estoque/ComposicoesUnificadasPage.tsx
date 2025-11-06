import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
import InsumosPage from "./InsumosPage";
import { Layers, PackageCheck } from "lucide-react";
import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { GerenciarLocaisModal } from "@/components/estoque/GerenciarLocaisModal";

export default function ComposicoesUnificadasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("produtos");

  // Sync tab with route
  useEffect(() => {
    if (location.pathname === '/estoque/insumos') {
      setActiveTab('insumos');
    } else {
      setActiveTab('produtos');
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'insumos') {
      navigate('/estoque/insumos');
    } else {
      navigate('/estoque/composicoes');
    }
  };

  const handleLocalChange = () => {
    window.dispatchEvent(new Event('reload-locais-estoque'));
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Local de Estoque */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b">
        <LocalEstoqueSelector key={`selector-${Date.now()}`} />
        <GerenciarLocaisModal onSuccess={handleLocalChange} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="produtos" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="insumos" className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            Insumos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="mt-6">
          <ComposicoesEstoque />
        </TabsContent>

        <TabsContent value="insumos" className="mt-6">
          <InsumosPage hideHeader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
