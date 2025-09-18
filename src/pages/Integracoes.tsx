import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopeeConnection } from '@/components/integrations/ShopeeConnection';
import { FEATURES } from '@/config/features';

export default function Integracoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground">
            Configure suas integrações com marketplaces e ERPs
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mercado Livre */}
        {FEATURES.MERCADO_LIVRE && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛒 Mercado Livre
              </CardTitle>
              <CardDescription>
                Integração já configurada e funcionando
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                <span className="text-green-600">✅</span>
                <span className="text-green-800 font-medium">Conectado e sincronizando</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shopee */}
        {FEATURES.SHOPEE && <ShopeeConnection />}
      </div>
    </div>
  );
}