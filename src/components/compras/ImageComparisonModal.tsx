import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { useToastFeedback } from '@/hooks/useToastFeedback';

interface ImageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagemPrincipal?: string;
  imagemFornecedor?: string;
  observacoes?: string;
  produtoInfo?: {
    sku?: string;
    nome_produto?: string;
    rowIndex: number;
  };
  onSaveObservacoes: (rowIndex: number, observacoes: string) => void;
}

export function ImageComparisonModal({
  isOpen,
  onClose,
  imagemPrincipal,
  imagemFornecedor,
  observacoes = '',
  produtoInfo,
  onSaveObservacoes
}: ImageComparisonModalProps) {
  const [editedObservacoes, setEditedObservacoes] = useState(observacoes);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToastFeedback();

  useEffect(() => {
    setEditedObservacoes(observacoes);
  }, [observacoes]);

  const handleSave = async () => {
    if (!produtoInfo) return;
    
    setIsSaving(true);
    try {
      onSaveObservacoes(produtoInfo.rowIndex, editedObservacoes);
      showSuccess('Observações salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      showError('Erro ao salvar observações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setEditedObservacoes(observacoes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Comparação de Imagens
            {produtoInfo?.sku && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                SKU: {produtoInfo.sku}
              </span>
            )}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Produto */}
          {produtoInfo?.nome_produto && (
            <div className="bg-muted/30 p-2 rounded-lg">
              <h3 className="font-medium text-xs text-muted-foreground">Produto:</h3>
              <p className="text-sm truncate">{produtoInfo.nome_produto}</p>
            </div>
          )}

          {/* Comparação de Imagens */}
          <div className="grid grid-cols-2 gap-4">
            {/* Imagem Principal */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Imagem Principal</Label>
              <div className="border rounded-lg p-2 bg-muted/10">
                {imagemPrincipal ? (
                  <div className="aspect-square relative max-h-[250px]">
                    <img
                      src={imagemPrincipal}
                      alt="Imagem Principal"
                      className="w-full h-full object-contain rounded-md"
                      style={{ 
                        imageRendering: 'auto',
                        filter: 'contrast(1.1) saturate(1.1)'
                      }}
                      loading="eager"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-square max-h-[250px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                    <span className="text-xs">Sem imagem principal</span>
                  </div>
                )}
              </div>
            </div>

            {/* Imagem do Fornecedor */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Imagem do Fornecedor</Label>
              <div className="border rounded-lg p-2 bg-muted/10">
                {imagemFornecedor ? (
                  <div className="aspect-square relative max-h-[250px]">
                    <img
                      src={imagemFornecedor}
                      alt="Imagem do Fornecedor"
                      className="w-full h-full object-contain rounded-md"
                      style={{ 
                        imageRendering: 'auto',
                        filter: 'contrast(1.1) saturate(1.1)'
                      }}
                      loading="eager"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-square max-h-[250px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                    <span className="text-xs">Sem imagem do fornecedor</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campo de Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-xs font-medium">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Digite suas observações sobre o produto..."
              value={editedObservacoes}
              onChange={(e) => setEditedObservacoes(e.target.value)}
              className="min-h-[80px] text-sm resize-vertical"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              size="sm"
              className="gap-2"
            >
              {isSaving ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}