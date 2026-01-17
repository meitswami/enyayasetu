import React, { useEffect, useRef } from 'react';
import { CharacterAvatar } from '../CharacterAvatar';
import { ComicSpeechBubble } from './ComicSpeechBubble';
import { ReactionOverlay } from './ReactionOverlay';
import { WitnessStand } from './WitnessStand';
import { CourtTranscript, ParticipantRole } from './types';
import { ParticipantReaction, ReactionType } from './hooks/useParticipantReactions';
import { cn } from '@/lib/utils';

interface ComicCourtroomSceneProps {
  currentTranscript: CourtTranscript | null;
  isSpeaking: boolean;
  characters: {
    judge: string;
    prosecutor: string;
    defence: string;
    accused: string;
  };
  onTypingComplete?: () => void;
  onJudgeSpeaks?: () => void;
  onObjection?: () => void;
  onEvidence?: () => void;
  onWitness?: () => void;
  reactions?: ParticipantReaction[];
  getReactionFor?: (participantId: string) => ReactionType;
  activeWitness?: { name: string; isActive: boolean } | null;
}

const roleToSpeaker = (role: string): 'judge' | 'prosecutor' | 'lawyer' | 'accused' => {
  switch (role) {
    case 'judge':
      return 'judge';
    case 'prosecutor':
    case 'public_prosecutor':
      return 'prosecutor';
    case 'defence_lawyer':
    case 'lawyer':
      return 'lawyer';
    case 'accused':
      return 'accused';
    default:
      return 'lawyer';
  }
};

const getSpeakerPosition = (role: string): 'left' | 'right' | 'center' => {
  switch (role) {
    case 'judge':
      return 'center';
    case 'prosecutor':
    case 'public_prosecutor':
      return 'left';
    case 'defence_lawyer':
    case 'lawyer':
    case 'accused':
    case 'victim':
      return 'right';
    default:
      return 'center';
  }
};

export const ComicCourtroomScene: React.FC<ComicCourtroomSceneProps> = ({
  currentTranscript,
  isSpeaking,
  characters,
  onTypingComplete,
  onJudgeSpeaks,
  onObjection,
  onEvidence,
  onWitness,
  reactions = [],
  getReactionFor,
  activeWitness,
}) => {
  const activeSpeaker = currentTranscript ? roleToSpeaker(currentTranscript.speaker_role) : null;
  const prevSpeakerRef = useRef<string | null>(null);

  // Trigger gavel sound when judge starts speaking
  useEffect(() => {
    if (activeSpeaker === 'judge' && prevSpeakerRef.current !== 'judge' && onJudgeSpeaks) {
      onJudgeSpeaks();
    }
    prevSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker, onJudgeSpeaks]);

  // Check for objection in transcript
  useEffect(() => {
    if (currentTranscript?.message?.toLowerCase().includes('objection') && onObjection) {
      onObjection();
    }
  }, [currentTranscript, onObjection]);

  // Check for evidence mentions
  useEffect(() => {
    if (currentTranscript?.message?.toLowerCase().includes('exhibit') || 
        currentTranscript?.message?.toLowerCase().includes('evidence')) {
      onEvidence?.();
    }
  }, [currentTranscript, onEvidence]);

  // Get reactions for specific roles (mock participant IDs based on role)
  const getReaction = (role: string): ReactionType => {
    if (!getReactionFor) return null;
    // Find reaction matching this role
    const reaction = reactions.find(r => r.role === role);
    return reaction?.reaction || null;
  };

  return (
    <div className="relative w-full min-h-[500px] comic-panel bg-gradient-to-b from-card to-muted overflow-hidden">
      {/* Courtroom background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Wooden paneling pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-amber-900/30 to-transparent" />
        
        {/* Decorative pillars */}
        <div className="absolute left-4 top-0 bottom-0 w-6 bg-gradient-to-r from-amber-800/20 to-transparent" />
        <div className="absolute right-4 top-0 bottom-0 w-6 bg-gradient-to-l from-amber-800/20 to-transparent" />
        
        {/* Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary/90 border-4 border-foreground rounded-lg shadow-[4px_4px_0_hsl(var(--foreground))]">
          <p className="font-bangers text-lg md:text-xl text-primary-foreground tracking-wider">
            ⚖️ E-COURT OF JUSTICE ⚖️
          </p>
        </div>
      </div>

      {/* Judge's bench area */}
      <div className="relative pt-16 pb-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Elevated platform */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-3 bg-amber-700 rounded-t-lg border-4 border-b-0 border-foreground" />
            <CharacterAvatar
              role="judge"
              name={characters.judge}
              isActive={activeSpeaker === 'judge'}
              isSpeaking={activeSpeaker === 'judge' && isSpeaking}
              reaction={getReaction('judge')}
            />
          </div>
        </div>

        {/* Gavel animation */}
        {activeSpeaker === 'judge' && (
          <div className="absolute top-20 right-1/4 text-3xl gavel-animation">
            🔨
          </div>
        )}
      </div>

      {/* Main floor - Prosecutor and Defense */}
      <div className="relative px-6 py-2">
        <div className="flex justify-between items-start max-w-3xl mx-auto">
          {/* Prosecutor side */}
          <div className="flex flex-col items-center gap-3">
            <CharacterAvatar
              role="prosecutor"
              name={characters.prosecutor}
              isActive={activeSpeaker === 'prosecutor'}
              isSpeaking={activeSpeaker === 'prosecutor' && isSpeaking}
              reaction={getReaction('prosecutor') || getReaction('public_prosecutor')}
            />
            {/* Desk */}
            <div className="w-28 h-6 bg-amber-800 rounded-t-lg border-4 border-b-0 border-foreground shadow-[3px_3px_0_hsl(var(--foreground))]">
              <div className="flex justify-center gap-1 pt-0.5">
                <span className="text-[10px]">📁</span>
                <span className="text-[10px]">📄</span>
              </div>
            </div>
          </div>

          {/* Defense side */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3">
              <CharacterAvatar
                role="lawyer"
                name={characters.defence}
                isActive={activeSpeaker === 'lawyer'}
                isSpeaking={activeSpeaker === 'lawyer' && isSpeaking}
                reaction={getReaction('defence_lawyer')}
              />
              <CharacterAvatar
                role="accused"
                name={characters.accused}
                isActive={activeSpeaker === 'accused'}
                isSpeaking={activeSpeaker === 'accused' && isSpeaking}
                reaction={getReaction('accused')}
              />
            </div>
            {/* Defense desk */}
            <div className="w-40 h-6 bg-amber-800 rounded-t-lg border-4 border-b-0 border-foreground shadow-[3px_3px_0_hsl(var(--foreground))]">
              <div className="flex justify-center gap-1 pt-0.5">
                <span className="text-[10px]">📋</span>
                <span className="text-[10px]">⚖️</span>
                <span className="text-[10px]">📝</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speech bubble area */}
      <div className="relative px-4 py-6 min-h-[150px]">
        {currentTranscript && (
          <ComicSpeechBubble
            speaker={currentTranscript.speaker_role}
            speakerName={currentTranscript.speaker_name}
            message={currentTranscript.message}
            position={getSpeakerPosition(currentTranscript.speaker_role)}
            isActive={true}
            typingSpeed={25}
            onComplete={onTypingComplete}
          />
        )}
      </div>

      {/* Reactions overlay */}
      <ReactionOverlay reactions={reactions} />

      {/* Witness Stand overlay */}
      {activeWitness && (
        <WitnessStand
          witnessName={activeWitness.name}
          isActive={activeWitness.isActive}
          onEnterComplete={onWitness}
        />
      )}

      {/* Floor pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-900/40" />
    </div>
  );
};
