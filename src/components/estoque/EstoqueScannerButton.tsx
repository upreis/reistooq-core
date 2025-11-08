import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scan } from 'lucide-react';
import { MobileScanner } from '@/components/scanner/MobileScanner';
import { toast } from 'sonner';

interface EstoqueScannerButtonProps {
  onScanResult: (code: string) => void;
}

export function EstoqueScannerButton({ onScanResult }: EstoqueScannerButtonProps) {
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScanResult = (code: string) => {
    onScanResult(code);
    setScannerOpen(false);
  };

  const handleScanError = (error: string) => {
    toast.error(error);
  };

  return (
    <>
      <Button
        onClick={() => setScannerOpen(true)}
        variant="outline"
        size="default"
        className="gap-2"
      >
        <Scan className="w-4 h-4" />
        Escanear
      </Button>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scanner de Código de Barras</DialogTitle>
          </DialogHeader>
          
          <MobileScanner
            onScanResult={handleScanResult}
            onError={handleScanError}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
