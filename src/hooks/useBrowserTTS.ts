import { useState, useCallback, useRef, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'hinglish';
export type SpeakerType = 'judge' | 'public_prosecutor' | 'defence_lawyer' | 'accused' | 'steno' | 'clerk' | 'witness';

interface VoiceSettings {
  pitch: number;
  rate: number;
}

const voiceSettings: Record<SpeakerType, VoiceSettings> = {
  judge: { pitch: 0.85, rate: 0.85 },
  public_prosecutor: { pitch: 1.1, rate: 1.0 },
  defence_lawyer: { pitch: 1.0, rate: 0.95 },
  accused: { pitch: 1.15, rate: 1.0 },
  steno: { pitch: 1.0, rate: 1.1 },
  clerk: { pitch: 0.95, rate: 0.95 },
  witness: { pitch: 1.05, rate: 0.9 },
};

const languageMap: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  hinglish: 'hi-IN',
};

export function useBrowserTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize and check support
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Get best voice for language
  const getVoice = useCallback((lang: Language): SpeechSynthesisVoice | null => {
    const targetLang = languageMap[lang];
    
    // Prefer Indian voices
    const indianVoice = voices.find(v => 
      v.lang.includes('IN') && 
      (lang === 'hi' ? v.lang.includes('hi') : v.lang.includes('en'))
    );
    if (indianVoice) return indianVoice;
    
    // Fallback to any matching language
    const langVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    if (langVoice) return langVoice;
    
    // Default to first available
    return voices[0] || null;
  }, [voices]);

  // Speak text
  const speak = useCallback((
    text: string, 
    speaker: SpeakerType = 'judge',
    language: Language = 'en'
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSupported || !window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Set language
      utterance.lang = languageMap[language];
      
      // Get voice
      const voice = getVoice(language);
      if (voice) {
        utterance.voice = voice;
      }
      
      // Apply speaker-specific settings
      const settings = voiceSettings[speaker] || { pitch: 1.0, rate: 1.0 };
      utterance.pitch = settings.pitch;
      utterance.rate = settings.rate;
      
      // Events
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        if (e.error !== 'canceled') {
          reject(new Error(e.error));
        } else {
          resolve();
        }
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported, getVoice]);

  // Stop speaking
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, []);

  // Resume speaking
  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  // Get available voices for a language
  const getVoicesForLanguage = useCallback((lang: Language): SpeechSynthesisVoice[] => {
    const prefix = lang === 'hi' || lang === 'hinglish' ? 'hi' : 'en';
    return voices.filter(v => v.lang.startsWith(prefix));
  }, [voices]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
    getVoicesForLanguage,
    setLanguage: setCurrentLanguage,
    currentLanguage,
  };
}
