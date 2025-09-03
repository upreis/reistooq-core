import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileSpreadsheet, 
  Upload, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface CategoryImportData {
  nome: string;
  descricao?: string;
  cor?: string;
  nivel: 1 | 2 | 3;
  categoria_principal?: string;
  categoria?: string;
}

interface CategoryImportModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CategoryImportModal({ trigger, onSuccess }: CategoryImportModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
    total: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createCategory, getCategoriasPrincipais, getCategorias } = useHierarchicalCategories();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        nome: "Eletrônicos",
        descricao: "Produtos eletrônicos em geral",
        cor: "#6366f1",
        nivel: 1,
        categoria_principal: "",
        categoria: ""
      },
      {
        nome: "Smartphones",
        descricao: "Telefones móveis",
        cor: "#8b5cf6",
        nivel: 2,
        categoria_principal: "Eletrônicos",
        categoria: ""
      },
      {
        nome: "Android",
        descricao: "Smartphones com sistema Android",
        cor: "#10b981",
        nivel: 3,
        categoria_principal: "Eletrônicos",
        categoria: "Smartphones"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categorias");
    XLSX.writeFile(wb, "modelo_categorias.xlsx");

    toast({
      title: "Template baixado",
      description: "Template de categorias baixado com sucesso!",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResults(null);
    }
  };

  const processImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as CategoryImportData[];

      const results = {
        success: 0,
        errors: [] as string[],
        total: jsonData.length
      };

      // Cache das categorias existentes
      const categoriasExistentes = getCategoriasPrincipais();
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2; // +2 porque começa na linha 2 do Excel

        try {
          // Validações básicas
          if (!row.nome || !row.nivel) {
            results.errors.push(`Linha ${rowNumber}: Nome e nível são obrigatórios`);
            continue;
          }

          if (![1, 2, 3].includes(row.nivel)) {
            results.errors.push(`Linha ${rowNumber}: Nível deve ser 1, 2 ou 3`);
            continue;
          }

          let categoria_principal_id: string | undefined;
          let categoria_id: string | undefined;

          // Para níveis 2 e 3, precisamos encontrar as categorias pai
          if (row.nivel >= 2 && row.categoria_principal) {
            const categoriaPrincipal = categoriasExistentes.find(
              cat => cat.nome.toLowerCase() === row.categoria_principal?.toLowerCase()
            );
            
            if (!categoriaPrincipal) {
              results.errors.push(`Linha ${rowNumber}: Categoria principal "${row.categoria_principal}" não encontrada`);
              continue;
            }
            categoria_principal_id = categoriaPrincipal.id;
          }

          if (row.nivel === 3 && row.categoria && categoria_principal_id) {
            const categorias = getCategorias(categoria_principal_id);
            const categoria = categorias.find(
              cat => cat.nome.toLowerCase() === row.categoria?.toLowerCase()
            );
            
            if (!categoria) {
              results.errors.push(`Linha ${rowNumber}: Categoria "${row.categoria}" não encontrada`);
              continue;
            }
            categoria_id = categoria.id;
          }

          // Criar categoria
          await createCategory({
            nome: row.nome,
            descricao: row.descricao,
            cor: row.cor || "#6366f1",
            nivel: row.nivel,
            categoria_principal_id,
            categoria_id,
          });

          results.success++;
        } catch (error) {
          results.errors.push(`Linha ${rowNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      setImportResults(results);

      if (results.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${results.success} categorias importadas com sucesso!`,
        });
        onSuccess?.();
      }

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Erro ao processar arquivo. Verifique o formato.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Importar Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Categorias via Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template download */}
          <div className="space-y-3">
            <h4 className="font-medium">1. Baixe o template</h4>
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Template
            </Button>
            <p className="text-sm text-muted-foreground">
              Use o template para garantir que os dados estejam no formato correto.
            </p>
          </div>

          {/* File upload */}
          <div className="space-y-3">
            <h4 className="font-medium">2. Selecione o arquivo</h4>
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo Excel (.xlsx, .xls)</Label>
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />
            </div>
            
            {file && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Arquivo selecionado: {file.name}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Import button */}
          <div className="space-y-3">
            <h4 className="font-medium">3. Importar dados</h4>
            <Button
              onClick={processImport}
              disabled={!file || importing}
              className="gap-2"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? "Importando..." : "Importar Categorias"}
            </Button>
          </div>

          {/* Results */}
          {importResults && (
            <div className="space-y-3">
              <h4 className="font-medium">Resultado da Importação</h4>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {importResults.success} de {importResults.total} categorias importadas com sucesso
                </AlertDescription>
              </Alert>

              {importResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>Erros encontrados:</p>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResults.errors.length > 5 && (
                          <li>... e mais {importResults.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClose}>
              {importResults ? "Fechar" : "Cancelar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}