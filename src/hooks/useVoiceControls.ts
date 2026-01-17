import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useElevenLabsSTT } from './useElevenLabsSTT';

// Web Speech API types (fallback)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export type Language = 'en' | 'hi' | 'hinglish';
export type SpeakerType = 'judge' | 'prosecutor' | 'lawyer' | 'accused' | 'clerk' | 'ai';

interface UseVoiceControlsOptions {
  defaultLanguage?: Language;
  defaultSpeechRate?: number;
  onTranscript?: (text: string) => void;
  onSpeakingComplete?: () => void;
  useElevenLabs?: boolean; // Enable ElevenLabs STT
}

// Voice mapping for different characters
const voicePreferences: Record<SpeakerType, { pitch: number; rate: number }> = {
  judge: { pitch: 0.9, rate: 0.9 },
  prosecutor: { pitch: 1.1, rate: 1.0 },
  lawyer: { pitch: 1.0, rate: 0.95 },
  accused: { pitch: 1.2, rate: 1.0 },
  clerk: { pitch: 1.0, rate: 1.1 },
  ai: { pitch: 1.0, rate: 1.0 },
};

export const useVoiceControls = (options: UseVoiceControlsOptions = {}) => {
  const {
    defaultLanguage = 'en',
    defaultSpeechRate = 1.0,
    onTranscript,
    onSpeakingComplete,
    useElevenLabs = true, // Default to ElevenLabs
  } = options;

  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [speechRate, setSpeechRate] = useState(defaultSpeechRate);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sttMode, setSttMode] = useState<'elevenlabs' | 'webspeech'>(useElevenLabs ? 'elevenlabs' : 'webspeech');
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const webSpeechListeningRef = useRef(false);

  // ElevenLabs STT hook
  const elevenLabsSTT = useElevenLabsSTT({
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        onTranscript?.(text);
      }
    },
    language,
  });

  // Web Speech API fallback initialization
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionClass) {
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        let transcriptText = '';
        for (let i = 0; i < results.length; i++) {
          transcriptText += results[i][0].transcript;
        }
        
        if (results[0].isFinal) {
          onTranscript?.(transcriptText);
          webSpeechListeningRef.current = false;
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        webSpeechListeningRef.current = false;
        if (event.error !== 'no-speech') {
          toast.error('Speech recognition error. Please try again.');
        }
      };

      recognitionRef.current.onend = () => {
        webSpeechListeningRef.current = false;
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, [onTranscript]);

  // Update recognition language for Web Speech API and ElevenLabs
  useEffect(() => {
    if (recognitionRef.current) {
      const langMap: Record<Language, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        hinglish: 'hi-IN',
      };
      recognitionRef.current.lang = langMap[language];
    }
    
    // Sync ElevenLabs STT language
    if (elevenLabsSTT.currentLanguage !== language) {
      elevenLabsSTT.changeLanguage(language);
    }
  }, [language]);

  // Compute isListening based on active STT mode
  const isListening = sttMode === 'elevenlabs' 
    ? elevenLabsSTT.isListening 
    : webSpeechListeningRef.current;

  const startListening = useCallback(async () => {
    if (sttMode === 'elevenlabs') {
      // Use ElevenLabs STT
      await elevenLabsSTT.startListening();
    } else {
      // Fallback to Web Speech API
      if (!recognitionRef.current) {
        toast.error('Speech recognition not supported in your browser');
        return;
      }
      
      try {
        recognitionRef.current.start();
        webSpeechListeningRef.current = true;
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast.error('Failed to start voice input');
      }
    }
  }, [sttMode, elevenLabsSTT]);

  const stopListening = useCallback(() => {
    if (sttMode === 'elevenlabs') {
      elevenLabsSTT.stopListening();
    } else {
      recognitionRef.current?.stop();
      webSpeechListeningRef.current = false;
    }
  }, [sttMode, elevenLabsSTT]);

  // Get appropriate voice for language
  const getVoice = useCallback((lang: Language): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null;
    
    const voices = synthRef.current.getVoices();
    
    // Language preferences
    const langCodes: Record<Language, string[]> = {
      en: ['en-IN', 'en-GB', 'en-US', 'en'],
      hi: ['hi-IN', 'hi'],
      hinglish: ['hi-IN', 'en-IN', 'hi', 'en'],
    };
    
    const preferredCodes = langCodes[lang];
    
    for (const code of preferredCodes) {
      const voice = voices.find(v => v.lang.startsWith(code));
      if (voice) return voice;
    }
    
    return voices[0] || null;
  }, []);

  // Speak text using browser's Web Speech API
  const speak = useCallback((text: string, speaker: SpeakerType = 'judge') => {
    if (!text.trim() || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Set voice based on language
    const voice = getVoice(language);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Set language
    const langMap: Record<Language, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      hinglish: 'hi-IN',
    };
    utterance.lang = langMap[language];
    
    // Apply speaker-specific voice settings
    const prefs = voicePreferences[speaker];
    utterance.pitch = prefs.pitch;
    utterance.rate = speechRate * prefs.rate;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onSpeakingComplete?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      onSpeakingComplete?.();
    };

    synthRef.current.speak(utterance);
  }, [language, speechRate, getVoice, onSpeakingComplete]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // Calculate estimated speaking duration for a text
  const getEstimatedDuration = useCallback((text: string): number => {
    // Average speaking rate is about 150 words per minute
    // At rate 1.0, that's 2.5 words per second
    const words = text.split(/\s+/).length;
    const baseWPS = 2.5;
    const actualWPS = baseWPS * speechRate;
    return (words / actualWPS) * 1000; // Return milliseconds
  }, [speechRate]);

  const askAI = useCallback(async (prompt: string, role: SpeakerType = 'ai', caseContext?: string) => {
    if (!prompt.trim()) return null;

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('court-chat', {
        body: { prompt, role, language, caseContext },
      });

      if (error) throw error;
      
      return data.response as string;
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Failed to get AI response');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [language]);

  return {
    language,
    setLanguage,
    speechRate,
    setSpeechRate,
    isSpeaking,
    isListening,
    isProcessing,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    askAI,
    getEstimatedDuration,
    // ElevenLabs specific
    sttMode,
    setSttMode,
    partialTranscript: elevenLabsSTT.partialTranscript,
    isConnecting: elevenLabsSTT.isConnecting,
  };
};
