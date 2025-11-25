import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UploadProgressProps {
  isUploading: boolean;
  canCancel: boolean;
  onCancel: () => void;
  fileName?: string;
}

/**
 * Componente opcional para exibir progresso de upload com botão de cancelar
 * Uso: Renderizar condicionalmente quando dialogState.isOpen === true
 */
export const UploadProgress = ({ 
  isUploading, 
  canCancel, 
  onCancel,
  fileName 
}: UploadProgressProps) => {
  if (!isUploading) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Enviando imagem...</p>
          {fileName && (
            <p className="text-xs text-muted-foreground truncate">
              {fileName}
            </p>
          )}
        </div>
        
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Progress bar animado */}
      <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary animate-pulse"
          style={{ width: '100%' }}
        />
      </div>
    </Card>
  );
};
