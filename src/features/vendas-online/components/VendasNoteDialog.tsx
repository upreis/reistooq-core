/**
 * 📝 VENDAS NOTE DIALOG
 * Dialog para adicionar nota em pack
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VendasNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packId: string;
  integrationAccountId: string;
  onSuccess?: () => void;
}

export const VendasNoteDialog = ({
  open,
  onOpenChange,
  packId,
  integrationAccountId,
  onSuccess
}: VendasNoteDialogProps) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) {
      toast.error('Digite uma nota');
      return;
    }

    if (note.length > 300) {
      toast.error('Nota não pode ter mais de 300 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      // Usar ml-api-direct como a página /pedidos faz
      const { data, error } = await supabase.functions.invoke('ml-api-direct', {
        body: {
          action: 'create_pack_note',
          integration_account_id: integrationAccountId,
          pack_id: packId,
          note: note.trim()
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar nota');
      }

      toast.success('Nota adicionada com sucesso!');
      setNote('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao criar nota:', error);
      toast.error(error.message || 'Erro ao criar nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nota ao Pack</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Nota Informativa</Label>
            <Textarea
              id="note"
              placeholder="Digite uma nota sobre este pack..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {note.length}/300 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !note.trim()}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
