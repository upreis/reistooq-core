import React, { ReactNode, useState, useEffect } from "react";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SystemNotice = {
  id: string;
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  message: string;
  icon?: ReactNode;
  dismissible?: boolean;
  ttlHours?: number;
};

interface SystemBannerProps {
  notices: SystemNotice[];
}

const STORAGE_PREFIX = "reistoq.notice.dismissed.";

function isDismissed(id: string, ttlHours: number = 24): boolean {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
  if (!stored) return false;
  
  const dismissedAt = parseInt(stored, 10);
  const now = Date.now();
  const ttlMs = ttlHours * 60 * 60 * 1000;
  
  return (now - dismissedAt) < ttlMs;
}

function dismissNotice(id: string): void {
  localStorage.setItem(`${STORAGE_PREFIX}${id}`, Date.now().toString());
}

function getIconForTone(tone: SystemNotice["tone"]): ReactNode {
  switch (tone) {
    case "success":
      return <CheckCircle className="h-4 w-4" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4" />;
    case "danger":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getStylesForTone(tone: SystemNotice["tone"]): string {
  switch (tone) {
    case "success":
      return "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400";
    case "warning":
      return "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
    case "danger":
      return "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
    default:
      return "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400";
  }
}

export function SystemBanner({ notices }: SystemBannerProps) {
  const [visibleNotices, setVisibleNotices] = useState<SystemNotice[]>([]);

  useEffect(() => {
    const visible = notices.filter(notice => 
      !isDismissed(notice.id, notice.ttlHours)
    );
    setVisibleNotices(visible);
  }, [notices]);

  const handleDismiss = (id: string) => {
    dismissNotice(id);
    setVisibleNotices(prev => prev.filter(notice => notice.id !== id));
  };

  if (visibleNotices.length === 0) return null;

  return (
    <div className="w-full space-y-2 px-6 pt-2">
      {visibleNotices.map((notice) => {
        const icon = notice.icon || getIconForTone(notice.tone);
        const styles = getStylesForTone(notice.tone);
        const dismissible = notice.dismissible !== false;

        return (
          <div
            key={notice.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border",
              styles
            )}
          >
            <div className="flex-shrink-0">
              {icon}
            </div>
            
            <div className="flex-1 min-w-0">
              {notice.title && (
                <div className="font-medium text-sm mb-1">
                  {notice.title}
                </div>
              )}
              <div className="text-sm">
                {notice.message}
              </div>
            </div>

            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-6 w-6 p-0 hover:bg-white/20"
                onClick={() => handleDismiss(notice.id)}
                aria-label="Dispensar aviso"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}