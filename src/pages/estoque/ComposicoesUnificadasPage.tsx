import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposicoesEstoque } from "@/components/estoque/ComposicoesEstoque";
import InsumosPage from "./InsumosPage";
import { Store, Info, ChevronDown, ChevronUp, AlertCircle, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocalEstoqueSelector } from "@/components/estoque/LocalEstoqueSelector";
import { LocalVendaSelector } from "@/components/estoque/LocalVendaSelector";
import { useLocalEstoqueAtivo } from "@/hooks/useLocalEstoqueAtivo";
import { useLocalVendaAtivo } from "@/hooks/useLocalVendaAtivo";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

export default function ComposicoesUnificadasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("produtos");
  const [reloadKey, setReloadKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
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
          </div>

          <Separator />

          {/* Linha 2: Composição Padrão + Separador + Local de Venda */}
          <div className="flex items-center gap-4">
            {/* Composição Padrão */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Kits e Unitários</span>
              <Button
                variant="outline"
                className="gap-2 h-8 px-3 text-sm bg-background border-border"
                disabled
              >
                <Boxes className="h-4 w-4" />
                Composição Padrão
              </Button>
            </div>

            {/* Separador vertical */}
            <Separator orientation="vertical" className="h-12" />

            {/* Local de Venda */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Store className="h-3 w-3" />
                <span>Venda:</span>
              </div>
              {localAtivo && (
                <LocalVendaSelector 
                  localEstoqueId={localAtivo.id} 
                  localEstoqueNome={localAtivo.nome}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aviso informativo sobre como funciona */}
      {!isMobile && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className="text-muted-foreground hover:text-foreground gap-1 h-auto py-1 px-2"
          >
            <Info className="h-4 w-4" />
            <span className="text-xs">Como funciona?</span>
            {showInfo ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          
          {showInfo && (
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Na página <strong>Produtos</strong> você terá os produtos e suas composições que sairão do estoque. 
                Porém, se tiver tipos de vendas em que sai mais insumos que outros, você precisa cadastrar na página{" "}
                <strong>Insumos</strong> para que seja calculada a saída do estoque de acordo com o local de venda.
              </AlertDescription>
            </Alert>
          )}
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
