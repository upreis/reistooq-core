import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Upload, 
  FileSpreadsheet, 
  Download,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EstoqueImport({ onSuccess }: { onSuccess?: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Selecione um arquivo Excel (.xlsx) ou CSV (.csv)",
          variant: "destructive",
        });
        setFile(null);
        return;
      }
    }
  };

  const downloadTemplate = () => {
    const template = [
      'sku_interno,nome,descricao,quantidade_atual,estoque_minimo,estoque_maximo,preco_custo,preco_venda,codigo_barras,localizacao,categoria,sku_pai,ativo',
      'EXEMPLO-001,Produto Exemplo,Descrição do produto exemplo,10,5,50,15.00,29.90,1234567890123,Setor A,Eletrônicos,,true',
      'EXEMPLO-002,Produto Filho,Variação do produto pai,5,2,20,12.00,24.90,1234567890124,Setor A,Eletrônicos,EXEMPLO-001,true'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_importacao_estoque.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImport = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetImport();
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Produtos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">1. Baixar Template</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Baixe o template com o formato correto para importação
              </p>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Template CSV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">2. Selecionar Arquivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : 'Clique para selecionar um arquivo Excel ou CSV'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: .xlsx, .xls, .csv
                  </p>
                </div>

                {file && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetImport}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
