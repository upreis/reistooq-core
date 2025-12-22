import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
import InsumosPage from "./InsumosPage";
import { Layers, PackageCheck } from "lucide-react";
import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { useLocalEstoqueAtivo } from "@/hooks/useLocalEstoqueAtivo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ComposicoesUnificadasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("produtos");
  const [reloadKey, setReloadKey] = useState(0);
  const { localAtivo } = useLocalEstoqueAtivo();
  const isMobile = useIsMobile();

  // Sync tab with route
  useEffect(() => {
    if (location.pathname === '/estoque/insumos') {
      setActiveTab('insumos');
    } else {
      setActiveTab('produtos');
    }
  }, [location.pathname]);

  // Reload data when local changes
  useEffect(() => {
    setReloadKey(prev => prev + 1);
  }, [localAtivo?.id]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'insumos') {
      navigate('/estoque/insumos');
    } else {
      navigate('/estoque/composicoes');
    }
  };


  return (
    <div className="space-y-6">
      {/* Seletor de Local de Estoque - Ocultar no mobile */}
      {!isMobile && (
        <div className="flex items-center gap-4 pb-4 border-b">
          <LocalEstoqueSelector />
          {localAtivo && (
            <span className="text-sm text-muted-foreground">
              📍 Visualizando: <strong className="text-foreground">{localAtivo.nome}</strong>
            </span>
          )}
        </div>
      )}

      {/* Alerta se nenhum local selecionado - Ocultar no mobile */}
      {!isMobile && !localAtivo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione um local de estoque para visualizar e gerenciar as composições.
          </AlertDescription>
        </Alert>
      )}

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
          <ComposicoesEstoque localId={localAtivo?.id} key={`produtos-${reloadKey}`} />
        </TabsContent>

        <TabsContent value="insumos" className="mt-6">
          <InsumosPage localId={localAtivo?.id} hideHeader key={`insumos-${reloadKey}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
