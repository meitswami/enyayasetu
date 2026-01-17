import React from 'react';
import { Button } from '@/components/ui/button';
import { ReactionType } from './hooks/useParticipantReactions';
import { cn } from '@/lib/utils';

interface ReactionButtonsProps {
  onReaction: (reaction: ReactionType) => void;
  disabled?: boolean;
  className?: string;
}

const reactions: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'agree', emoji: '👍', label: 'Agree' },
  { type: 'disagree', emoji: '👎', label: 'Disagree' },
  { type: 'shocked', emoji: '😲', label: 'Shocked' },
  { type: 'thinking', emoji: '🤔', label: 'Thinking' },
  { type: 'objection', emoji: '✋', label: 'Objection!' },
];

export const ReactionButtons: React.FC<ReactionButtonsProps> = ({
  onReaction,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap gap-2 justify-center', className)}>
      {reactions.map(({ type, emoji, label }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          onClick={() => onReaction(type)}
          disabled={disabled}
          className="flex items-center gap-1 text-lg hover:scale-110 transition-transform border-2 border-foreground shadow-[2px_2px_0_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title={label}
        >
          <span>{emoji}</span>
          <span className="text-xs hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
};
