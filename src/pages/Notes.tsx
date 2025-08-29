
// P4: Página principal de notas com arquitetura modular
import { useState, useCallback } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NotesHeader } from '@/components/notes/NotesHeader';
import { NotesSearch } from '@/components/notes/NotesSearch';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { CreateNoteData, UpdateNoteData } from '@/types/notes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText } from 'lucide-react';

const Notes = () => {
  const {
    notes,
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
  } = useNotes();

  const [showEditor, setShowEditor] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // P4.1: Ações da interface
  const handleCreateNote = useCallback(() => {
    setIsCreating(true);
    setShowEditor(true);
    setSelectedNoteId(null);
  }, [setSelectedNoteId]);

  const handleEditNote = useCallback((noteId: string) => {
    setIsCreating(false);
    setShowEditor(true);
    setSelectedNoteId(noteId);
  }, [setSelectedNoteId]);

  const handleSelectNote = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
    if (window.innerWidth < 1024) {
      // Em mobile, abrir editor automaticamente
      handleEditNote(noteId);
    }
  }, [setSelectedNoteId, handleEditNote]);

  const handleSaveNote = useCallback(async (data: CreateNoteData | UpdateNoteData) => {
    if (isCreating) {
      await createNote(data as CreateNoteData);
    } else if (selectedNote) {
      await updateNote(selectedNote.id, data as UpdateNoteData);
    }
    setShowEditor(false);
  }, [isCreating, selectedNote, createNote, updateNote]);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setIsCreating(false);
  }, []);

  const handleToggleArchived = useCallback(() => {
    setFilter({ ...filter, showArchived: !filter.showArchived });
    setSelectedNoteId(null);
  }, [filter, setFilter, setSelectedNoteId]);


  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
      await deleteNote(noteId);
      setShowEditor(false);
    }
  }, [deleteNote]);

  return (
    <div className="space-y-6 h-full">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Notas</span>
      </div>

      {/* Header */}
      <NotesHeader
        stats={stats}
        showArchived={filter.showArchived}
        onCreateNote={handleCreateNote}
        onToggleArchived={handleToggleArchived}
      />

      {/* Busca e Filtros */}
      <NotesSearch
        filter={filter}
        onFilterChange={setFilter}
        onResetFilter={resetFilter}
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
        {/* Lista de notas */}
        <div className="space-y-4 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando notas...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {filter.showArchived ? 'Nenhuma nota arquivada' : 'Nenhuma nota encontrada'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filter.showArchived 
                  ? 'Você ainda não arquivou nenhuma nota.'
                  : 'Comece criando sua primeira nota!'
                }
              </p>
              {!filter.showArchived && (
                <button 
                  onClick={handleCreateNote}
                  className="text-primary hover:underline"
                >
                  Criar primeira nota
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-full">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSelected={selectedNote?.id === note.id}
                  onSelect={handleSelectNote}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                  onTogglePin={togglePin}
                  onToggleArchive={toggleArchive}
                />
              ))}
            </div>
          )}
        </div>

        {/* Editor de nota */}
        <div className="lg:col-span-2">
          {showEditor ? (
            <NoteEditor
              note={selectedNote}
              isCreating={isCreating}
              onSave={handleSaveNote}
              onDelete={selectedNote ? handleDeleteNote : undefined}
              onTogglePin={selectedNote ? togglePin : undefined}
              onToggleArchive={selectedNote ? toggleArchive : undefined}
              onClose={handleCloseEditor}
            />
          ) : selectedNote ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <FileText className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nota Selecionada
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique em "Editar" no menu da nota para começar a editá-la.
                </p>
                <button 
                  onClick={() => handleEditNote(selectedNote.id)}
                  className="text-primary hover:underline"
                >
                  Editar esta nota
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <FileText className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Bem-vindo às suas Notas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione uma nota da lista ou crie uma nova para começar.
                </p>
                <button 
                  onClick={handleCreateNote}
                  className="text-primary hover:underline"
                >
                  Criar nova nota
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;