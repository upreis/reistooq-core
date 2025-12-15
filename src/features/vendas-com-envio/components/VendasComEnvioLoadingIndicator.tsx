/**
 * 📦 Loading Indicator - Vendas com Envio
 * Padrão visual idêntico ao /pedidos
 */

interface VendasComEnvioLoadingIndicatorProps {
  message?: string;
}

export const VendasComEnvioLoadingIndicator = ({ 
  message = 'Buscando vendas...' 
}: VendasComEnvioLoadingIndicatorProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-[65px] h-[65px]">
          <span className="absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100 animate-loaderAnim" />
          <span className="absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100 animate-loaderAnim [animation-delay:-1.25s]" />
        </div>
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
};
