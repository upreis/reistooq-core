import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AIChatWidget } from "./AIChatWidget";

export function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Balão flutuante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 transition-all duration-200",
          "flex items-center justify-center",
          isOpen && "scale-0"
        )}
        aria-label="Abrir assistente"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Widget do chat */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-300",
          "w-[380px] h-[600px]",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      >
        <div className="bg-background border rounded-lg shadow-2xl h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Assistente IA</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
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
