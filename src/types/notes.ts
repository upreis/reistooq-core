// P1: Types robustos para o sistema de notas
export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isArchived: boolean;
}

export type NoteColor = 'amarelo' | 'azul' | 'rosa' | 'verde' | 'roxo' | 'laranja';

export interface CreateNoteData {
  title: string;
  content: string;
  color?: NoteColor;
  tags?: string[];
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface NotesFilter {
  searchQuery: string;
  selectedColor?: NoteColor;
  showArchived: boolean;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface NotesStats {
  total: number;
  pinned: number;
  archived: number;
  byColor: Record<NoteColor, number>;
}