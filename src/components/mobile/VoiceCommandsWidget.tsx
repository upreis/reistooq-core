import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceCommands, createDefaultVoiceCommands } from '@/hooks/useVoiceCommands';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '@/contexts/MobileContext';

export const VoiceCommandsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { vibrate } = useMobile();
  const [showCommands, setShowCommands] = useState(false);
  
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    confidence,
    commands,
    registerCommand
  } = useVoiceCommands();

  // Register default navigation commands
  useEffect(() => {
    const defaultCommands = createDefaultVoiceCommands(navigate);
    defaultCommands.forEach(command => {
      registerCommand(command);
    });
  }, [navigate, registerCommand]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
    vibrate('light');
  };

  const handleToggleCommands = () => {
    setShowCommands(!showCommands);
    vibrate('light');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main voice button */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          onClick={handleToggleListening}
          size="lg"
          variant={isListening ? "destructive" : "default"}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-300
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-primary hover:bg-primary/90'
            }
          `}
        >
          {isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
        
        {/* Listening indicator */}
        {isListening && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </motion.div>

      {/* Commands toggle button */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="mt-3"
      >
        <Button
          onClick={handleToggleCommands}
          size="sm"
          variant="outline"
          className="w-14 h-10 rounded-full shadow-md"
        >
          {showCommands ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </motion.div>

      {/* Transcript display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 right-0 mb-4"
        >
          <Card className="p-3 max-w-64 bg-black/80 backdrop-blur-sm text-white">
            <div className="text-sm font-medium mb-1">Ouvindo...</div>
            <div className="text-xs opacity-80">{transcript}</div>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="secondary" className="text-xs">
                Confiança: {Math.round(confidence * 100)}%
              </Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Commands list */}
      {showCommands && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute bottom-0 right-20"
        >
          <Card className="p-4 w-72 bg-background/95 backdrop-blur-sm">
            <h3 className="font-semibold mb-3 text-sm">Comandos de Voz</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {commands.filter(cmd => cmd.enabled).map((command) => (
                <div key={command.id} className="flex flex-col space-y-1">
                  <div className="text-xs font-medium text-primary">
                    {command.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    "{command.phrases[0]}"
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              Toque no microfone e fale um comando
            </div>
          </Card>
        </motion.div>
      )}