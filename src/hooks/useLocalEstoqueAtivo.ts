import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocalEstoque {
  id: string;
  nome: string;
  tipo: string;
}

interface LocalEstoqueStore {
  localAtivo: LocalEstoque | null;
  setLocalAtivo: (local: LocalEstoque) => void;
  clearLocal: () => void;
}

export const useLocalEstoqueAtivo = create<LocalEstoqueStore>()(
  persist(
    (set) => ({
      localAtivo: null,
      setLocalAtivo: (local) => {
        console.log('🏢 [Zustand] Definindo local ativo:', local.nome, local.id);
        set({ localAtivo: local });
      },
      clearLocal: () => {
        console.log('🏢 [Zustand] Limpando local ativo');
        set({ localAtivo: null });
      },
    }),
    {
      name: 'reistoq_local_estoque_ativo',
    }
  )
);
