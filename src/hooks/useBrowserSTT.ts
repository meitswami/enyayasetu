import { useState, useCallback, useRef, useEffect } from 'react';

export type STTLanguage = 'en' | 'hi' | 'hinglish';

interface UseBrowserSTTOptions {
  language?: STTLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

const sttLanguageMap: Record<STTLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  hinglish: 'hi-IN',
};

export function useBrowserSTT(options: UseBrowserSTTOptions = {}) {
  const {
    language = 'en',
    continuous = true,
    interimResults = true,
    onTranscript,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = sttLanguageMap[language];
        
        if ('maxAlternatives' in recognition) {
          recognition.maxAlternatives = 1;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimText = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimText += result[0].transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + ' ' + finalTranscript);
            onTranscript?.(finalTranscript, true);
          }
          
          setInterimTranscript(interimText);
          if (interimText) {
            onTranscript?.(interimText, false);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          const errorMessage = getErrorMessage(event.error);
          setError(errorMessage);
          onError?.(errorMessage);
          
          // Don't stop listening on recoverable errors
          if (!['no-speech', 'aborted'].includes(event.error)) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        };

        recognition.onend = () => {
          // Auto-restart if continuous mode and still should be listening
          if (isListeningRef.current && continuous) {
            try {
              recognition.start();
            } catch (e) {
              console.warn('Failed to restart recognition:', e);
              setIsListening(false);
              isListeningRef.current = false;
            }
          } else {
            setIsListening(false);
            isListeningRef.current = false;
          }
        };

        if ('onstart' in recognition) {
          recognition.onstart = () => {
            setError(null);
          };
        }

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, interimResults, language, onTranscript, onError]);

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = sttLanguageMap[language];
    }
  }, [language]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not supported');
      return false;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setError(message);
      onError?.(message);
      return false;
    }
  }, [isSupported, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Get final transcript (combines accumulated and interim)
  const getFullTranscript = useCallback(() => {
    return (transcript + ' ' + interimTranscript).trim();
  }, [transcript, interimTranscript]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    clearTranscript,
    getFullTranscript,
  };
}

// Helper to get user-friendly error messages
function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'Microphone not available.';
    case 'not-allowed':
      return 'Microphone permission denied.';
    case 'network':
      return 'Network error occurred.';
    case 'aborted':
      return 'Recognition was aborted.';
    case 'language-not-supported':
      return 'Language not supported.';
    case 'service-not-allowed':
      return 'Speech service not allowed.';
    default:
      return `Recognition error: ${error}`;
  }
}
