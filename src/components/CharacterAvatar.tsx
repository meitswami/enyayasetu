import React from 'react';
import { cn } from '@/lib/utils';
import { SpeakerRole } from './SpeechBubble';

type ReactionType = 'agree' | 'disagree' | 'shocked' | 'thinking' | 'objection' | null;

interface CharacterAvatarProps {
  role: SpeakerRole;
  name: string;
  isActive?: boolean;
  isSpeaking?: boolean;
  reaction?: ReactionType;
  size?: 'sm' | 'md' | 'lg';
}

const roleStyles: Record<SpeakerRole, { bg: string; icon: string; label: string }> = {
  judge: {
    bg: 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-700',
    icon: '⚖️',
    label: 'HONORABLE JUDGE',
  },
  prosecutor: {
    bg: 'bg-gradient-to-b from-red-400 to-red-600 border-red-700',
    icon: '⚔️',
    label: 'PUBLIC PROSECUTOR',
  },
  lawyer: {
    bg: 'bg-gradient-to-b from-green-400 to-green-600 border-green-700',
    icon: '📜',
    label: 'DEFENSE COUNSEL',
  },
  accused: {
    bg: 'bg-gradient-to-b from-blue-400 to-blue-600 border-blue-700',
    icon: '👤',
    label: 'ACCUSED',
  },
  clerk: {
    bg: 'bg-gradient-to-b from-gray-400 to-gray-600 border-gray-700',
    icon: '📋',
    label: 'COURT CLERK',
  },
  witness: {
    bg: 'bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-700',
    icon: '👁️',
    label: 'WITNESS',
  },
};

const reactionEmojis: Record<NonNullable<ReactionType>, string> = {
  agree: '👍',
  disagree: '👎',
  shocked: '😲',
  thinking: '🤔',
  objection: '✋',
};

const sizeClasses = {
  sm: 'w-14 h-14 md:w-16 md:h-16',
  md: 'w-20 h-20 md:w-24 md:h-24',
  lg: 'w-28 h-28 md:w-32 md:h-32',
};

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  role,
  name,
  isActive = false,
  size = 'md',
  isSpeaking = false,
  reaction,
}) => {
  const { bg, icon, label } = roleStyles[role];

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 transition-all duration-300',
        isActive ? 'scale-110 z-10' : 'scale-100 opacity-70',
        isSpeaking && 'character-idle'
      )}
    >
      {/* Avatar circle */}
      <div
        className={cn(
          'relative rounded-full border-4 flex items-center justify-center',
          sizeClasses[size],
          size === 'sm' && 'text-2xl',
          size === 'md' && 'text-4xl',
          size === 'lg' && 'text-5xl',
          bg,
          'shadow-[4px_4px_0_hsl(var(--foreground))]',
          isSpeaking && 'pulse-glow'
        )}
      >
        <span className="text-3xl md:text-4xl">{icon}</span>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full border-2 border-foreground flex items-center justify-center">
            <span className="text-xs">🎤</span>
          </div>
        )}

        {/* Reaction bubble */}
        {reaction && (
          <div className="absolute -top-3 -left-3 w-8 h-8 bg-card rounded-full border-2 border-foreground flex items-center justify-center animate-bounce shadow-lg">
            <span className="text-lg">{reactionEmojis[reaction]}</span>
          </div>
        )}
      </div>

      {/* Name plate */}
      <div
        className={cn(
          'px-3 py-1 rounded-lg border-2 border-foreground text-center',
          'bg-card shadow-[2px_2px_0_hsl(var(--foreground))]'
        )}
      >
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground truncate max-w-[100px]">
          {name}
        </p>
      </div>
    </div>
  );
};
