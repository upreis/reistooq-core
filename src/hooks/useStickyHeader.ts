import { useEffect, useRef, useState } from 'react';

export function useStickyHeader<T extends HTMLElement>() {
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsSticky(!entry.isIntersecting);
        },
        {
          rootMargin: '-1px 0px 0px 0px',
          threshold: [0],
        }
      );

      observer.observe(element);

      return () => {
        if (element) {
          observer.unobserve(element);
        }
      };
    } catch (error) {
      console.error('[useStickyHeader] IntersectionObserver não suportado:', error);
      // Fallback: header sempre no modo normal (não sticky)
      setIsSticky(false);
    }
  }, []);

  return { ref, isSticky };
}
