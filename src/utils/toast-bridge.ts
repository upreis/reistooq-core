// Bridge para toast global acessível de qualquer lugar
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Função global para mostrar toast
export function setupGlobalToast(toastFunction: (options: ToastOptions) => void) {
  if (typeof window !== 'undefined') {
    (window as any).showToast = toastFunction;
  }
}

// Utility para mostrar toast de qualquer lugar
export function showGlobalToast(options: ToastOptions) {
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast(options);
  }
}