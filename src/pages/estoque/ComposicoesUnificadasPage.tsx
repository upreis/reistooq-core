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
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span>Estoque</span>
          <span>/</span>
          <span className="text-primary font-medium">Composições</span>
        </div>
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Composições</h1>
            <p className="text-muted-foreground max-w-2xl">
              Gerencie composições de produtos e insumos por pedido
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {activeTab === "produtos" ? "Composições de Produtos" : "Composições de Insumos"}
            </h2>
            <p className="text-muted-foreground max-w-xl">
              {activeTab === "produtos" 
                ? "Gerencie as composições dos seus produtos, defina componentes e monitore custos"
                : "Gerencie as composições dos seus Insumos, defina componentes e monitore custos"
              }
            </p>
          </div>
        </div>
      </div>

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
