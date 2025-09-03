import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TreePine, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CategoryHierarchyGenerator } from '@/utils/categoryHierarchyGenerator';
import { useHierarchicalCategories } from '@/features/products/hooks/useHierarchicalCategories';

export function CategoryHierarchyButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<{ created: number; success: boolean } | null>(null);
  const { toast } = useToast();
  const { refreshCategories } = useHierarchicalCategories();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await CategoryHierarchyGenerator.generateFromProducts();
      
      if (result.success) {
        setLastResult({ created: result.created || 0, success: true });
        toast({
          title: "Hierarquia gerada com sucesso!",
          description: `${result.created} categorias foram criadas automaticamente.`,
        });
        
        // Recarregar categorias para atualizar o sidebar
        await refreshCategories();
      } else {
        setLastResult({ created: 0, success: false });
        toast({
          title: "Erro na geração",
          description: result.error || "Não foi possível gerar a hierarquia.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating hierarchy:', error);
      setLastResult({ created: 0, success: false });
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao gerar a hierarquia de categorias.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <TreePine className="h-4 w-4" />
        )}
        {isGenerating ? 'Gerando...' : 'Gerar Hierarquia'}
      </Button>

      {lastResult && (
        <Badge 
          variant={lastResult.success ? "default" : "destructive"}
          className="gap-1"
        >
          {lastResult.success ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {lastResult.success 
            ? `${lastResult.created} criadas`
            : 'Erro'
          }
        </Badge>
      )}
    </div>
  );
}