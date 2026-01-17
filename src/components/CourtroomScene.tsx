import React from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { SpeechBubble, SpeakerRole } from './SpeechBubble';
import { cn } from '@/lib/utils';

interface DialogueLine {
  speaker: SpeakerRole;
  speakerName: string;
  message: string;
}

interface CourtroomSceneProps {
  currentDialogue: DialogueLine | null;
  activeSpeaker: SpeakerRole | null;
  characters: {
    judge: string;
    prosecutor: string;
    lawyer: string;
    accused: string;
  };
  onDialogueComplete?: () => void;
  speechRate?: number;
  isSpeaking?: boolean;
}

export const CourtroomScene: React.FC<CourtroomSceneProps> = ({
  currentDialogue,
  activeSpeaker,
  characters,
  onDialogueComplete,
}) => {
  const getSpeakerPosition = (speaker: SpeakerRole): 'left' | 'right' | 'center' => {
    switch (speaker) {
      case 'judge':
        return 'center';
      case 'prosecutor':
        return 'left';
      case 'lawyer':
      case 'accused':
        return 'right';
      default:
        return 'center';
    }
  };

  return (
    <div className="relative w-full min-h-[600px] comic-panel bg-gradient-to-b from-card to-muted overflow-hidden">
      {/* Courtroom background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Wooden paneling pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-900/30 to-transparent" />
        
        {/* Decorative pillars */}
        <div className="absolute left-4 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-800/20 to-transparent" />
        <div className="absolute right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-amber-800/20 to-transparent" />
        
        {/* Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-8 py-2 bg-primary/90 border-4 border-foreground rounded-lg shadow-[4px_4px_0_hsl(var(--foreground))]">
          <p className="font-bangers text-xl md:text-2xl text-primary-foreground tracking-wider">
            ⚖️ E-COURT OF JUSTICE ⚖️
          </p>
        </div>
      </div>

      {/* Judge's bench area */}
      <div className="relative pt-20 pb-8">
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Elevated platform */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-4 bg-amber-700 rounded-t-lg border-4 border-b-0 border-foreground" />
            <CharacterAvatar
              role="judge"
              name={characters.judge}
              isActive={activeSpeaker === 'judge'}
              isSpeaking={activeSpeaker === 'judge'}
            />
          </div>
        </div>

        {/* Gavel animation */}
        {activeSpeaker === 'judge' && (
          <div className="absolute top-24 right-1/4 text-4xl gavel-animation">
            🔨
          </div>
        )}
      </div>

      {/* Main floor - Prosecutor and Defense */}
      <div className="relative px-8 py-4">
        <div className="flex justify-between items-start max-w-4xl mx-auto">
          {/* Prosecutor side */}
          <div className="flex flex-col items-center gap-4">
            <CharacterAvatar
              role="prosecutor"
              name={characters.prosecutor}
              isActive={activeSpeaker === 'prosecutor'}
              isSpeaking={activeSpeaker === 'prosecutor'}
            />
            {/* Desk */}
            <div className="w-32 h-8 bg-amber-800 rounded-t-lg border-4 border-b-0 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))]">
              <div className="flex justify-center gap-1 pt-1">
                <span className="text-xs">📁</span>
                <span className="text-xs">📄</span>
              </div>
            </div>
          </div>

          {/* Defense side */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <CharacterAvatar
                role="lawyer"
                name={characters.lawyer}
                isActive={activeSpeaker === 'lawyer'}
                isSpeaking={activeSpeaker === 'lawyer'}
              />
              <CharacterAvatar
                role="accused"
                name={characters.accused}
                isActive={activeSpeaker === 'accused'}
                isSpeaking={activeSpeaker === 'accused'}
              />
            </div>
            {/* Defense desk */}
            <div className="w-48 h-8 bg-amber-800 rounded-t-lg border-4 border-b-0 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))]">
              <div className="flex justify-center gap-1 pt-1">
                <span className="text-xs">📋</span>
                <span className="text-xs">⚖️</span>
                <span className="text-xs">📝</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speech bubble area */}
      <div className="relative px-8 py-8 min-h-[180px]">
        {currentDialogue && (
          <SpeechBubble
            speaker={currentDialogue.speaker}
            speakerName={currentDialogue.speakerName}
            message={currentDialogue.message}
            position={getSpeakerPosition(currentDialogue.speaker)}
            isActive={true}
            onComplete={onDialogueComplete}
          />
        )}
      </div>

      {/* Floor pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40" />
    </div>
  );
};
