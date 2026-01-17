import React from 'react';
import { ParticipantReaction, ReactionType } from './hooks/useParticipantReactions';
import { cn } from '@/lib/utils';

interface ReactionOverlayProps {
  reactions: ParticipantReaction[];
  className?: string;
}

const reactionEmojis: Record<NonNullable<ReactionType>, string> = {
  agree: '👍',
  disagree: '👎',
  shocked: '😲',
  thinking: '🤔',
  objection: '✋',
};

export const ReactionOverlay: React.FC<ReactionOverlayProps> = ({
  reactions,
  className,
}) => {
  const activeReactions = reactions.filter(r => r.reaction !== null);

  if (activeReactions.length === 0) return null;

  return (
    <div className={cn('absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center pointer-events-none', className)}>
      {activeReactions.map((reaction) => (
        <div
          key={reaction.participantId}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 border-2 border-foreground shadow-lg animate-scale-in"
        >
          <span className="text-xl animate-bounce">
            {reaction.reaction && reactionEmojis[reaction.reaction]}
          </span>
          <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
            {reaction.participantName}
          </span>
        </div>
      ))}
    </div>
  );
};
