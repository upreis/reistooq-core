/**
 * 🔍 API DEBUG PANEL
 * Painel expandível com dados brutos da API ML
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ApiDebugPanelProps {
  data: any;
  title?: string;
}

export function ApiDebugPanel({ data, title = 'Resposta Completa da API ML' }: ApiDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success('JSON copiado para área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{title}</span>
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copiar JSON
              </>
            )}
          </Button>
        </div>

        {/* Expandable Content */}
        {isOpen && (
          <ScrollArea className="h-[400px] w-full rounded-md border border-blue-200 dark:border-blue-800 bg-background">
            <pre className="p-4 text-xs font-mono overflow-x-auto">
              <code className="text-foreground">{jsonString}</code>
            </pre>
          </ScrollArea>
        )}

        {/* Collapsed Preview */}
        {!isOpen && (
          <div className="text-xs text-muted-foreground">
            Clique para ver os dados brutos da API ML ({Object.keys(data || {}).length} campos)
          </div>
        )}
      </div>
    </Card>
  );
}
