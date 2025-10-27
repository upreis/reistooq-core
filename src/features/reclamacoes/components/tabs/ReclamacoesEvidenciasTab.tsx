/**
 * 📎 ABA EVIDÊNCIAS - Galeria de evidências da reclamação
 * FASE 4.1: Completa com visualização e download
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Image as ImageIcon, Video, Download, ExternalLink, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ReclamacoesEvidenciasTabProps {
  claimId: string;
}

export function ReclamacoesEvidenciasTab({ claimId }: ReclamacoesEvidenciasTabProps) {
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvidencia, setSelectedEvidencia] = useState<any>(null);

  useEffect(() => {
    const fetchEvidencias = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('reclamacoes_evidencias')
        .select('*')
        .eq('claim_id', claimId)
        .order('date_created', { ascending: false });

      if (data) {
        setEvidencias(data);
      }
      setIsLoading(false);
    };

    fetchEvidencias();
  }, [claimId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      image: 'Imagem',
      video: 'Vídeo',
      document: 'Documento'
    };
    return labels[type] || type;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      buyer: 'Comprador',
      seller: 'Vendedor',
      mediator: 'Mediador ML'
    };
    return labels[role] || role;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      buyer: 'default',
      seller: 'secondary',
      mediator: 'destructive'
    };
    return <Badge variant={variants[role] || 'outline'}>{getRoleLabel(role)}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default', label: 'Ativa' },
      rejected: { variant: 'destructive', label: 'Rejeitada' }
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (evidencias.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sem Evidências</h3>
        <p className="text-sm">Nenhuma evidência foi enviada para esta reclamação</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidencias.map((evidencia) => (
          <Card key={evidencia.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {/* Preview da evidência */}
              <div className="relative h-48 bg-muted flex items-center justify-center cursor-pointer"
                   onClick={() => setSelectedEvidencia(evidencia)}>
                {evidencia.type === 'image' && evidencia.url ? (
                  <img 
                    src={evidencia.url} 
                    alt="Evidência"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="text-muted-foreground">[Imagem indisponível]</div>';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    {getTypeIcon(evidencia.type)}
                    <p className="text-xs mt-2">{getTypeLabel(evidencia.type)}</p>
                  </div>
                )}
                
                {/* Badge de status no canto */}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(evidencia.status)}
                </div>
              </div>

              {/* Informações */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {getRoleBadge(evidencia.uploader_role)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(evidencia.date_created), 'dd/MM/yy', { locale: ptBR })}
                  </span>
                </div>

                {evidencia.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {evidencia.description}
                  </p>
                )}

                <div className="flex gap-2">
                  {evidencia.url && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedEvidencia(evidencia)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(evidencia.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para visualização ampliada */}
      <Dialog open={!!selectedEvidencia} onOpenChange={() => setSelectedEvidencia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {getTypeLabel(selectedEvidencia?.type)} - {getRoleLabel(selectedEvidencia?.uploader_role)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview grande */}
            <div className="bg-muted rounded-lg overflow-hidden">
              {selectedEvidencia?.type === 'image' && selectedEvidencia?.url ? (
                <img 
                  src={selectedEvidencia.url} 
                  alt="Evidência" 
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              ) : selectedEvidencia?.type === 'video' && selectedEvidencia?.url ? (
                <video 
                  src={selectedEvidencia.url} 
                  controls 
                  className="w-full h-auto max-h-[600px]"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {getTypeIcon(selectedEvidencia?.type)}
                  <p className="ml-2">Preview não disponível</p>
                </div>
              )}
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Data de envio</p>
                <p>{selectedEvidencia?.date_created && format(new Date(selectedEvidencia.date_created), 'PPP HH:mm', { locale: ptBR })}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                {selectedEvidencia?.status && getStatusBadge(selectedEvidencia.status)}
              </div>
              {selectedEvidencia?.description && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Descrição</p>
                  <p>{selectedEvidencia.description}</p>
                </div>
              )}
            </div>

            {/* Botão de download */}
            {selectedEvidencia?.url && (
              <Button
                className="w-full"
                onClick={() => window.open(selectedEvidencia.url, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar {getTypeLabel(selectedEvidencia.type)}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
