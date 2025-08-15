import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export type Tone = 'warning' | 'info' | 'success' | 'danger';

export type GlobalNotice = {
  id: string;
  title?: string;
  message: string;
  tone?: Tone;
  collapsible?: boolean;
};

interface GlobalNoticeBarProps {
  notice: GlobalNotice;
}

const toneStyles = {
  warning: "bg-amber-500/10 border border-amber-500/30 text-amber-200",
  info: "bg-blue-500/10 border border-blue-500/30 text-blue-200", 
  success: "bg-green-500/10 border border-green-500/30 text-green-200",
  danger: "bg-red-500/10 border border-red-500/30 text-red-200"
};

export function GlobalNoticeBar({ notice }: GlobalNoticeBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('reistoq.globalNotice.collapsed');
    return saved === 'true';
  });

  const [isDismissed, setIsDismissed] = useState(() => {
    const saved = localStorage.getItem(`reistoq.globalNotice.dismissed.${notice.id}`);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('reistoq.globalNotice.collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleDismiss = () => {
    localStorage.setItem(`reistoq.globalNotice.dismissed.${notice.id}`, 'true');
    setIsDismissed(true);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isDismissed) return null;

  const tone = notice.tone || 'warning';
  const isCollapsible = notice.collapsible !== false;

  return (
    <div 
      className={`${toneStyles[tone]} mb-2 rounded px-3 py-2 relative`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isCollapsed ? (
            <div className="flex items-center gap-2">
              {notice.title && (
                <span className="font-medium text-sm truncate">{notice.title}</span>
              )}
              {!notice.title && (
                <span className="text-sm truncate">{notice.message}</span>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {notice.title && (
                <div className="font-medium text-sm">{notice.title}</div>
              )}
              <div className="text-sm">{notice.message}</div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {isCollapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-6 w-6 p-0 hover:bg-transparent opacity-70 hover:opacity-100"
              aria-label={isCollapsed ? "Expandir aviso" : "Recolher aviso"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent opacity-70 hover:opacity-100"
            aria-label="Dispensar aviso"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}