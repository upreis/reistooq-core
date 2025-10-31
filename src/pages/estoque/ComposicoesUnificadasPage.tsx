import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
import InsumosPage from "./InsumosPage";
import { Layers, PackageCheck } from "lucide-react";

export default function ComposicoesUnificadasPage() {
  const [activeTab, setActiveTab] = useState("produtos");

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
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Composições</h1>
          <p className="text-muted-foreground max-w-2xl">
            Gerencie composições de produtos e insumos por pedido
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          <ComposicoesEstoque hideHeader />
        </TabsContent>

        <TabsContent value="insumos" className="mt-6">
          <InsumosPage hideHeader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
