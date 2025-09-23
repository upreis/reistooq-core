// 🛡️ PÁGINA PROTEGIDA - Sistema de Permissões Ativo
import React from 'react';
import { ComprasGuard } from '@/core/compras/guards/ComprasGuard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Building2, FileText, Upload } from "lucide-react";

const ComprasContent = () => {
  return (
    <div className="flex flex-col space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-card rounded-lg border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Sistema de Compras
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie fornecedores, cotações e pedidos de compra
            </p>
          </div>
        </div>
      </div>

      {/* Cards de módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Cadastro e gestão de fornecedores
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Pedidos de compra em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Solicitações de cotação ativas
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Importações</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Importação de dados de compras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ✅ Você tem acesso ao sistema de compras! 
            Aqui você pode gerenciar fornecedores, pedidos de compra, cotações e importações.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const Compras = () => {
  return (
    <ComprasGuard>
      <ComprasContent />
    </ComprasGuard>
  );
};

export default Compras;