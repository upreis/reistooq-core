import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
import InsumosPage from "./InsumosPage";
import { Layers, PackageCheck, Store } from "lucide-react";
import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { LocalVendaSelector } from "@/components/estoque/LocalVendaSelector";
import { useLocalEstoqueAtivo } from "@/hooks/useLocalEstoqueAtivo";
import { useLocalVendaAtivo } from "@/hooks/useLocalVendaAtivo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

export default function ComposicoesUnificadasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("produtos");
  const [reloadKey, setReloadKey] = useState(0);
  const { localAtivo } = useLocalEstoqueAtivo();
  const { localVendaAtivo } = useLocalVendaAtivo();
  const isMobile = useIsMobile();

  const isInsumosPage = location.pathname === '/estoque/insumos';

  // ✅ Garantir que o local de venda respeita o estoque selecionado
  // (evita “vazar” composições para outros estoques)
  const localVendaIdDoEstoqueAtual =
    localAtivo?.id && localVendaAtivo?.local_estoque_id === localAtivo.id
      ? localVendaAtivo.id
      : undefined;

  // Sync tab with route
  useEffect(() => {
    if (isInsumosPage) {
      setActiveTab('insumos');
    } else {
      setActiveTab('produtos');
    }
  }, [isInsumosPage]);

  // Reload data when local changes
  useEffect(() => {
    setReloadKey(prev => prev + 1);
  }, [localAtivo?.id, localVendaAtivo?.id]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'insumos') {
      navigate('/estoque/insumos');
    } else {
      navigate('/estoque/composicoes');
    }
  };

  // Se for a página de insumos, renderiza diretamente sem abas
  if (isInsumosPage) {
    return (
      <div className="space-y-6">
        {/* Seletor de Local de Estoque - Ocultar no mobile */}
        {!isMobile && (
          <div className="space-y-4 pb-4 border-b">
            {/* Linha 1: Local de Estoque */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
                <span className="font-medium">📦 Estoque:</span>
              </div>
              <LocalEstoqueSelector hidePrincipal />
              {localAtivo && (
                <span className="text-xs text-muted-foreground">
                  Visualizando: <strong className="text-foreground">{localAtivo.nome}</strong>
                </span>
              )}
            </div>

            <Separator />

            {/* Linha 2: Local de Venda */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
                <Store className="h-4 w-4" />
                <span className="font-medium">Venda:</span>
              </div>
              {localAtivo && (
                <LocalVendaSelector 
                  localEstoqueId={localAtivo.id} 
                  localEstoqueNome={localAtivo.nome} 
                />
              )}
              {localVendaAtivo && (
                <span className="text-xs text-muted-foreground">
                  Composições de: <strong className="text-foreground">{localVendaAtivo.nome}</strong>
                </span>
              )}
            </div>
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

        {/* Renderiza diretamente o InsumosPage sem abas */}
        <InsumosPage
          localId={localAtivo?.id}
          localVendaId={localVendaIdDoEstoqueAtual}
          hideHeader
          key={`insumos-${reloadKey}`}
        />
      </div>
    );
  }

  // Página de composições - renderiza diretamente sem abas
  // Nesta página mostramos o seletor de estoque SEM o Estoque Principal (hidePrincipal)
  return (
    <div className="space-y-6">
      {/* Seletor de Estoque (sem Principal) e Local de Venda - Ocultar no mobile */}
      {!isMobile && (
        <div className="space-y-4 pb-4 border-b">
          {/* Linha 1: Local de Estoque (sem o Principal) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
              <span className="font-medium">📦 Estoque:</span>
            </div>
            <LocalEstoqueSelector hidePrincipal />
            {localAtivo && (
              <span className="text-xs text-muted-foreground">
                Visualizando: <strong className="text-foreground">{localAtivo.nome}</strong>
              </span>
            )}
          </div>

          <Separator />

          {/* Linha 2: Local de Venda */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
              <Store className="h-4 w-4" />
              <span className="font-medium">Venda:</span>
            </div>
            {localAtivo && (
              <LocalVendaSelector 
                localEstoqueId={localAtivo.id} 
                localEstoqueNome={localAtivo.nome}
              />
            )}
            {localVendaAtivo && (
              <span className="text-xs text-muted-foreground">
                Composições de: <strong className="text-foreground">{localVendaAtivo.nome}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Renderiza diretamente o ComposicoesEstoque sem abas */}
      <ComposicoesEstoque 
        localId={localAtivo?.id} 
        localVendaId={localVendaIdDoEstoqueAtual}
        key={`produtos-${reloadKey}`} 
      />
    </div>
  );
}
