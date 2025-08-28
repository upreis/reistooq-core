import { MercadoLivreSimple } from '@/components/integrations/MercadoLivreSimple';

export default function IntegracoesSimples() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações - Versão Simplificada</h1>
        <p className="text-muted-foreground">
          Versão completamente simplificada das integrações do MercadoLibre
        </p>
      </div>
      
      <MercadoLivreSimple />
    </div>
  );
}