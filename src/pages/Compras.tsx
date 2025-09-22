import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Building2, 
  FileText, 
  Upload, 
  Package, 
  TrendingUp,
  Users,
  ClipboardList,
  FileSpreadsheet,
  FileX,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Componentes específicos do sistema de compras
import { FornecedoresTab } from "@/components/compras/FornecedoresTab";
import { PedidosCompraTab } from "@/components/compras/PedidosCompraTab";
import { CotacoesTab } from "@/components/compras/CotacoesTab";
import { ImportacaoTab } from "@/components/compras/ImportacaoTab";
import { ComprasStats } from "@/components/compras/ComprasStats";
import { ComprasFilters } from "@/components/compras/ComprasFilters";

const Compras = () => {
  const [activeTab, setActiveTab] = useState("fornecedores");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFornecedor, setSelectedFornecedor] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { toast } = useToast();

  // Estados para dados
  const [fornecedores, setFornecedores] = useState([]);
  const [pedidosCompra, setPedidosCompra] = useState([]);
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Carregar dados dos fornecedores, pedidos, etc.
      // Implementar chamadas para a API
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de compras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedFornecedor("all");
    setDateRange({ start: "", end: "" });
  };

  const hasActiveFilters = searchTerm !== "" || selectedStatus !== "all" || 
                          selectedFornecedor !== "all" || dateRange.start !== "" || dateRange.end !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <div className="hidden md:block relative overflow-hidden bg-gradient-to-r from-primary/3 via-primary/5 to-primary/3 border-b border-border/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
        <div className="relative container mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
            <ShoppingCart className="h-4 w-4" />
            <span>/</span>
            <span className="text-foreground font-medium">Sistema de Compras</span>
          </nav>

          {/* Header com título */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
            <div className="space-y-3 flex-1 min-w-[300px]">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Sistema de Compras
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie fornecedores, pedidos de compra e integre automaticamente com o estoque
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <ComprasStats 
            fornecedores={fornecedores}
            pedidosCompra={pedidosCompra}
            cotacoes={cotacoes}
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-3 md:px-6 py-2 md:py-8 max-w-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Header */}
          <div className="flex items-center gap-2 mb-4 md:mb-8">
            <div className="flex-1 md:w-auto">
              <TabsList className="grid w-full md:w-auto grid-cols-4 h-10 md:h-12 bg-muted/30 backdrop-blur-sm border border-border/50">
                <TabsTrigger 
                  value="fornecedores" 
                  className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs md:text-sm font-medium"
                >
                  <Building2 className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Fornecedores</span>
                  <span className="sm:hidden">Forn.</span>
                  <Badge variant="secondary" className="ml-1 md:ml-2 text-xs px-1.5 md:px-2 py-0.5">
                    {fornecedores.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="pedidos" 
                  className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs md:text-sm font-medium"
                >
                  <ClipboardList className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Pedidos</span>
                  <span className="sm:hidden">Ped.</span>
                  <Badge variant="secondary" className="ml-1 md:ml-2 text-xs px-1.5 md:px-2 py-0.5">
                    {pedidosCompra.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="cotacoes" 
                  className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs md:text-sm font-medium"
                >
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Cotações</span>
                  <span className="sm:hidden">Cot.</span>
                  <Badge variant="secondary" className="ml-1 md:ml-2 text-xs px-1.5 md:px-2 py-0.5">
                    {cotacoes.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="importacao" 
                  className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 text-xs md:text-sm font-medium"
                >
                  <Upload className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Importação</span>
                  <span className="sm:hidden">Imp.</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Filtros Globais */}
          <div className="space-y-3 md:space-y-0 md:flex md:gap-4 md:items-start mb-6">
            <div className="flex gap-2 md:flex-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 bg-background/60 border-border/60 h-9 md:h-10 text-sm"
                  />
                </div>
              </div>
              
              <ComprasFilters
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedFornecedor={selectedFornecedor}
                onFornecedorChange={setSelectedFornecedor}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
                fornecedores={fornecedores}
              />
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          <TabsContent value="fornecedores" className="space-y-6">
            <FornecedoresTab 
              fornecedores={fornecedores}
              searchTerm={searchTerm}
              selectedStatus={selectedStatus}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-6">
            <PedidosCompraTab 
              pedidosCompra={pedidosCompra}
              fornecedores={fornecedores}
              searchTerm={searchTerm}
              selectedStatus={selectedStatus}
              selectedFornecedor={selectedFornecedor}
              dateRange={dateRange}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="cotacoes" className="space-y-6">
            <CotacoesTab 
              cotacoes={cotacoes}
              fornecedores={fornecedores}
              searchTerm={searchTerm}
              selectedStatus={selectedStatus}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="importacao" className="space-y-6">
            <ImportacaoTab 
              onImportSuccess={loadData}
              fornecedores={fornecedores}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Compras;