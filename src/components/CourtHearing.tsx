import React, { useState, useEffect, useCallback } from 'react';
import { CourtroomScene } from './CourtroomScene';
import { CaseData } from '@/data/exampleCases';
import { Button } from './ui/button';
import { ArrowLeft, FastForward, Pause, Play, RotateCcw } from 'lucide-react';
import { SpeakerRole } from './SpeechBubble';
import { VoiceControls } from './VoiceControls';
import { useVoiceControls, SpeakerType } from '@/hooks/useVoiceControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { HearingTimer } from './HearingTimer';

interface DialogueLine {
  speaker: SpeakerRole;
  speakerName: string;
  message: string;
}

interface CourtHearingProps {
  caseData: CaseData;
  onBack: () => void;
}

export const CourtHearing: React.FC<CourtHearingProps> = ({
  caseData,
  onBack,
}) => {
  const { language, setLanguage, speechRate, setSpeechRate, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Generate dialogue with translations
  const generateDialogue = useCallback((): DialogueLine[] => {
    const judgeName = "Hon. Justice Verma";
    const prosecutorName = "Adv. Sharma (PP)";
    const lawyerName = "Adv. Kapoor";
    const accusedName = caseData.defendant.split(' ')[0];

    const interpolate = (template: string, vars: Record<string, string | number>): string => {
      return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] || ''));
    };

    return [
      {
        speaker: 'clerk' as SpeakerRole,
        speakerName: language === 'hi' ? 'कोर्ट क्लर्क' : 'Court Clerk',
        message: interpolate(t('dialogue.clerk.intro'), { caseId: caseData.id, caseTitle: caseData.title }),
      },
      {
        speaker: 'judge' as SpeakerRole,
        speakerName: judgeName,
        message: interpolate(t('dialogue.judge.seated'), { plaintiff: caseData.plaintiff, defendant: caseData.defendant }),
      },
      {
        speaker: 'judge' as SpeakerRole,
        speakerName: judgeName,
        message: interpolate(t('dialogue.judge.category'), { category: caseData.category, evidenceCount: caseData.evidence.length }),
      },
      {
        speaker: 'prosecutor' as SpeakerRole,
        speakerName: prosecutorName,
        message: interpolate(t('dialogue.prosecutor.summary'), { summary: caseData.summary.slice(0, 200) }),
      },
      {
        speaker: 'prosecutor' as SpeakerRole,
        speakerName: prosecutorName,
        message: interpolate(t('dialogue.prosecutor.evidence'), { evidence: caseData.evidence.slice(0, 3).join(', ') }),
      },
      {
        speaker: 'judge' as SpeakerRole,
        speakerName: judgeName,
        message: t('dialogue.judge.defense'),
      },
      {
        speaker: 'lawyer' as SpeakerRole,
        speakerName: lawyerName,
        message: interpolate(t('dialogue.lawyer.deny'), { accused: accusedName }),
      },
      {
        speaker: 'lawyer' as SpeakerRole,
        speakerName: lawyerName,
        message: interpolate(t('dialogue.lawyer.request'), { legalIssue: caseData.legalIssues[0] }),
      },
      {
        speaker: 'accused' as SpeakerRole,
        speakerName: caseData.defendant,
        message: t('dialogue.accused.innocent'),
      },
      {
        speaker: 'judge' as SpeakerRole,
        speakerName: judgeName,
        message: interpolate(t('dialogue.judge.issues'), { legalIssues: caseData.legalIssues.join(', ') }),
      },
      {
        speaker: 'prosecutor' as SpeakerRole,
        speakerName: prosecutorName,
        message: t('dialogue.prosecutor.gravity'),
      },
      {
        speaker: 'lawyer' as SpeakerRole,
        speakerName: lawyerName,
        message: t('dialogue.lawyer.objection'),
      },
      {
        speaker: 'judge' as SpeakerRole,
        speakerName: judgeName,
        message: t('dialogue.judge.noted'),
      },
      {
        speaker: 'judge' as SpeakerRole,
        speakerName: judgeName,
        message: t('dialogue.judge.decision'),
      },
      {
        speaker: 'judge' as SpeakerRole,
        speakerName: judgeName,
        message: t('dialogue.judge.adjourn'),
      },
    ];
  }, [caseData, language, t]);

  const [dialogue, setDialogue] = useState<DialogueLine[]>(() => generateDialogue());

  // Regenerate dialogue when language changes
  useEffect(() => {
    setDialogue(generateDialogue());
  }, [language, generateDialogue]);

  const handleSpeakingComplete = useCallback(() => {
    if (!isPlaying) return;
    
    if (currentIndex < dialogue.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 500);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
    }
  }, [currentIndex, dialogue.length, isPlaying]);

  const handleTranscript = useCallback((text: string) => {
    handlePromptSubmit(text);
  }, []);

  const voice = useVoiceControls({
    defaultLanguage: language,
    defaultSpeechRate: speechRate,
    onTranscript: handleTranscript,
    onSpeakingComplete: handleSpeakingComplete,
  });

  // Sync voice hook with context
  useEffect(() => {
    voice.setLanguage(language);
  }, [language]);

  useEffect(() => {
    voice.setSpeechRate(speechRate);
  }, [speechRate]);

  const currentDialogue = dialogue[currentIndex] || null;
  const activeSpeaker = currentDialogue?.speaker || null;

  const characters = {
    judge: 'Hon. Justice Verma',
    prosecutor: 'Adv. Sharma',
    lawyer: 'Adv. Kapoor',
    accused: caseData.defendant.split(' ')[0],
  };

  // Speak current dialogue when it changes (if not muted and playing)
  useEffect(() => {
    if (currentDialogue && isPlaying && !isMuted) {
      const speakerType = currentDialogue.speaker === 'clerk' ? 'clerk' : currentDialogue.speaker;
      voice.speak(currentDialogue.message, speakerType as SpeakerType);
    }
  }, [currentIndex, isPlaying, isMuted]);

  const handleDialogueComplete = useCallback(() => {
    // This is now handled by onSpeakingComplete in the voice hook
    if (isMuted && isPlaying) {
      if (currentIndex < dialogue.length - 1) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 1000);
      } else {
        setIsComplete(true);
        setIsPlaying(false);
      }
    }
  }, [currentIndex, dialogue.length, isPlaying, isMuted]);

  const handlePlayPause = () => {
    if (isPlaying) {
      voice.stopSpeaking();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkip = () => {
    voice.stopSpeaking();
    if (currentIndex < dialogue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRestart = () => {
    voice.stopSpeaking();
    setCurrentIndex(0);
    setIsPlaying(true);
    setIsComplete(false);
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      voice.stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  const handleMicToggle = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      setIsPlaying(false);
      voice.stopSpeaking();
      voice.startListening();
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    setIsPlaying(false);
    voice.stopSpeaking();
    
    toast.info(language === 'hi' ? 'आपका प्रश्न संसाधित हो रहा है...' : 'Processing your question...');
    
    const caseContext = `Case: ${caseData.title}. ${caseData.summary}. Plaintiff: ${caseData.plaintiff}. Defendant: ${caseData.defendant}. Legal Issues: ${caseData.legalIssues.join(', ')}.`;
    
    const response = await voice.askAI(prompt, 'judge', caseContext);
    
    if (response) {
      // Add AI response to dialogue
      const aiDialogue: DialogueLine = {
        speaker: 'judge',
        speakerName: 'Hon. Justice Verma',
        message: response,
      };
      
      // Insert after current index
      const newDialogue = [...dialogue];
      newDialogue.splice(currentIndex + 1, 0, aiDialogue);
      setDialogue(newDialogue);
      
      // Move to AI response
      setCurrentIndex(currentIndex + 1);
      
      // Speak the response
      if (!isMuted) {
        voice.speak(response, 'judge');
      }
      
      toast.success(language === 'hi' ? 'कोर्ट ने जवाब दिया' : 'Court has responded');
    }
  };

  const progress = ((currentIndex + 1) / dialogue.length) * 100;

  return (
    <section className="min-h-screen py-4 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('court.back')}
          </Button>

          <div className="comic-panel px-4 py-2 bg-card">
            <p className="font-mono text-sm text-muted-foreground">{caseData.id}</p>
            <p className="font-bangers text-lg text-foreground">{caseData.title}</p>
          </div>

          <div className="flex items-center gap-2">
            <HearingTimer isActive={isPlaying} />
          </div>
        </div>

        {/* Case info banner */}
        <div className="comic-panel p-4 mb-4 bg-gradient-to-r from-primary/20 via-card to-secondary/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('court.plaintiff')}</p>
              <p className="font-bold text-lawyer">{caseData.plaintiff}</p>
            </div>
            <div className="text-4xl font-bangers text-primary">VS</div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('court.defendant')}</p>
              <p className="font-bold text-prosecutor">{caseData.defendant}</p>
            </div>
          </div>
        </div>

        {/* Courtroom scene */}
        <CourtroomScene
          currentDialogue={currentDialogue}
          activeSpeaker={activeSpeaker}
          characters={characters}
          onDialogueComplete={handleDialogueComplete}
          speechRate={speechRate}
          isSpeaking={voice.isSpeaking}
        />

        {/* Voice Controls */}
        <div className="mt-4 comic-panel p-4 bg-card/80">
          <VoiceControls
            language={language}
            onLanguageChange={setLanguage}
            speechRate={speechRate}
            onSpeechRateChange={setSpeechRate}
            isSpeaking={voice.isSpeaking}
            isListening={voice.isListening}
            isProcessing={voice.isProcessing}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            onMicToggle={handleMicToggle}
            onPromptSubmit={handlePromptSubmit}
            partialTranscript={voice.partialTranscript}
            isConnecting={voice.isConnecting}
          />
        </div>

        {/* Playback Controls */}
        <div className="mt-4 comic-panel p-4 bg-card">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t('court.dialogue')} {currentIndex + 1} {t('court.of')} {dialogue.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 rounded-full border-2 border-foreground bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRestart}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              variant="comic"
              size="lg"
              onClick={handlePlayPause}
              className="min-w-[150px]"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  {t('court.pause')}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {isComplete ? t('court.replay') : t('court.play')}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSkip}
              disabled={currentIndex >= dialogue.length - 1}
            >
              <FastForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Completion message */}
          {isComplete && (
            <div className="mt-6 text-center fade-in-up">
              <div className="inline-block px-8 py-4 bg-primary rounded-xl border-4 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))]">
                <p className="font-bangers text-2xl text-primary-foreground">
                  {t('court.adjourned')}
                </p>
                <p className="text-sm text-primary-foreground/80 mt-2">
                  {t('court.concluded')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
