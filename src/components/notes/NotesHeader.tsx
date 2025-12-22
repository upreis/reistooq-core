// P3.1: Cabeçalho das notas com ações principais
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Archive, Settings } from 'lucide-react';
import { NotesStats } from '@/types/notes';

interface NotesHeaderProps {
  stats: NotesStats;
  showArchived: boolean;
  onCreateNote: () => void;
  onToggleArchived: () => void;
}

export function NotesHeader({ stats, showArchived, onCreateNote, onToggleArchived }: NotesHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold text-foreground">
          {showArchived ? 'Notas Arquivadas' : 'Minhas Notas'}
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{showArchived ? stats.archived : stats.total} notas</span>
          {!showArchived && stats.pinned > 0 && (
            <>
              <span>•</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {stats.pinned} fixadas
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleArchived}
          className="h-7 px-2.5 text-xs gap-1.5"
        >
          <Archive className="h-3.5 w-3.5" />
          {showArchived ? 'Ver Ativas' : 'Ver Arquivadas'}
        </Button>
        
        {!showArchived && (
          <Button
            onClick={onCreateNote}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Nota
          </Button>
        )}
      </div>
    </div>
  );
}