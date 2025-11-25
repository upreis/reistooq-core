import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { cn } from '@/lib/utils';

interface DragDropUploadProps {
  onFilesAdded: (files: FileWithPreview[]) => void;
  onFileRemoved: (index: number) => void;
  files: FileWithPreview[];
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number; // em MB
  disabled?: boolean;
}

interface FileWithPreview extends File {
  preview: string;
  id: string;
  processed?: boolean;
  originalFile?: File;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFilesAdded,
  onFileRemoved,
  files,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 5,
  disabled = false
}) => {
  const { toast } = useToast();
  const { processImage, isProcessing, progress } = useBackgroundRemoval();
  const [processingFileId, setProcessingFileId] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Muitos arquivos",
        description: `Máximo de ${maxFiles} imagens permitidas.`
      });
      return;
    }

    const newFiles: FileWithPreview[] = acceptedFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.preview = URL.createObjectURL(file);
      fileWithPreview.id = Math.random().toString(36).substr(2, 9);
      return fileWithPreview;
    });

    onFilesAdded(newFiles);
  }, [files.length, maxFiles, onFilesAdded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    disabled: disabled || isProcessing,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((rejection) => {
        if (rejection.errors[0]?.code === 'file-too-large') {
          toast({
            variant: "destructive",
            title: "Arquivo muito grande",
            description: `Tamanho máximo: ${maxSize}MB`
          });
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          toast({
            variant: "destructive",
            title: "Tipo de arquivo inválido",
            description: "Apenas imagens JPEG, PNG e WebP são aceitas."
          });
        }
      });
    }
  });

  const removeFile = (index: number) => {
    const file = files[index];
    if (file?.preview) {
      try {
        URL.revokeObjectURL(file.preview);
      } catch (error) {
        console.debug('Erro ao revogar URL:', error);
      }
    }
    onFileRemoved(index);
  };

  const removeBackground = async (fileIndex: number) => {
    const file = files[fileIndex];
    if (!file) return;

    setProcessingFileId(file.id);
    
    try {
      const processedBlob = await processImage(file);
      const processedFile = new File([processedBlob], file.name, { type: 'image/png' }) as FileWithPreview;
      
      // Criar nova preview para o arquivo processado
      processedFile.preview = URL.createObjectURL(processedBlob);
      processedFile.id = file.id;
      processedFile.processed = true;
      processedFile.originalFile = file;

      // Substituir o arquivo na lista
      const updatedFiles = [...files];
      if (updatedFiles[fileIndex].preview) {
        try {
          URL.revokeObjectURL(updatedFiles[fileIndex].preview);
        } catch (error) {
          console.debug('Erro ao revogar URL anterior:', error);
        }
      }
      updatedFiles[fileIndex] = processedFile;
      
      onFilesAdded(updatedFiles);
      
      toast({
        title: "Fundo removido com sucesso!",
        description: "A imagem foi processada e o fundo foi removido."
      });
    } catch (error) {
      console.error('Erro ao remover fundo:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar imagem",
        description: "Não foi possível remover o fundo da imagem."
      });
    } finally {
      setProcessingFileId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  React.useEffect(() => {
    // Cleanup preview URLs on unmount ONLY
    return () => {
      files.forEach(file => {
        if (file.preview) {
          try {
            URL.revokeObjectURL(file.preview);
          } catch (error) {
            // Silenciar erros de revogação se já foi revogado
            console.debug('URL já foi revogado ou é inválido:', error);
          }
        }
      });
    };
  }, []); // ✅ Array vazio - executar apenas no unmount

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled || isProcessing ? "cursor-not-allowed opacity-50" : "hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        
        {isDragActive ? (
          <p className="text-lg font-medium">Solte as imagens aqui...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Clique ou arraste imagens para enviar
            </p>
            <p className="text-sm text-muted-foreground">
              Máximo {maxFiles} imagens • {acceptedTypes.join(', ').replace(/image\//g, '').toUpperCase()} • até {maxSize}MB cada
            </p>
          </div>
        )}
      </Card>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <Card key={file.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => removeBackground(index)}
                    disabled={isProcessing || file.processed}
                    className="text-xs"
                  >
                    {processingFileId === file.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    Remover Fundo
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeFile(index)}
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Indicador de processamento */}
                {file.processed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Processada
                  </div>
                )}
              </div>
              
              {/* Informações do arquivo */}
              <div className="p-3">
                <p className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Progress bar durante processamento */}
              {processingFileId === file.id && isProcessing && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/95">
                  <Progress value={progress} className="h-1" />
                  <p className="text-xs text-center mt-1">Removendo fundo...</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};