import React, { useState, useEffect } from 'react';
import { GlobalNoticeBar, GlobalNotice } from './GlobalNoticeBar';

export function GlobalNoticeHost() {
  const [notice, setNotice] = useState<GlobalNotice | null>(null);

  useEffect(() => {
    // Check localStorage first
    const savedNotice = localStorage.getItem('reistoq.globalNotice.data');
    if (savedNotice) {
      try {
        const parsed = JSON.parse(savedNotice);
        setNotice(parsed);
        return;
      } catch (e) {
        console.warn('Invalid notice data in localStorage');
      }
    }

    // Fallback to environment variables
    const envMessage = import.meta.env.VITE_BANNER_MESSAGE;
    if (envMessage) {
      setNotice({
        id: 'env-banner',
        title: import.meta.env.VITE_BANNER_TITLE || undefined,
        message: String(envMessage),
        tone: (import.meta.env.VITE_BANNER_TONE as any) || 'warning',
        collapsible: true
      });
    }
  }, []);

  // Listen for localStorage changes (when updated from Configurações)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reistoq.globalNotice.data') {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setNotice(parsed);
          } catch (err) {
            console.warn('Invalid notice data in storage event');
          }
        } else {
          setNotice(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!notice) return null;

  return (
    <div className="sticky top-0 z-[70] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container">
        <GlobalNoticeBar notice={notice} />
      </div>
    </div>
  );
}