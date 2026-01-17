import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type SpeakerRole = 'judge' | 'prosecutor' | 'defence_lawyer' | 'accused' | 'victim' | 'witness' | 'clerk';

interface ComicSpeechBubbleProps {
  speaker: SpeakerRole | string;
  speakerName: string;
  message: string;
  position?: 'left' | 'right' | 'center';
  isActive?: boolean;
  typingSpeed?: number;
  onComplete?: () => void;
}

const speakerColors: Record<string, { bg: string; border: string; label: string }> = {
  judge: { 
    bg: 'bg-amber-500/20', 
    border: 'border-amber-500', 
    label: '⚖️ Judge' 
  },
  prosecutor: { 
    bg: 'bg-red-500/20', 
    border: 'border-red-500', 
    label: '🔴 Prosecutor' 
  },
  public_prosecutor: { 
    bg: 'bg-red-500/20', 
    border: 'border-red-500', 
    label: '🔴 Public Prosecutor' 
  },
  defence_lawyer: { 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-500', 
    label: '🔵 Defence' 
  },
  accused: { 
    bg: 'bg-purple-500/20', 
    border: 'border-purple-500', 
    label: '👤 Accused' 
  },
  victim: { 
    bg: 'bg-orange-500/20', 
    border: 'border-orange-500', 
    label: '🟠 Victim' 
  },
  witness: { 
    bg: 'bg-green-500/20', 
    border: 'border-green-500', 
    label: '🟢 Witness' 
  },
  clerk: { 
    bg: 'bg-gray-500/20', 
    border: 'border-gray-500', 
    label: '📋 Clerk' 
  },
};

export const ComicSpeechBubble: React.FC<ComicSpeechBubbleProps> = ({
  speaker,
  speakerName,
  message,
  position = 'center',
  isActive = false,
  typingSpeed = 30,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const animationRef = useRef<number | null>(null);
  const charIndexRef = useRef(0);

  const speakerConfig = speakerColors[speaker] || speakerColors.clerk;

  useEffect(() => {
    if (!isActive || !message) {
      setDisplayedText('');
      charIndexRef.current = 0;
      return;
    }

    setIsTyping(true);
    charIndexRef.current = 0;
    setDisplayedText('');

    const typeNextChar = () => {
      if (charIndexRef.current < message.length) {
        setDisplayedText(message.slice(0, charIndexRef.current + 1));
        charIndexRef.current++;
        animationRef.current = window.setTimeout(typeNextChar, typingSpeed);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    animationRef.current = window.setTimeout(typeNextChar, typingSpeed);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [message, isActive, typingSpeed, onComplete]);

  const positionClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
  };

  const tailPosition = {
    left: 'left-8 -bottom-3 border-l-0 border-t-0 rotate-45',
    right: 'right-8 -bottom-3 border-r-0 border-t-0 -rotate-45',
    center: 'left-1/2 -translate-x-1/2 -bottom-3 rotate-45',
  };

  return (
    <div className={cn('flex w-full px-4 animate-fade-in', positionClasses[position])}>
      <div className="relative max-w-[80%]">
        {/* Speaker Label */}
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1 rounded-t-lg text-sm font-bold',
          speakerConfig.bg,
          speakerConfig.border,
          'border-2 border-b-0'
        )}>
          {speakerConfig.label}
          <span className="text-muted-foreground font-normal">— {speakerName}</span>
        </div>

        {/* Speech Bubble */}
        <div className={cn(
          'relative p-4 rounded-xl rounded-tl-none border-4 shadow-[4px_4px_0_hsl(var(--foreground))]',
          speakerConfig.bg,
          speakerConfig.border,
          isActive && 'animate-bubbleAppear'
        )}>
          {/* Message with typewriter effect */}
          <p className="text-foreground text-lg leading-relaxed min-h-[1.5em]">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-2 h-5 ml-1 bg-foreground animate-pulse" />
            )}
          </p>

          {/* Speech bubble tail */}
          <div className={cn(
            'absolute w-5 h-5 border-4',
            speakerConfig.bg,
            speakerConfig.border,
            'bg-inherit',
            tailPosition[position]
          )} />
        </div>
      </div>
    </div>
  );
};
