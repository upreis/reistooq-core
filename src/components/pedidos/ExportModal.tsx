/**
 * 🚀 FASE 3: Modal de exportação de dados
 */

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface ExportModalProps {
  onExport: (format: 'csv' | 'xlsx') => Promise<void>;
  totalRecords: number;
  isLoading?: boolean;
}

export function ExportModal({ onExport, totalRecords, isLoading }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'xlsx' | null>(null);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      setExportingFormat(format);
      await onExport(format);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro na exportação:', error);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Escolha o formato para exportar {totalRecords} registro(s) de pedidos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleExport('csv')}
          >
            <CardContent className="flex items-center p-4">
              <FileText className="h-8 w-8 text-green-600 mr-3" />
              <div className="flex-1">
                <h3 className="font-medium">CSV (Separado por vírgulas)</h3>
                <p className="text-sm text-muted-foreground">
                  Compatível com Excel, Google Sheets e outros
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                disabled={exportingFormat === 'csv' || isLoading}
              >
                {exportingFormat === 'csv' ? 'Exportando...' : 'Baixar'}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleExport('xlsx')}
          >
            <CardContent className="flex items-center p-4">
              <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
              <div className="flex-1">
                <h3 className="font-medium">Excel (XLSX)</h3>
                <p className="text-sm text-muted-foreground">
                  Formato nativo do Microsoft Excel
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                disabled={exportingFormat === 'xlsx' || isLoading}
              >
                {exportingFormat === 'xlsx' ? 'Exportando...' : 'Baixar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}