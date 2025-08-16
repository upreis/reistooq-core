import * as React from "react";

/**
 * Marca um nó como raiz do layout e detecta se ele está ANINHADO
 * dentro de outro layout igual. Se estiver, devolve mode="nested"
 * e a página interna deve renderizar apenas <Outlet />.
 */
export function useLayoutSingleton(key: string = "FullLayout") {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = React.useState<"primary" | "nested">("primary");

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Se existe um ancestral com o mesmo data-atributo, estamos aninhados
    const ancestor = el.parentElement?.closest?.(
      `[data-layout-root="${key}"]`
    ) as HTMLElement | null;

    if (ancestor) setMode("nested");
  }, [key]);

  return { ref, mode, key };
}