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
import * as XLSX from 'xlsx';

export function EstoqueImport({ onSuccess }: { onSuccess?: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [templateFormat, setTemplateFormat] = useState<'csv' | 'xlsx'>('xlsx');
  
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

  const downloadTemplate = (format: 'csv' | 'xlsx' = templateFormat) => {
    const headers = ['sku_interno', 'nome', 'descricao', 'quantidade_atual', 'estoque_minimo', 'estoque_maximo', 'preco_custo', 'preco_venda', 'url_imagem', 'codigo_barras', 'localizacao', 'categoria', 'categoria_principal', 'sku_pai', 'ativo', 'peso_liquido', 'peso_bruto', 'ncm', 'codigo_cest', 'sob_encomenda', 'dias_preparacao', 'unidade_medida', 'numero_volumes', 'tipo_embalagem', 'dimensoes', 'origem'];
    const exampleData = [
      {
        sku_interno: 'EXEMPLO-001',
        nome: 'Produto Exemplo',
        descricao: 'Descrição do produto exemplo',
        quantidade_atual: 10,
        estoque_minimo: 5,
        estoque_maximo: 50,
        preco_custo: 15.00,
        preco_venda: 29.90,
        url_imagem: 'https://exemplo.com/imagem1.jpg',
        codigo_barras: '1234567890123',
        localizacao: 'Setor A',
        categoria: 'Eletrônicos',
        categoria_principal: 'Tecnologia',
        sku_pai: '',
        ativo: true,
        peso_liquido: 1.5,
        peso_bruto: 2.0,
        ncm: '85171231',
        codigo_cest: '01.001.00',
        sob_encomenda: 'Não',
        dias_preparacao: 5,
        unidade_medida: 'UN',
        numero_volumes: 1,
        tipo_embalagem: 'Caixa',
        dimensoes: '20x15x10',
        origem: 'Nacional'
      },
      {
        sku_interno: 'EXEMPLO-002',
        nome: 'Produto Filho',
        descricao: 'Variação do produto pai',
        quantidade_atual: 5,
        estoque_minimo: 2,
        estoque_maximo: 20,
        preco_custo: 12.00,
        preco_venda: 24.90,
        url_imagem: 'https://exemplo.com/imagem2.jpg',
        codigo_barras: '1234567890124',
        localizacao: 'Setor A',
        categoria: 'Eletrônicos',
        categoria_principal: 'Tecnologia',
        sku_pai: 'EXEMPLO-001',
        ativo: true,
        peso_liquido: 1.2,
        peso_bruto: 1.8,
        ncm: '85171231',
        codigo_cest: '01.001.00',
        sob_encomenda: 'Não',
        dias_preparacao: 3,
        unidade_medida: 'UN',
        numero_volumes: 1,
        tipo_embalagem: 'Caixa',
        dimensoes: '18x12x8',
        origem: 'Nacional'
      }
    ];

    if (format === 'xlsx') {
      // Criar workbook Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exampleData);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_importacao_estoque.xlsx');
    } else {
      // Criar CSV
      const template = [
        headers.join(','),
        'EXEMPLO-001,Produto Exemplo,Descrição do produto exemplo,10,5,50,15.00,29.90,https://exemplo.com/imagem1.jpg,1234567890123,Setor A,Eletrônicos,Tecnologia,,true,1.5,2.0,85171231,01.001.00,Não,5,UN,1,Caixa,20x15x10,Nacional',
        'EXEMPLO-002,Produto Filho,Variação do produto pai,5,2,20,12.00,24.90,https://exemplo.com/imagem2.jpg,1234567890124,Setor A,Eletrônicos,Tecnologia,EXEMPLO-001,true,1.2,1.8,85171231,01.001.00,Não,3,UN,1,Caixa,18x12x8,Nacional'
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
    }
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
              <div className="flex gap-2">
                <Button 
                  variant={templateFormat === 'xlsx' ? 'default' : 'outline'} 
                  onClick={() => {
                    setTemplateFormat('xlsx');
                    downloadTemplate('xlsx');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template Excel
                </Button>
                <Button 
                  variant={templateFormat === 'csv' ? 'default' : 'outline'} 
                  onClick={() => {
                    setTemplateFormat('csv');
                    downloadTemplate('csv');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template CSV
                </Button>
              </div>
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
