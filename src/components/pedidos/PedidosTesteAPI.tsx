import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, DollarSign, Truck, ShoppingCart, User, Package, CreditCard } from 'lucide-react';

interface APITestData {
  endpoint: string;
  order: number;
  status: 'pending' | 'success' | 'error';
  response: any;
  error?: string;
}

// Ordem correta dos endpoints para não haver dependências
const ENDPOINTS_ORDER = [
  {
    name: 'Integration Accounts',
    endpoint: 'integration_accounts',
    order: 1,
    description: 'Buscar contas de integração primeiro (necessário para outros endpoints)'
  },
  {
    name: 'Unified Orders - Basic',
    endpoint: 'unified-orders-basic',
    order: 2,
    description: 'Dados básicos dos pedidos (sem enriquecimento)'
  },
  {
    name: 'Unified Orders - Enriched',
    endpoint: 'unified-orders-enriched',
    order: 3,
    description: 'Dados completos com shipping, payments, costs etc.'
  },
  {
    name: 'ML Orders Search',
    endpoint: 'ml-orders-search',
    order: 4,
    description: 'Dados diretos da API do Mercado Livre /orders/search'
  },
  {
    name: 'ML Shipments',
    endpoint: 'ml-shipments',
    order: 5,
    description: 'Dados de envio detalhados /shipments/{shipment_id}'
  }
];

export default function PedidosTesteAPI() {
  const [data, setData] = useState<APITestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [integrationAccount, setIntegrationAccount] = useState<string>('');

  // Buscar conta de integração primeiro
  useEffect(() => {
    fetchIntegrationAccounts();
  }, []);

  const fetchIntegrationAccounts = async () => {
    try {
      const { data: accounts, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .limit(1);

      if (error) throw error;
      
      if (accounts && accounts.length > 0) {
        setIntegrationAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar integration accounts:', error);
    }
  };

  const fetchAllEndpoints = async () => {
    if (!integrationAccount) {
      alert('Conta de integração não encontrada');
      return;
    }

    setLoading(true);
    const results: APITestData[] = [];

    // Executar endpoints em ordem
    for (const endpoint of ENDPOINTS_ORDER) {
      try {
        console.log(`🔍 Testando endpoint: ${endpoint.name}`);
        
        let response;
        switch (endpoint.endpoint) {
          case 'integration_accounts':
            response = await fetchIntegrationAccountsData();
            break;
          case 'unified-orders-basic':
            response = await fetchUnifiedOrdersBasic();
            break;
          case 'unified-orders-enriched':
            response = await fetchUnifiedOrdersEnriched();
            break;
          case 'ml-orders-search':
            response = await fetchMLOrdersSearch();
            break;
          case 'ml-shipments':
            response = await fetchMLShipments();
            break;
          default:
            throw new Error('Endpoint não implementado');
        }

        results.push({
          endpoint: endpoint.name,
          order: endpoint.order,
          status: 'success',
          response: response
        });

      } catch (error: any) {
        console.error(`❌ Erro no endpoint ${endpoint.name}:`, error);
        results.push({
          endpoint: endpoint.name,
          order: endpoint.order,
          status: 'error',
          response: null,
          error: error.message || 'Erro desconhecido'
        });
      }
    }

    setData(results);
    setLoading(false);
  };

  const fetchIntegrationAccountsData = async () => {
    const { data, error } = await supabase
      .from('integration_accounts')
      .select('*')
      .eq('provider', 'mercadolivre');
    
    if (error) throw error;
    return data;
  };

  const fetchUnifiedOrdersBasic = async () => {
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id: integrationAccount,
        limit: 3,
        enrich: false,
        debug: false
      }
    });
    
    if (error) throw error;
    return data;
  };

  const fetchUnifiedOrdersEnriched = async () => {
    const { data, error } = await supabase.functions.invoke('unified-orders', {
      body: {
        integration_account_id: integrationAccount,
        limit: 3,
        enrich: true,
        include_shipping: true,
        debug: true
      }
    });
    
    if (error) throw error;
    return data;
  };

  const fetchMLOrdersSearch = async () => {
    // Este seria feito dentro da edge function, mas vamos simular com os dados que já temos
    const enrichedData = await fetchUnifiedOrdersEnriched();
    return {
      note: 'Dados do ML /orders/search estão dentro do response "results" do unified-orders',
      sample_raw_order: enrichedData?.results?.[0] || null
    };
  };

  const fetchMLShipments = async () => {
    // Este seria feito dentro da edge function, mas vamos simular com os dados que já temos
    const enrichedData = await fetchUnifiedOrdersEnriched();
    return {
      note: 'Dados do ML /shipments/{id} estão dentro do campo "shipping" após enrichment',
      sample_shipping: enrichedData?.results?.[0]?.shipping || null
    };
  };

  const renderFinancialData = (order: any) => {
    if (!order) return null;

    const financialFields = {
      'ML API Original': {
        total_amount: order.total_amount,
        paid_amount: order.paid_amount,
        currency_id: order.currency_id,
        'payments[0].total_paid_amount': order.payments?.[0]?.total_paid_amount,
        'payments[0].taxes_amount': order.payments?.[0]?.taxes_amount,
        'payments[0].shipping_cost': order.payments?.[0]?.shipping_cost,
        'shipping.cost': order.shipping?.cost,
        'shipping.bonus_total': order.shipping?.bonus_total,
        'shipping.bonus': order.shipping?.bonus,
      },
      'Shipping Costs Detalhado': {
        'shipping.costs.gross_amount': order.shipping?.costs?.gross_amount,
        'shipping.costs.receiver.cost': order.shipping?.costs?.receiver?.cost,
        'shipping.costs.receiver.save': order.shipping?.costs?.receiver?.save,
        'shipping.costs.receiver.compensation': order.shipping?.costs?.receiver?.compensation,
        'shipping.costs.senders[0].cost': order.shipping?.costs?.senders?.[0]?.cost,
        'shipping.costs.senders[0].compensation': order.shipping?.costs?.senders?.[0]?.compensation,
        'shipping.costs.senders[0].save': order.shipping?.costs?.senders?.[0]?.save,
      },
      'Order Items Financial': order.order_items?.map((item: any, index: number) => ({
        [`item_${index}.quantity`]: item.quantity,
        [`item_${index}.unit_price`]: item.unit_price,
        [`item_${index}.full_unit_price`]: item.full_unit_price,
        [`item_${index}.sale_fee`]: item.sale_fee,
        [`item_${index}.currency_id`]: item.currency_id,
      })) || [],
      'Payments Detalhado': order.payments?.map((payment: any, index: number) => ({
        [`payment_${index}.id`]: payment.id,
        [`payment_${index}.status`]: payment.status,
        [`payment_${index}.total_paid_amount`]: payment.total_paid_amount,
        [`payment_${index}.taxes_amount`]: payment.taxes_amount,
        [`payment_${index}.shipping_cost`]: payment.shipping_cost,
        [`payment_${index}.overpaid_amount`]: payment.overpaid_amount,
        [`payment_${index}.marketplace_fee`]: payment.marketplace_fee,
      })) || [],
    };

    return (
      <div className="space-y-4">
        {Object.entries(financialFields).map(([section, fields]) => (
          <Card key={section}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {section}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.isArray(fields) ? (
                fields.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(item).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-mono">{JSON.stringify(value)}</span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="grid gap-1 text-xs">
                  {Object.entries(fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderShippingData = (order: any) => {
    if (!order?.shipping) return null;

    const shippingFields = {
      'Shipping Basic': {
        id: order.shipping.id,
        tracking_number: order.shipping.tracking_number,
        status: order.shipping.status,
        substatus: order.shipping.substatus,
        'lead_time.cost': order.shipping.lead_time?.cost,
        'lead_time.cost_type': order.shipping.lead_time?.cost_type,
        'lead_time.list_cost': order.shipping.lead_time?.list_cost,
      },
      'Destination Address': {
        'destination.receiver_name': order.shipping.destination?.receiver_name,
        'destination.shipping_address.city.name': order.shipping.destination?.shipping_address?.city?.name,
        'destination.shipping_address.state.name': order.shipping.destination?.shipping_address?.state?.name,
        'destination.shipping_address.zip_code': order.shipping.destination?.shipping_address?.zip_code,
        'destination.shipping_address.street_name': order.shipping.destination?.shipping_address?.street_name,
        'destination.shipping_address.street_number': order.shipping.destination?.shipping_address?.street_number,
      },
      'Logistic Info': {
        'logistic.mode': order.shipping.logistic?.mode,
        'logistic.type': order.shipping.logistic?.type,
        'logistic.direction': order.shipping.logistic?.direction,
        'shipping_method.name': order.shipping.shipping_method?.name,
        'shipping_method.type': order.shipping.shipping_method?.type,
        delivery_type: order.shipping.delivery_type,
      }
    };

    return (
      <div className="space-y-4">
        {Object.entries(shippingFields).map(([section, fields]) => (
          <Card key={section}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {section}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-1 text-xs">
                {Object.entries(fields).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono">{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teste API - Dados Financeiros Originais</h1>
          <p className="text-muted-foreground">
            Análise completa dos endpoints para identificar campos financeiros corretos
          </p>
        </div>
        <Button 
          onClick={fetchAllEndpoints} 
          disabled={loading || !integrationAccount}
          className="min-w-[150px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Testar Todos
            </>
          )}
        </Button>
      </div>

      {!integrationAccount && (
        <Alert>
          <AlertDescription>
            Nenhuma conta de integração do Mercado Livre encontrada. Configure uma integração primeiro.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Endpoints Testados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {ENDPOINTS_ORDER.map((endpoint) => {
                  const result = data.find(d => d.endpoint === endpoint.name);
                  return (
                    <div key={endpoint.name} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{endpoint.order}</Badge>
                          <span className="font-medium text-sm">{endpoint.name}</span>
                        </div>
                        {result && (
                          <Badge 
                            variant={result.status === 'success' ? 'default' : 
                                   result.status === 'error' ? 'destructive' : 'secondary'}
                          >
                            {result.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {endpoint.description}
                      </p>
                      {result?.error && (
                        <p className="text-xs text-destructive">{result.error}</p>
                      )}
                      {result?.response && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(result.response)}
                          className="mt-2"
                        >
                          Ver Dados
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalhes dos Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Análise de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedOrder ? (
              <Tabs defaultValue="financial" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="shipping">Envio</TabsTrigger>
                  <TabsTrigger value="buyer">Comprador</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>
                
                <TabsContent value="financial" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    {selectedOrder.results?.[0] ? 
                      renderFinancialData(selectedOrder.results[0]) :
                      <p className="text-muted-foreground">Selecione um endpoint com dados de pedidos</p>
                    }
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="shipping" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    {selectedOrder.results?.[0] ? 
                      renderShippingData(selectedOrder.results[0]) :
                      <p className="text-muted-foreground">Selecione um endpoint com dados de pedidos</p>
                    }
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="buyer" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    {selectedOrder.results?.[0]?.buyer && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Dados do Comprador
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid gap-1 text-xs">
                            {Object.entries(selectedOrder.results[0].buyer).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-mono">{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="raw" className="mt-4">
                  <ScrollArea className="h-[350px]">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                      {JSON.stringify(selectedOrder, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <Eye className="h-12 w-12 mb-4 opacity-50" />
                <p>Selecione um endpoint para ver os dados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo dos Achados */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Resumo dos Campos Financeiros Encontrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Valores Base</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• total_amount (valor dos produtos)</li>
                  <li>• paid_amount (total pago pelo cliente)</li>
                  <li>• currency_id (moeda)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Custos de Envio</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• shipping.cost</li>
                  <li>• shipping.costs.receiver.cost</li>
                  <li>• payments[0].shipping_cost</li>
                  <li>• shipping.lead_time.cost</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Bônus/Compensações</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• shipping.bonus_total</li>
                  <li>• shipping.bonus</li>
                  <li>• shipping.costs.senders[0].compensation</li>
                  <li>• shipping.costs.receiver.save</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}