import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Filter, RefreshCw, Plus } from 'lucide-react';

interface OrdersEmptyProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  onCreateOrder?: () => void;
}

export function OrdersEmpty({ 
  hasFilters = false,
  onClearFilters,
  onRefresh,
  onCreateOrder
}: OrdersEmptyProps) {
  
  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">
              Nenhum pedido encontrado
            </h3>
            
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Não encontramos pedidos que correspondam aos filtros aplicados. 
              Tente ajustar os critérios de busca ou limpe os filtros.
            </p>
            
            <div className="flex items-center justify-center gap-3">
              {onClearFilters && (
                <Button variant="outline" onClick={onClearFilters} className="gap-2">
                  <Filter className="w-4 h-4" />
                  Limpar Filtros
                </Button>
              )}
              
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
              )}
            </div>
            
            {/* Suggestions */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
              <h4 className="font-medium mb-2 text-sm">💡 Dicas de busca:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Verifique se as datas estão corretas</li>
                <li>• Tente expandir o período de busca</li>
                <li>• Remova filtros de status específicos</li>
                <li>• Verifique a ortografia na busca por texto</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <ShoppingCart className="w-10 h-10 text-primary" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-3">
              Nenhum pedido encontrado
            </h3>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Você ainda não possui pedidos cadastrados no sistema. 
              Quando receber seus primeiros pedidos, eles aparecerão aqui.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-3">
              {onCreateOrder && (
                <Button onClick={onCreateOrder} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Pedido
                </Button>
              )}
              
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
              )}
            </div>
            
            {/* Getting started guide */}
            <div className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg text-left max-w-lg mx-auto">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                🚀 Como começar?
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">1</div>
                  <div>
                    <p className="font-medium">Configure suas integrações</p>
                    <p className="text-muted-foreground">Conecte Mercado Livre, Shopee ou outros marketplaces</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">2</div>
                  <div>
                    <p className="font-medium">Sincronize seus pedidos</p>
                    <p className="text-muted-foreground">Os pedidos serão importados automaticamente</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">3</div>
                  <div>
                    <p className="font-medium">Gerencie tudo em um lugar</p>
                    <p className="text-muted-foreground">Visualize, filtre e processe pedidos facilmente</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}