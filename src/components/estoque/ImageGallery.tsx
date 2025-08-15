import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Eye, 
  Star, 
  StarOff, 
  Trash2, 
  Download, 
  RotateCcw, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageData {
  id: string;
  url: string;
  nome_arquivo?: string;
  tamanho_arquivo?: number;
  tipo_mime?: string;
  ordem: number;
  principal: boolean;
}

interface ImageGalleryProps {
  images: ImageData[];
  onSetPrincipal: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  onReorder: (images: ImageData[]) => void;
  editable?: boolean;
  maxHeight?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onSetPrincipal,
  onDelete,
  onReorder,
  editable = true,
  maxHeight = "400px"
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sortedImages = [...images].sort((a, b) => {
    // Principal sempre primeiro
    if (a.principal && !b.principal) return -1;
    if (!a.principal && b.principal) return 1;
    // Depois por ordem
    return a.ordem - b.ordem;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (image: ImageData) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.nome_arquivo || `imagem-${image.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetViewer = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!editable) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!editable || draggedIndex === null) return;

    const newImages = [...sortedImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Atualizar ordem
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      ordem: index
    }));

    onReorder(reorderedImages);
    setDraggedIndex(null);
  };

  if (!images.length) {
    return (
      <Card className="p-8 text-center border-dashed">
        <div className="text-muted-foreground">
          <Eye className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Nenhuma imagem adicionada</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div 
        className="grid gap-3"
        style={{ 
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          maxHeight 
        }}
      >
        {sortedImages.map((image, index) => (
          <Card
            key={image.id}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all hover:shadow-md",
              draggedIndex === index && "opacity-50",
              editable && "hover:scale-105"
            )}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* Imagem */}
            <div className="aspect-square relative">
              <img
                src={image.url}
                alt={image.nome_arquivo || `Imagem ${index + 1}`}
                className="w-full h-full object-cover"
                onClick={() => setSelectedImage(image)}
              />

              {/* Badge principal */}
              {image.principal && (
                <Badge 
                  variant="default" 
                  className="absolute top-2 left-2 bg-yellow-500 text-yellow-900"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Principal
                </Badge>
              )}

              {/* Overlay de ações */}
              {editable && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPrincipal(image.id);
                    }}
                    className="h-8 w-8 p-0"
                    title={image.principal ? "Remover como principal" : "Definir como principal"}
                  >
                    {image.principal ? (
                      <StarOff className="h-3 w-3" />
                    ) : (
                      <Star className="h-3 w-3" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(image);
                    }}
                    className="h-8 w-8 p-0"
                    title="Visualizar"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(image.id);
                    }}
                    className="h-8 w-8 p-0"
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Indicador de arrastar */}
              {editable && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Move className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {/* Info do arquivo */}
            <div className="p-2 text-xs">
              <p className="font-medium truncate" title={image.nome_arquivo}>
                {image.nome_arquivo || 'Sem nome'}
              </p>
              <p className="text-muted-foreground">
                {formatFileSize(image.tamanho_arquivo)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de visualização */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-3">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.nome_arquivo || 'Visualizar Imagem'}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedImage!)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {editable && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSetPrincipal(selectedImage!.id)}
                    >
                      {selectedImage?.principal ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        onDelete(selectedImage!.id);
                        setSelectedImage(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controles */}
            <div className="flex items-center justify-center gap-2 px-6 pb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-mono min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-2" />

              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotation(rotation - 90)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotation(rotation + 90)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={resetViewer}
              >
                Reset
              </Button>
            </div>

            {/* Imagem */}
            <div className="flex-1 overflow-auto p-6 pt-0 flex items-center justify-center bg-muted/30">
              {selectedImage && (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.nome_arquivo}
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`
                  }}
                />
              )}
            </div>

            {/* Info da imagem */}
            {selectedImage && (
              <div className="p-6 pt-3 border-t bg-muted/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Arquivo</p>
                    <p className="text-muted-foreground">
                      {selectedImage.nome_arquivo || 'Sem nome'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Tamanho</p>
                    <p className="text-muted-foreground">
                      {formatFileSize(selectedImage.tamanho_arquivo)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Tipo</p>
                    <p className="text-muted-foreground">
                      {selectedImage.tipo_mime || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-muted-foreground">
                      {selectedImage.principal ? 'Principal' : 'Secundária'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};