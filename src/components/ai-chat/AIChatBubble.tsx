import { MessageCircle, X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { useAIChat } from "@/contexts/AIChatContext";
import { Badge } from "@/components/ui/badge";
import { GlowChatButton } from "@/components/ui/glow-chat-button";

export function AIChatBubble() {
  const { isOpen, toggleChat, closeChat, pendingInsight } = useAIChat();

  return (
    <>
      {/* Balão flutuante com efeito glow */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-300",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <GlowChatButton onClick={toggleChat} isPulsing={!!pendingInsight}>
          {pendingInsight ? (
            <Brain className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </GlowChatButton>
      </div>

      {/* Widget do chat */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-300",
          "w-[420px] max-w-[calc(100vw-48px)] h-[650px] max-h-[calc(100vh-48px)]",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-background border rounded-lg shadow-2xl h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              {pendingInsight ? (
                <>
                  <Brain className="h-5 w-5" />
                  <h3 className="font-semibold">Resolvendo Insight</h3>
                  <Badge variant="secondary" className="text-xs">
                    IA
                  </Badge>
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Assistente IA</h3>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChat}
              className="h-8 w-8 hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Widget */}
          <AIChatWidget />
        </div>
      </div>
    </>
  );
}
