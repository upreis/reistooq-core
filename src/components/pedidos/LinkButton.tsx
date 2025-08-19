import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkButtonProps {
  href?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function LinkButton({ href, children, className }: LinkButtonProps) {
  const disabled = !href || href.trim() === '';

  const handleClick = () => {
    if (!disabled && href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={className}
      aria-label={disabled ? 'Link não disponível' : 'Abrir em nova aba'}
    >
      <ExternalLink className="h-3 w-3 mr-1" />
      {children}
    </Button>
  );
}