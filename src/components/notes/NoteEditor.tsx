// P3.4: Editor de nota avançado
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, X, Pin, Archive, Trash2, 
  Tag, Palette, Plus 
} from 'lucide-react';
import { Note, NoteColor, CreateNoteData, UpdateNoteData } from '@/types/notes';
import { useToastFeedback } from '@/hooks/useToastFeedback';

interface NoteEditorProps {
  note: Note | null;
  isCreating: boolean;
  onSave: (data: CreateNoteData | UpdateNoteData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onTogglePin?: (id: string) => Promise<void>;
  onToggleArchive?: (id: string) => Promise<void>;
  onClose: () => void;
}

const colorOptions: { value: NoteColor; label: string; class: string }[] = [
  { value: 'amarelo', label: 'Amarelo', class: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: 'azul', label: 'Azul', class: 'bg-blue-500 hover:bg-blue-600' },
  { value: 'rosa', label: 'Rosa', class: 'bg-pink-500 hover:bg-pink-600' },
  { value: 'verde', label: 'Verde', class: 'bg-green-500 hover:bg-green-600' },
  { value: 'roxo', label: 'Roxo', class: 'bg-purple-500 hover:bg-purple-600' },
  { value: 'laranja', label: 'Laranja', class: 'bg-orange-500 hover:bg-orange-600' },
];

export function NoteEditor({ 
  note, isCreating, onSave, onDelete, onTogglePin, onToggleArchive, onClose 
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('amarelo');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { showError } = useToastFeedback();

  // P3.4.1: Inicializar com dados da nota
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedColor(note.color);
      setTags(note.tags);
    } else {
      setTitle('');
      setContent('');
      setSelectedColor('amarelo');
      setTags([]);
    }
  }, [note]);

  // P3.4.2: Salvar nota
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      showError('O título da nota é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        title: title.trim(),
        content: content.trim(),
        color: selectedColor,
        tags: tags.filter(tag => tag.trim() !== ''),
      };

      await onSave(data);
      
      if (isCreating) {
        // Limpar formulário após criar
        setTitle('');
        setContent('');
        setTags([]);
      }
    } catch (error) {
      showError('Erro ao salvar nota');
    } finally {
      setIsSaving(false);
    }
  }, [title, content, selectedColor, tags, onSave, isCreating, showError]);

  // P3.4.3: Adicionar tag
  const handleAddTag = useCallback(() => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag('');
    }
  }, [newTag, tags]);

  // P3.4.4: Remover tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // P3.4.5: Teclas de atalho
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, onClose]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isCreating ? 'Nova Nota' : 'Editar Nota'}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {note && onTogglePin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onTogglePin(note.id)}
                className={note.isPinned ? 'text-primary' : ''}
              >
                <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
              </Button>
            )}
            
            {note && onToggleArchive && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleArchive(note.id)}
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            
            {note && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(note.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-6" onKeyDown={handleKeyDown}>
        {/* Título */}
        <Input
          placeholder="Título da nota..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-medium"
          autoFocus
        />

        {/* Conteúdo */}
        <Textarea
          placeholder="Escreva sua nota aqui..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 min-h-[200px] resize-none"
        />

        {/* Cores */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cor da nota
          </label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`w-8 h-8 rounded-full transition-all ${color.class} ${
                  selectedColor === color.value 
                    ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                    : 'hover:scale-105'
                }`}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </label>
          
          {/* Tags existentes */}
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="gap-1 cursor-pointer hover:bg-secondary/80 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
          
          {/* Adicionar nova tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Nova tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>

        {/* Atalhos */}
        <div className="text-xs text-muted-foreground">
          <p>Ctrl+S para salvar • Esc para fechar</p>
        </div>
      </CardContent>
    </Card>
  );
}