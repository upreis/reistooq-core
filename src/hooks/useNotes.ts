// P2: Hook centralizado para gerenciar estado de notas
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Note, CreateNoteData, UpdateNoteData, NotesFilter, NotesStats, NoteColor } from '@/types/notes';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useToastFeedback } from '@/hooks/useToastFeedback';

// Dados mockados iniciais
const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Minha primeira nota',
    content: 'Esta é uma nota de exemplo para demonstrar o sistema de notas melhorado.',
    color: 'azul',
    tags: ['exemplo', 'teste'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isPinned: false,
    isArchived: false,
  },
  {
    id: '2',
    title: 'Lista de tarefas',
    content: 'Implementar:\n- Sistema de busca\n- Filtros avançados\n- Sincronização em tempo real',
    color: 'verde',
    tags: ['trabalho', 'tarefas'],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-16'),
    isPinned: true,
    isArchived: false,
  },
  {
    id: '3',
    title: 'Ideias para o projeto',
    content: 'Brainstorming de funcionalidades novas para melhorar a experiência do usuário.',
    color: 'amarelo',
    tags: ['ideias', 'projeto'],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
    isPinned: false,
    isArchived: false,
  },
];

const defaultFilter: NotesFilter = {
  searchQuery: '',
  selectedColor: undefined,
  showArchived: false,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    // P2.1: Carregar do localStorage se disponível
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : initialNotes;
  });
  
  const [filter, setFilter] = useState<NotesFilter>(defaultFilter);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  const { isLoading, error, withLoading } = useLoadingState();
  const { showSuccess, showError } = useToastFeedback();

  // P2.2: Persistir no localStorage
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  // P2.3: Criar nova nota
  const createNote = useCallback(async (data: CreateNoteData) => {
    return withLoading((async () => {
      const newNote: Note = {
        id: Date.now().toString(),
        title: data.title || 'Nova nota',
        content: data.content,
        color: data.color || 'amarelo',
        tags: data.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        isArchived: false,
      };

      setNotes(prev => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      showSuccess('Nota criada com sucesso!');
      return newNote;
    })());
  }, [withLoading, showSuccess, setSelectedNoteId]);

  // P2.4: Atualizar nota
  const updateNote = useCallback(async (id: string, data: UpdateNoteData) => {
    return withLoading((async () => {
      setNotes(prev => prev.map(note => 
        note.id === id 
          ? { ...note, ...data, updatedAt: new Date() }
          : note
      ));
      showSuccess('Nota atualizada!');
    })());
  }, [withLoading, showSuccess]);

  // P2.5: Deletar nota
  const deleteNote = useCallback(async (id: string) => {
    return withLoading((async () => {
      setNotes(prev => prev.filter(note => note.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
      showSuccess('Nota excluída!');
    })());
  }, [withLoading, showSuccess, selectedNoteId]);

  // P2.6: Alternar fixação
  const togglePin = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      await updateNote(id, { isPinned: !note.isPinned });
    }
  }, [notes, updateNote]);

  // P2.7: Arquivar/desarquivar
  const toggleArchive = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      await updateNote(id, { isArchived: !note.isArchived });
    }
  }, [notes, updateNote]);

  // P2.8: Notas filtradas e ordenadas
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Filtro de arquivadas
      if (!filter.showArchived && note.isArchived) return false;
      if (filter.showArchived && !note.isArchived) return false;

      // Filtro de busca
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      // Filtro de cor
      if (filter.selectedColor && note.color !== filter.selectedColor) return false;

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      // Notas fixadas sempre no topo
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      let comparison = 0;
      switch (filter.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'pt-BR');
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

  // P2.9: Estatísticas
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

  // P2.10: Nota selecionada
  const selectedNote = useMemo(() => 
    notes.find(note => note.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  return {
    // Estado
    notes: filteredNotes,
    allNotes: notes,
    selectedNote,
    filter,
    stats,
    isLoading,
    error,

    // Ações
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    setFilter,
    setSelectedNoteId,

    // Utilities
    resetFilter: () => setFilter(defaultFilter),
  };
}