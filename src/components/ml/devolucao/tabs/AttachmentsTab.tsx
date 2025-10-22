import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Paperclip, Image, FileText, User, Store, Building2, Download, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentsTabProps {
  devolucao: any;
}

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({ devolucao }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // ✅ CORREÇÃO: Removidas colunas anexos_comprador e anexos_vendedor (foram excluídas do banco)
  // Agora usamos apenas anexos_ml (mapeado da API) e claim_attachments (estrutura original)
  const anexosML = devolucao?.anexos_ml || [];
  const claimAttachments = devolucao?.claim_attachments || [];

  // Consolidar todos os anexos
  const allAttachments = [
    ...anexosML.map((a: any) => ({ ...a, source: 'meli' })),
    ...claimAttachments
  ];

  const getSourceInfo = (source: string) => {
    const sources: any = {
      buyer: { icon: User, label: 'Comprador', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
      seller: { icon: Store, label: 'Vendedor', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
      meli: { icon: Building2, label: 'Mercado Livre', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' }
    };
    return sources[source] || sources.meli;
  };

  const isImage = (url: string) => {
    return url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const AttachmentCard = ({ attachment }: { attachment: any }) => {
    const sourceInfo = getSourceInfo(attachment.source);
    const SourceIcon = sourceInfo.icon;

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative group">
          {isImage(attachment.url) ? (
            <>
              <img 
                src={attachment.url} 
                alt={attachment.nome || 'Anexo'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedImage(attachment.url)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-medium text-sm line-clamp-2">{attachment.nome || attachment.id || 'Sem nome'}</p>
            <Badge variant="outline" className={sourceInfo.color}>
              <SourceIcon className="h-3 w-3 mr-1" />
              {sourceInfo.label}
            </Badge>
          </div>
          {attachment.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-2">{attachment.descricao}</p>
          )}
          {attachment.tamanho && (
            <p className="text-xs text-muted-foreground mt-1">
              Tamanho: {(attachment.tamanho / 1024).toFixed(2)} KB
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Anexos</p>
                <p className="text-2xl font-bold">{allAttachments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ REMOVIDO: Cards de anexos_comprador e anexos_vendedor (colunas excluídas do banco) */}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Building2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Do ML</p>
                <p className="text-2xl font-bold">{anexosML.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Galeria de Anexos */}
      {allAttachments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Galeria de Anexos ({allAttachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAttachments.map((attachment, index) => (
                <AttachmentCard key={index} attachment={attachment} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum anexo encontrado para esta devolução</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Visualização de Imagem */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Visualização da Imagem</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Visualização" 
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedImage, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Imagem
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
