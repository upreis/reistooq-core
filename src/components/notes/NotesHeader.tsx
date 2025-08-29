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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {showArchived ? 'Notas Arquivadas' : 'Minhas Notas'}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{showArchived ? stats.archived : stats.total} notas</span>
          {!showArchived && stats.pinned > 0 && (
            <>
              <span>•</span>
              <Badge variant="secondary" className="text-xs">
                {stats.pinned} fixadas
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleArchived}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          {showArchived ? 'Ver Ativas' : 'Ver Arquivadas'}
        </Button>
        
        {!showArchived && (
          <Button
            onClick={onCreateNote}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Nota
          </Button>
        )}
      </div>
    </div>
  );
}