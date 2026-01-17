import React, { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Send,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { Language } from '@/hooks/useVoiceControls';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface VoiceControlsProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onMicToggle: () => void;
  onPromptSubmit: (prompt: string) => void;
  partialTranscript?: string;
  isConnecting?: boolean;
}

const languageLabels: Record<Language, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  hi: { label: 'हिंदी', flag: '🇮🇳' },
  hinglish: { label: 'Hinglish', flag: '🇮🇳🇬🇧' },
};

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  language,
  onLanguageChange,
  speechRate,
  onSpeechRateChange,
  isSpeaking,
  isListening,
  isProcessing,
  isMuted,
  onMuteToggle,
  onMicToggle,
  onPromptSubmit,
  partialTranscript,
  isConnecting,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  const handlePromptSubmit = () => {
    if (promptInput.trim()) {
      onPromptSubmit(promptInput.trim());
      setPromptInput('');
      setShowPromptInput(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {/* Language selector */}
      <Select value={language} onValueChange={(val) => onLanguageChange(val as Language)}>
        <SelectTrigger className="w-[140px] border-2 border-foreground">
          <Languages className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languageLabels).map(([key, { label, flag }]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <span>{flag}</span>
                <span>{label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Speech rate control */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Volume2 className="w-4 h-4" />
            {speechRate.toFixed(1)}x
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-2">
            <p className="text-sm font-medium">Speech Rate</p>
            <Slider
              value={[speechRate]}
              onValueChange={([val]) => onSpeechRateChange(val)}
              min={0.5}
              max={2.0}
              step={0.1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Mute button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onMuteToggle}
        className={cn(isMuted && 'bg-destructive/20')}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>

      {/* Microphone button */}
      <Button
        variant={isListening ? 'comic' : 'outline'}
        size="icon"
        onClick={onMicToggle}
        disabled={isConnecting}
        className={cn(
          isListening && 'animate-pulse bg-primary',
          isConnecting && 'opacity-50',
          'relative'
        )}
      >
        {isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <>
            <Mic className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          </>
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </Button>

      {/* Prompt input toggle */}
      <Button
        variant={showPromptInput ? 'comic' : 'outline'}
        size="icon"
        onClick={() => setShowPromptInput(!showPromptInput)}
      >
        <MessageSquare className="w-5 h-5" />
      </Button>

      {/* Inline prompt input */}
      {showPromptInput && (
        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Input
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Ask the court..."
            className="flex-1 min-w-[200px] border-2 border-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
          />
          <Button
            variant="comic"
            size="icon"
            onClick={handlePromptSubmit}
            disabled={!promptInput.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border-2 border-primary">
          <div className="flex gap-0.5">
            <span className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-5 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-1 h-2 bg-primary rounded animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
          <span className="text-sm font-medium text-primary">Speaking...</span>
        </div>
      )}

      {/* Real-time transcript indicator */}
      {isListening && partialTranscript && (
        <div className="w-full mt-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground italic">
              "{partialTranscript}"
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
