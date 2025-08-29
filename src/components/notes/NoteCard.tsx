// P3.3: Card individual de nota otimizado
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pin, Archive, Trash2, Edit, 
  Calendar, Tag, MoreVertical 
} from 'lucide-react';
import { Note } from '@/types/notes';
import { formatDate } from '@/lib/format';
import { memo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const colorClasses = {
  amarelo: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-800/30 dark:hover:bg-yellow-900/30',
  azul: 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800/30 dark:hover:bg-blue-900/30',
  rosa: 'bg-pink-50 border-pink-200 hover:bg-pink-100 dark:bg-pink-950/20 dark:border-pink-800/30 dark:hover:bg-pink-900/30',
  verde: 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-800/30 dark:hover:bg-green-900/30',
  roxo: 'bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/20 dark:border-purple-800/30 dark:hover:bg-purple-900/30',
  laranja: 'bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/20 dark:border-orange-800/30 dark:hover:bg-orange-900/30',
};

export const NoteCard = memo(function NoteCard({ 
  note, isSelected, onSelect, onEdit, onDelete, onTogglePin, onToggleArchive 
}: NoteCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Não selecionar se clicou em um botão
    if ((e.target as HTMLElement).closest('button')) return;
    onSelect(note.id);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? colorClasses[note.color] + ' ring-2 ring-primary' 
          : colorClasses[note.color]
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {note.isPinned && (
                  <Pin className="h-3 w-3 text-primary fill-current" />
                )}
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {note.title}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(note.updatedAt, true)}</span>
              </div>
            </div>

            {/* Menu de ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity text-foreground hover:bg-background/80"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(note.id)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
                  <Pin className="h-3 w-3 mr-2" />
                  {note.isPinned ? 'Desafixar' : 'Fixar'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleArchive(note.id)}>
                  <Archive className="h-3 w-3 mr-2" />
                  {note.isArchived ? 'Desarquivar' : 'Arquivar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(note.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Conteúdo */}
          {note.content && (
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {truncateText(note.content, 120)}
            </p>
          )}

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              {note.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 h-5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 h-5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                >
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});