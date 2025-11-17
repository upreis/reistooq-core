import { useEffect, useRef, useState } from 'react';

export function useStickyHeader<T extends HTMLElement>() {
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Pega a posição do topo do elemento sentinela uma única vez.
    const sentinelTop = element.getBoundingClientRect().top + window.scrollY;

    const handleScroll = () => {
      // A LÓGICA INFALÍVEL:
      // Compara o scroll vertical da janela com a posição original do sentinela.
      if (window.scrollY >= sentinelTop) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    // Adiciona o listener de scroll à janela
    window.addEventListener('scroll', handleScroll);

    // Limpa o listener quando o componente desmontar
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
    // A dependência vazia garante que o setup rode apenas uma vez.
  }, []);

  return { ref, isSticky };
}
