import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, Database } from 'lucide-react';

interface RestoreDataDialogProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
  dataCount: number;
  lastUpdate: number;
  currentPage: number;
  itemsPerPage: number;
}

export const RestoreDataDialog: React.FC<RestoreDataDialogProps> = ({
  open,
  onAccept,
  onReject,
  dataCount,
  lastUpdate,
  currentPage,
  itemsPerPage
}) => {
  const getTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 1000 / 60);
    if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? 's' : ''} atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hora${hours !== 1 ? 's' : ''} atrás`;
    const days = Math.floor(hours / 24);
    return `${days} dia${days !== 1 ? 's' : ''} atrás`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Restaurar dados anteriores?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Encontramos dados salvos da sua última busca. Deseja restaurá-los?
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Resultados encontrados:</span>
                <span className="font-medium text-foreground">{dataCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Última atualização:</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getTimeAgo(lastUpdate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Página salva:</span>
                <span className="font-medium text-foreground">{currentPage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Itens por página:</span>
                <span className="font-medium text-foreground">{itemsPerPage}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Os dados são salvos automaticamente e ficam disponíveis por 24 horas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onReject}>
            Começar nova busca
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>
            Restaurar dados
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
