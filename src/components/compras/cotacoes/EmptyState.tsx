import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  searchTerm: string;
}

const EmptyStateComponent: React.FC<EmptyStateProps> = ({ searchTerm }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma cotação encontrada</h3>
        <p className="text-muted-foreground text-center mb-4">
          {searchTerm ? 'Tente ajustar os filtros de busca' : 'Use a importação de Excel para criar cotações'}
        </p>
      </CardContent>
    </Card>
  );
};

// Memoizar para evitar re-renders desnecessários
export const EmptyState = memo(EmptyStateComponent);
