import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Zap, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useBrowserTTS } from '@/hooks/useBrowserTTS';

export type TTSEngine = 'browser' | 'elevenlabs';

interface TTSSettingsProps {
  currentEngine: TTSEngine;
  onEngineChange: (engine: TTSEngine) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
}

export function TTSSettings({
  currentEngine,
  onEngineChange,
  speechRate,
  onSpeechRateChange,
}: TTSSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const browserTTS = useBrowserTTS();
  const [testPlaying, setTestPlaying] = useState(false);

  const handleTestVoice = async () => {
    setTestPlaying(true);
    try {
      if (currentEngine === 'browser') {
        await browserTTS.speak(
          "Testing voice. The court is now in session.",
          'judge',
          'en'
        );
      } else {
        // ElevenLabs test would need API call
        await browserTTS.speak(
          "ElevenLabs test requires API. Using browser voice for demo.",
          'judge',
          'en'
        );
      }
    } finally {
      setTestPlaying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="TTS Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Text-to-Speech Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* TTS Engine Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Voice Engine</Label>
            <RadioGroup
              value={currentEngine}
              onValueChange={(value) => onEngineChange(value as TTSEngine)}
              className="space-y-3"
            >
              {/* Browser TTS Option */}
              <div className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="browser" id="browser" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="browser" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="h-4 w-4 text-primary" />
                    Browser TTS
                    <Badge variant="secondary" className="ml-auto">Free</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uses your browser's built-in speech synthesis. Works offline, unlimited usage.
                    {browserTTS.isSupported 
                      ? ` (${browserTTS.voices.length} voices available)`
                      : ' (Not supported in this browser)'}
                  </p>
                </div>
              </div>

              {/* ElevenLabs Option */}
              <div className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="elevenlabs" id="elevenlabs" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="elevenlabs" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    ElevenLabs AI
                    <Badge variant="outline" className="ml-auto">Premium</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    High-quality AI voices with natural emotion. Requires API credits.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Speech Rate */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Speech Rate</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Slow</span>
              <Slider
                value={[speechRate]}
                onValueChange={([value]) => onSpeechRateChange(value)}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Fast</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Current: {speechRate.toFixed(1)}x
            </p>
          </div>

          {/* Test Button */}
          <Button 
            onClick={handleTestVoice} 
            disabled={testPlaying || (currentEngine === 'browser' && !browserTTS.isSupported)}
            className="w-full"
            variant="secondary"
          >
            {testPlaying ? (
              <>
                <VolumeX className="h-4 w-4 mr-2 animate-pulse" />
                Playing...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Test Voice
              </>
            )}
          </Button>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Tip:</strong> Browser TTS is recommended for offline use or to avoid API limits.
            ElevenLabs provides more natural-sounding voices but requires an active subscription.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to persist TTS settings
export function useTTSSettings() {
  const [engine, setEngine] = useState<TTSEngine>(() => {
    const saved = localStorage.getItem('tts-engine');
    return (saved as TTSEngine) || 'browser';
  });
  
  const [speechRate, setSpeechRate] = useState(() => {
    const saved = localStorage.getItem('tts-speech-rate');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    localStorage.setItem('tts-engine', engine);
  }, [engine]);

  useEffect(() => {
    localStorage.setItem('tts-speech-rate', speechRate.toString());
  }, [speechRate]);

  return {
    engine,
    setEngine,
    speechRate,
    setSpeechRate,
  };
}
