import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type STTLanguage = 'en' | 'hi' | 'hinglish';

interface UseElevenLabsSTTOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: STTLanguage;
}

interface TranscriptData {
  id: string;
  text: string;
}

// ElevenLabs language codes mapping
// See: https://elevenlabs.io/docs/cookbooks/speech-to-text/streaming
const ELEVENLABS_LANGUAGE_CODES: Record<STTLanguage, string> = {
  'en': 'en',      // English
  'hi': 'hi',      // Hindi  
  'hinglish': 'hi', // Hinglish uses Hindi model (best for mixed Hindi-English)
};

export const useElevenLabsSTT = (options: UseElevenLabsSTTOptions = {}) => {
  const { onTranscript, onError, language = 'en' } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [committedTranscripts, setCommittedTranscripts] = useState<TranscriptData[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<STTLanguage>(language);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update current language when prop changes
  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  // Get ElevenLabs language code from our language
  const getLanguageCode = useCallback((lang: STTLanguage): string => {
    return ELEVENLABS_LANGUAGE_CODES[lang] || 'en';
  }, []);

  // Encode audio for ElevenLabs API (PCM 16-bit)
  const encodeAudio = useCallback((float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }, []);

  const startListening = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Get token from edge function
      console.log('Requesting ElevenLabs scribe token...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');

      if (error || !data?.token) {
        throw new Error(error?.message || 'Failed to get scribe token');
      }

      console.log('Got scribe token, connecting to WebSocket...');
      console.log(`Using language: ${currentLanguage} (ElevenLabs code: ${getLanguageCode(currentLanguage)})`);

      // Connect to ElevenLabs WebSocket with language support
      const langCode = getLanguageCode(currentLanguage);
      const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/stream?model_id=scribe_v2_realtime&language_code=${langCode}`;
      const ws = new WebSocket(wsUrl, ['token', data.token]);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('ElevenLabs STT WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);

        // Start audio capture
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

        processorRef.current.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const audioBase64 = encodeAudio(new Float32Array(inputData));
            ws.send(JSON.stringify({
              type: 'audio',
              audio: audioBase64,
            }));
          }
        };

        sourceRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('ElevenLabs STT message:', message.type);

          switch (message.type) {
            case 'partial_transcript':
              const partialText = message.text || '';
              setPartialTranscript(partialText);
              onTranscript?.(partialText, false);
              break;

            case 'committed_transcript':
              const finalText = message.text || '';
              if (finalText.trim()) {
                const transcript: TranscriptData = {
                  id: Date.now().toString(),
                  text: finalText,
                };
                setCommittedTranscripts(prev => [...prev, transcript]);
                onTranscript?.(finalText, true);
              }
              setPartialTranscript('');
              break;

            case 'session_started':
              console.log('ElevenLabs STT session started');
              break;

            case 'error':
              console.error('ElevenLabs STT error:', message);
              onError?.(message.message || 'STT error');
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('ElevenLabs STT WebSocket error:', error);
        onError?.('WebSocket connection error');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('ElevenLabs STT WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        cleanup();
      };

    } catch (error: any) {
      console.error('Failed to start ElevenLabs STT:', error);
      toast.error(error.message || 'Failed to start speech recognition');
      onError?.(error.message || 'Failed to start speech recognition');
      setIsConnecting(false);
      cleanup();
    }
  }, [isConnected, isConnecting, currentLanguage, getLanguageCode, encodeAudio, onTranscript, onError]);

  // Method to change language (requires reconnection)
  const changeLanguage = useCallback((newLanguage: STTLanguage) => {
    const wasListening = isConnected;
    if (wasListening) {
      stopListening();
    }
    setCurrentLanguage(newLanguage);
    // If was listening, restart with new language after a brief delay
    if (wasListening) {
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [isConnected]);

  const cleanup = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanup();
    setIsConnected(false);
    setIsConnecting(false);
    setPartialTranscript('');
  }, [cleanup]);

  const clearTranscripts = useCallback(() => {
    setCommittedTranscripts([]);
    setPartialTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isConnected,
    isConnecting,
    isListening: isConnected,
    partialTranscript,
    committedTranscripts,
    currentLanguage,
    startListening,
    stopListening,
    clearTranscripts,
    changeLanguage,
  };
};
