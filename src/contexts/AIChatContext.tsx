import { createContext, useContext, useState, ReactNode } from 'react';

interface InsightContext {
  id: string;
  title: string;
  description: string;
  suggestedImprovement: string;
  affectedRoute?: string;
  type: string;
}

interface AIChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  pendingInsight: InsightContext | null;
  sendInsightToChat: (insight: InsightContext) => void;
  clearPendingInsight: () => void;
}

const AIChatContext = createContext<AIChatContextType | null>(null);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingInsight, setPendingInsight] = useState<InsightContext | null>(null);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen(prev => !prev);

  const sendInsightToChat = (insight: InsightContext) => {
    setPendingInsight(insight);
    setIsOpen(true);
  };

  const clearPendingInsight = () => {
    setPendingInsight(null);
  };

  return (
    <AIChatContext.Provider value={{
      isOpen,
      openChat,
      closeChat,
      toggleChat,
      pendingInsight,
      sendInsightToChat,
      clearPendingInsight
    }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within AIChatProvider');
  }
  return context;
}
