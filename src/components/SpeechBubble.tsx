import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export type SpeakerRole = 'judge' | 'prosecutor' | 'lawyer' | 'accused' | 'clerk' | 'witness';

interface SpeechBubbleProps {
  speaker: SpeakerRole;
  speakerName: string;
  message: string;
  position?: 'left' | 'right' | 'center';
  isActive?: boolean;
  onComplete?: () => void;
  autoPlay?: boolean;
  speechRate?: number;
  isSpeaking?: boolean;
}

const speakerColors: Record<SpeakerRole, string> = {
  judge: 'border-judge bg-gradient-to-br from-amber-50 to-amber-100',
  prosecutor: 'border-prosecutor bg-gradient-to-br from-red-50 to-red-100',
  lawyer: 'border-lawyer bg-gradient-to-br from-green-50 to-green-100',
  accused: 'border-accused bg-gradient-to-br from-blue-50 to-blue-100',
  clerk: 'border-muted-foreground bg-gradient-to-br from-gray-50 to-gray-100',
  witness: 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100',
};

const speakerLabels: Record<SpeakerRole, string> = {
  judge: '⚖️ JUDGE',
  prosecutor: '🔴 PROSECUTOR',
  lawyer: '🟢 DEFENSE',
  accused: '🔵 ACCUSED',
  clerk: '📋 CLERK',
  witness: '👁️ WITNESS',
};

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  speaker,
  speakerName,
  message,
  position = 'left',
  isActive = true,
  onComplete,
  autoPlay = false,
  speechRate = 1.0,
  isSpeaking = false,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasCompletedRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    hasCompletedRef.current = false;
    setIsTyping(true);
    setDisplayedText('');
    
    // Calculate typing speed based on message length and speech rate
    // We want typing to complete roughly when speaking completes
    // Average speaking rate is ~150 words/min = 2.5 words/sec at rate 1.0
    const words = message.split(/\s+/).length;
    const baseWPS = 2.5;
    const actualWPS = baseWPS * speechRate;
    const estimatedDuration = (words / actualWPS) * 1000; // in ms
    
    // Calculate characters per interval to finish typing in sync with speech
    const totalChars = message.length;
    const intervalMs = 20; // Update every 20ms for smooth animation
    const charsPerInterval = Math.max(1, Math.ceil(totalChars / (estimatedDuration / intervalMs)));
    
    let currentIndex = 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / estimatedDuration, 1);
      const targetIndex = Math.floor(progress * totalChars);
      
      if (targetIndex > currentIndex) {
        currentIndex = targetIndex;
        setDisplayedText(message.slice(0, currentIndex));
      }

      if (currentIndex < totalChars) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedText(message);
        setIsTyping(false);
        if (!hasCompletedRef.current && onComplete) {
          hasCompletedRef.current = true;
          setTimeout(onComplete, 500);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [message, isActive, speechRate, onComplete]);

  const bubblePosition = {
    left: 'mr-auto',
    right: 'ml-auto',
    center: 'mx-auto',
  };

  const tailPosition = {
    left: 'left-8',
    right: 'right-8 left-auto',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'max-w-2xl bubble-appear',
        bubblePosition[position]
      )}
    >
      {/* Speaker label */}
      <div className={cn(
        'inline-block px-3 py-1 mb-2 rounded-full text-xs font-bold tracking-wider',
        speaker === 'judge' && 'bg-judge text-primary-foreground',
        speaker === 'prosecutor' && 'bg-prosecutor text-secondary-foreground',
        speaker === 'lawyer' && 'bg-lawyer text-secondary-foreground',
        speaker === 'accused' && 'bg-accused text-secondary-foreground',
        speaker === 'clerk' && 'bg-muted text-muted-foreground',
      )}>
        {speakerLabels[speaker]} - {speakerName}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'relative px-6 py-4 rounded-2xl border-4 font-comic text-lg leading-relaxed',
          speakerColors[speaker],
          'shadow-[4px_4px_0_hsl(var(--foreground))]'
        )}
        style={{ color: 'hsl(var(--bubble-text))' }}
      >
        {displayedText}
        {isTyping && (
          <span className="inline-block w-2 h-5 ml-1 bg-foreground animate-pulse" />
        )}
        {isSpeaking && !isTyping && (
          <span className="inline-flex items-center ml-2 gap-0.5">
            <span className="w-1 h-3 bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
          </span>
        )}

        {/* Tail */}
        <div
          className={cn(
            'absolute bottom-0 translate-y-full',
            tailPosition[position]
          )}
        >
          <div className="relative">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '20px solid hsl(var(--foreground))',
              }}
            />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{
                borderLeft: '11px solid transparent',
                borderRight: '11px solid transparent',
                borderTop: speaker === 'judge' ? '16px solid #fef3c7' :
                          speaker === 'prosecutor' ? '16px solid #fee2e2' :
                          speaker === 'lawyer' ? '16px solid #dcfce7' :
                          speaker === 'accused' ? '16px solid #dbeafe' :
                          '16px solid #f3f4f6',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
