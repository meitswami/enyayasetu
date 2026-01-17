import { useState } from 'react';
import { Mic, MicOff, Settings, Zap, Globe } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useBrowserSTT } from '@/hooks/useBrowserSTT';

export type STTEngine = 'browser' | 'elevenlabs';

interface STTSettingsProps {
  currentEngine: STTEngine;
  onEngineChange: (engine: STTEngine) => void;
}

export function STTSettings({
  currentEngine,
  onEngineChange,
}: STTSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const browserSTT = useBrowserSTT();
  const [testListening, setTestListening] = useState(false);

  const handleTestMic = async () => {
    if (testListening) {
      browserSTT.stopListening();
      setTestListening(false);
    } else {
      const success = await browserSTT.startListening();
      if (success) {
        setTestListening(true);
        // Auto-stop after 5 seconds
        setTimeout(() => {
          browserSTT.stopListening();
          setTestListening(false);
        }, 5000);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="STT Settings">
          <Mic className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Speech-to-Text Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* STT Engine Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Voice Recognition Engine</Label>
            <RadioGroup
              value={currentEngine}
              onValueChange={(value) => onEngineChange(value as STTEngine)}
              className="space-y-3"
            >
              {/* Browser STT Option */}
              <div className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="browser" id="browser-stt" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="browser-stt" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="h-4 w-4 text-primary" />
                    Browser STT
                    <Badge variant="secondary" className="ml-auto">Free</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uses your browser's built-in speech recognition. Works offline in some browsers.
                    {browserSTT.isSupported 
                      ? ' (Supported in this browser)'
                      : ' (Not supported in this browser)'}
                  </p>
                </div>
              </div>

              {/* ElevenLabs Option */}
              <div className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="elevenlabs" id="elevenlabs-stt" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="elevenlabs-stt" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    ElevenLabs Scribe
                    <Badge variant="outline" className="ml-auto">Premium</Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    High-accuracy AI transcription with speaker diarization. Requires API credits.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Test Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Test Microphone</Label>
            <Button 
              onClick={handleTestMic} 
              disabled={currentEngine === 'browser' && !browserSTT.isSupported}
              className="w-full"
              variant={testListening ? "destructive" : "secondary"}
            >
              {testListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2 animate-pulse" />
                  Stop Listening...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Test Microphone (5s)
                </>
              )}
            </Button>
            
            {/* Live transcript preview */}
            {(browserSTT.transcript || browserSTT.interimTranscript) && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="text-foreground">{browserSTT.transcript}</span>
                  <span className="text-muted-foreground italic">{browserSTT.interimTranscript}</span>
                </p>
              </div>
            )}

            {browserSTT.error && (
              <p className="text-sm text-destructive">{browserSTT.error}</p>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Tip:</strong> Browser STT is recommended for offline use. 
            ElevenLabs provides better accuracy for legal terminology but requires internet.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to persist STT settings
export function useSTTSettings() {
  const [engine, setEngine] = useState<STTEngine>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stt-engine');
      return (saved as STTEngine) || 'browser';
    }
    return 'browser';
  });

  const handleEngineChange = (newEngine: STTEngine) => {
    setEngine(newEngine);
    localStorage.setItem('stt-engine', newEngine);
  };

  return {
    engine,
    setEngine: handleEngineChange,
  };
}
