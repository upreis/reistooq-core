import { useState, useRef, useCallback, useEffect } from 'react';
import { useMobile } from '@/contexts/MobileContext';

interface VoiceCommandsHook {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  confidence: number;
  commands: VoiceCommand[];
  registerCommand: (command: VoiceCommand) => void;
  unregisterCommand: (commandId: string) => void;
}

interface VoiceCommand {
  id: string;
  phrases: string[];
  action: (transcript: string) => void;
  description: string;
  enabled?: boolean;
}

export const useVoiceCommands = (): VoiceCommandsHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const { vibrate, showNotification } = useMobile();
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.maxAlternatives = 1;
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          vibrate('light');
        };
        
        recognitionRef.current.onresult = (event) => {
          const lastResult = event.results[event.results.length - 1];
          const transcriptResult = lastResult[0].transcript;
          const confidenceResult = lastResult[0].confidence;
          
          setTranscript(transcriptResult);
          setConfidence(confidenceResult);
          
          if (lastResult.isFinal) {
            processCommand(transcriptResult, confidenceResult);
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          showNotification('Erro de Voz', 'Erro no reconhecimento de voz');
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const processCommand = useCallback((transcript: string, confidence: number) => {
    if (confidence < 0.7) {
      showNotification('Comando de Voz', 'Comando não reconhecido com confiança suficiente');
      return;
    }

    const normalizedTranscript = transcript.toLowerCase().trim();
    
    const matchedCommand = commands.find(command => {
      if (!command.enabled) return false;
      return command.phrases.some(phrase => 
        normalizedTranscript.includes(phrase.toLowerCase())
      );
    });

    if (matchedCommand) {
      vibrate('medium');
      showNotification('Comando Executado', `Executando: ${matchedCommand.description}`);
      matchedCommand.action(transcript);
    } else {
      vibrate('light');
      showNotification('Comando de Voz', 'Comando não reconhecido');
    }
  }, [commands, vibrate, showNotification]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      showNotification('Erro', 'Reconhecimento de voz não suportado');
      return;
    }
    
    if (isListening) return;
    
    try {
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 10000);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      showNotification('Erro', 'Erro ao iniciar reconhecimento de voz');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsListening(false);
    setTranscript('');
    setConfidence(0);
  }, [isListening]);

  const registerCommand = useCallback((command: VoiceCommand) => {
    setCommands(prev => {
      // Remove existing command with same ID
      const filtered = prev.filter(cmd => cmd.id !== command.id);
      return [...filtered, { ...command, enabled: command.enabled ?? true }];
    });
  }, []);

  const unregisterCommand = useCallback((commandId: string) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== commandId));
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    transcript,
    confidence,
    commands,
    registerCommand,
    unregisterCommand
  };
};

// Pre-defined commands for common operations
export const createDefaultVoiceCommands = (navigate: (path: string) => void) => {
  return [
    {
      id: 'nav-dashboard',
      phrases: ['ir para dashboard', 'abrir dashboard', 'página inicial'],
      action: () => navigate('/'),
      description: 'Ir para o dashboard'
    },
    {
      id: 'nav-estoque',
      phrases: ['ir para estoque', 'abrir estoque', 'ver produtos'],
      action: () => navigate('/estoque'),
      description: 'Ir para o estoque'
    },
    {
      id: 'nav-pedidos',
      phrases: ['ir para pedidos', 'abrir pedidos', 'ver pedidos'],
      action: () => navigate('/pedidos'),
      description: 'Ir para pedidos'
    },
    {
      id: 'nav-scanner',
      phrases: ['abrir scanner', 'escanear código', 'ler código de barras'],
      action: () => navigate('/scanner'),
      description: 'Abrir scanner'
    },
    {
      id: 'nav-shop',
      phrases: ['ir para loja', 'abrir loja', 'ver loja'],
      action: () => navigate('/shop'),
      description: 'Ir para a loja'
    }
  ];
};