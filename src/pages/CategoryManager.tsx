// Página para gerenciar categorias hierárquicas
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HierarchicalCategoryManager } from '@/features/products/components/HierarchicalCategoryManager';

export default function CategoryManager() {
  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/estoque">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
            <p className="text-muted-foreground">
              Configure a estrutura hierárquica de categorias: Categoria Principal → Categoria → Subcategoria
            </p>
          </div>
        </div>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Como Funciona a Estrutura Hierárquica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-primary mb-2">1. Categoria Principal</div>
              <p className="text-sm text-muted-foreground">
                Ex: Eletrônicos, Roupas, Casa & Jardim
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-primary mb-2">2. Categoria</div>
              <p className="text-sm text-muted-foreground">
                Ex: Smartphones, Tablets, Notebooks
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-primary mb-2">3. Subcategoria</div>
              <p className="text-sm text-muted-foreground">
                Ex: iPhone, Samsung Galaxy, Xiaomi
              </p>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Exemplo de estrutura completa:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>📱 Eletrônicos → Smartphones → iPhone</div>
              <div>📱 Eletrônicos → Smartphones → Samsung Galaxy</div>
              <div>👕 Roupas → Camisetas → Manga Longa</div>
              <div>🏠 Casa & Jardim → Decoração → Vasos</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Todos os produtos devem ser associados a uma categoria completa. 
              Se você tiver produtos com categorias diferentes, será necessário criar a estrutura hierárquica correspondente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciador */}
      <HierarchicalCategoryManager />
    </div>
  );
}