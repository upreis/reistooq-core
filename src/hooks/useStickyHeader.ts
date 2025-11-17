import { useEffect, useRef, useState } from 'react';

export function useStickyHeader<T extends HTMLElement>() {
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

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
  }, []);

  return { ref, isSticky };
}
