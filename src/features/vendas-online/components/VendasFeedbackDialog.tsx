/**
 * ⭐ VENDAS FEEDBACK DIALOG
 * Dialog para enviar feedback de venda
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface VendasFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  integrationAccountId: string;
  onSuccess?: () => void;
}

export const VendasFeedbackDialog = ({
  open,
  onOpenChange,
  orderId,
  integrationAccountId,
  onSuccess
}: VendasFeedbackDialogProps) => {
  const [rating, setRating] = useState<'positive' | 'negative' | 'neutral'>('positive');
  const [fulfilled, setFulfilled] = useState(true);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Usar ml-api-direct como a página /pedidos faz
      const { data, error } = await supabase.functions.invoke('ml-api-direct', {
        body: {
          action: 'create_order_feedback',
          integration_account_id: integrationAccountId,
          order_id: orderId,
          fulfilled,
          rating,
          message: message.trim() || undefined
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao enviar feedback');
      }

      toast.success('Feedback enviado com sucesso!');
      setRating('positive');
      setFulfilled(true);
      setMessage('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      toast.error(error.message || 'Erro ao enviar feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Feedback da Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pedido Cumprido */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fulfilled"
              checked={fulfilled}
              onCheckedChange={(checked) => setFulfilled(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label htmlFor="fulfilled" className="cursor-pointer">
              Pedido foi cumprido corretamente
            </Label>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Avaliação</Label>
            <RadioGroup
              value={rating}
              onValueChange={(value) => setRating(value as any)}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="positive" id="positive" />
                <Label htmlFor="positive" className="cursor-pointer flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  Positivo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="neutral" />
                <Label htmlFor="neutral" className="cursor-pointer flex items-center gap-2">
                  <Minus className="h-4 w-4 text-yellow-500" />
                  Neutro
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="negative" id="negative" />
                <Label htmlFor="negative" className="cursor-pointer flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  Negativo
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Adicione um comentário sobre a venda..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
