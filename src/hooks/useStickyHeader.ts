import React, { useEffect, useRef, useState } from 'react';

export function useStickyHeader<T extends HTMLElement>() {
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Quando o elemento não está mais intersectando (saiu da tela),
        // ativamos o estado 'sticky'.
        setIsSticky(!entry.isIntersecting);
      },
      {
        // Observa a borda superior do viewport.
        // O threshold 0 significa que o callback dispara assim que o
        // elemento toca a borda.
        rootMargin: '0px',
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return { ref, isSticky };
}
