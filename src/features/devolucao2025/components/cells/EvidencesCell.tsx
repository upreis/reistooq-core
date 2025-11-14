/**
 * 📎 EVIDÊNCIAS/ANEXOS CELL
 * Exibe a quantidade de fotos e arquivos enviados pelo comprador
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Paperclip, Image, FileText, AlertCircle } from 'lucide-react';

interface EvidencesCellProps {
  attachments: any[] | null;
  totalEvidencias?: number;
}

export const EvidencesCell = ({ attachments, totalEvidencias }: EvidencesCellProps) => {
  const total = totalEvidencias || attachments?.length || 0;
  
  if (total === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Paperclip className="h-3 w-3" />
        <span className="text-sm">Sem anexos</span>
      </div>
    );
  }

  // Contar tipos de anexos
  const photos = attachments?.filter((att: any) => 
    att.type === 'image' || att.type === 'photo' || att.content_type?.startsWith('image/')
  ).length || 0;
  
  const documents = attachments?.filter((att: any) => 
    att.type === 'document' || att.type === 'file' || 
    (!att.content_type?.startsWith('image/') && att.type !== 'image' && att.type !== 'photo')
  ).length || 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {photos > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Image className="h-3 w-3" />
                {photos}
              </Badge>
            )}
            {documents > 0 && (
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                {documents}
              </Badge>
            )}
            {total > 0 && photos === 0 && documents === 0 && (
              <Badge variant="default" className="gap-1">
                <Paperclip className="h-3 w-3" />
                {total}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Evidências do Comprador</p>
            {photos > 0 && <p>📷 {photos} foto{photos !== 1 ? 's' : ''}</p>}
            {documents > 0 && <p>📄 {documents} documento{documents !== 1 ? 's' : ''}</p>}
            <p className="text-xs text-muted-foreground">Total: {total} anexo{total !== 1 ? 's' : ''}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
