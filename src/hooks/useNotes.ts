import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Note, CreateNoteData, UpdateNoteData, NotesFilter, NotesStats, NoteColor } from '@/types/notes';
import { useToast } from '@/hooks/use-toast';

// Mapeamento dos dados do banco para a interface
const mapDatabaseToNote = (dbNote: any): Note => ({
  id: dbNote.id,
  title: dbNote.title,
  content: dbNote.content,
  color: dbNote.color as NoteColor,
  tags: dbNote.tags || [],
  createdAt: new Date(dbNote.created_at),
  updatedAt: new Date(dbNote.updated_at),
  isPinned: dbNote.is_pinned,
  isArchived: dbNote.is_archived,
  isShared: dbNote.is_shared,
  // Campos de conectividade
  related_pedido_id: dbNote.related_pedido_id,
  related_produto_id: dbNote.related_produto_id,
  related_cliente_id: dbNote.related_cliente_id,
  shared_with: dbNote.shared_with || [],
  created_by: dbNote.created_by,
  last_edited_by: dbNote.last_edited_by,
});

const defaultFilter: NotesFilter = {
  searchQuery: '',
  selectedColor: undefined,
  showArchived: false,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<NotesFilter>(defaultFilter);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar notas do Supabase
  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id, title, content, color, tags, 
          is_pinned, is_archived, is_shared,
          related_pedido_id, related_produto_id, related_cliente_id,
          shared_with, created_by, last_edited_by,
          created_at, updated_at
        `)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mappedNotes = (data || []).map(mapDatabaseToNote);
      setNotes(mappedNotes);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      setError('Não foi possível carregar as notas');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notas',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Criar nova nota
  const createNote = useCallback(async (data: CreateNoteData) => {
    try {
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          title: data.title,
          content: data.content,
          color: data.color || 'amarelo',
          tags: data.tags || [],
          is_pinned: false,
          is_archived: false,
          is_shared: false
        } as any)
        .select()
        .single();

      if (error) throw error;

      const mappedNote = mapDatabaseToNote(newNote);
      setNotes(prev => [mappedNote, ...prev]);
      
      toast({
        title: 'Sucesso',
        description: 'Nota criada com sucesso',
        variant: 'default'
      });

      return mappedNote;
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a nota',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Atualizar nota
  const updateNote = useCallback(async (id: string, data: UpdateNoteData) => {
    try {
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.isPinned !== undefined) updateData.is_pinned = data.isPinned;
      if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;

      const { data: updatedNote, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mappedNote = mapDatabaseToNote(updatedNote);
      setNotes(prev => prev.map(note => 
        note.id === id ? mappedNote : note
      ));

      toast({
        title: 'Sucesso',
        description: 'Nota atualizada com sucesso',
        variant: 'default'
      });

      return mappedNote;
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a nota',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Deletar nota
  const deleteNote = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== id));
      
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }

      toast({
        title: 'Sucesso',
        description: 'Nota excluída com sucesso',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a nota',
        variant: 'destructive'
      });
      throw error;
    }
  }, [selectedNoteId, toast]);

  // Toggle pin
  const togglePin = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    await updateNote(id, { isPinned: !note.isPinned });
  }, [notes, updateNote]);

  // Toggle archive
  const toggleArchive = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    await updateNote(id, { isArchived: !note.isArchived });
  }, [notes, updateNote]);

  // Filtrar notas
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Filtro de arquivadas
      if (filter.showArchived !== note.isArchived) {
        return false;
      }

      // Filtro de cor
      if (filter.selectedColor && note.color !== filter.selectedColor) {
        return false;
      }

      // Filtro de busca
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.tags.some(tag => 
          tag.toLowerCase().includes(query)
        );
        
        if (!matchesTitle && !matchesContent && !matchesTags) {
          return false;
        }
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      // Notas fixadas sempre no topo
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Depois ordenar pelo critério selecionado
      let comparison = 0;
      
      switch (filter.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
        default:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }

      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [notes, filter]);

  // Estatísticas
  const stats: NotesStats = useMemo(() => {
    const total = notes.filter(n => !n.isArchived).length;
    const pinned = notes.filter(n => n.isPinned && !n.isArchived).length;
    const archived = notes.filter(n => n.isArchived).length;

    const byColor = notes.reduce((acc, note) => {
      if (!note.isArchived) {
        acc[note.color] = (acc[note.color] || 0) + 1;
      }
      return acc;
    }, {} as Record<NoteColor, number>);

    return { total, pinned, archived, byColor };
  }, [notes]);

  // Nota selecionada
  const selectedNote = useMemo(() => 
    notes.find(note => note.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  // Reset filter
  const resetFilter = useCallback(() => {
    setFilter(defaultFilter);
  }, []);

  // Carregar notas iniciais
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes: filteredNotes,
    allNotes: notes,
    selectedNote,
    filter,
    stats,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    setFilter,
    setSelectedNoteId,
    resetFilter,
    refreshNotes: loadNotes
  };
}