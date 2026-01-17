import React, { useEffect, useState } from 'react';
import { CharacterAvatar } from '../CharacterAvatar';
import { SpeakerRole } from '../SpeechBubble';
import { cn } from '@/lib/utils';

interface WitnessStandProps {
  witnessName: string;
  isActive: boolean;
  onEnterComplete?: () => void;
  onExitComplete?: () => void;
}

export const WitnessStand: React.FC<WitnessStandProps> = ({
  witnessName,
  isActive,
  onEnterComplete,
  onExitComplete,
}) => {
  const [animationPhase, setAnimationPhase] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden');

  useEffect(() => {
    if (isActive && animationPhase === 'hidden') {
      setAnimationPhase('entering');
      const timer = setTimeout(() => {
        setAnimationPhase('visible');
        onEnterComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    } else if (!isActive && (animationPhase === 'visible' || animationPhase === 'entering')) {
      setAnimationPhase('exiting');
      const timer = setTimeout(() => {
        setAnimationPhase('hidden');
        onExitComplete?.();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isActive, animationPhase, onEnterComplete, onExitComplete]);

  if (animationPhase === 'hidden') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {/* Spotlight effect */}
      <div 
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-64 transition-all duration-700",
          animationPhase === 'entering' && "animate-spotlight-enter",
          animationPhase === 'visible' && "opacity-100",
          animationPhase === 'exiting' && "animate-spotlight-exit"
        )}
        style={{
          height: '120%',
          background: `
            radial-gradient(ellipse at center top, 
              rgba(255, 215, 0, 0.3) 0%, 
              rgba(255, 215, 0, 0.15) 30%, 
              transparent 70%
            )
          `,
        }}
      />

      {/* Witness stand container */}
      <div 
        className={cn(
          "absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-500",
          animationPhase === 'entering' && "animate-witness-enter",
          animationPhase === 'visible' && "opacity-100 translate-y-0",
          animationPhase === 'exiting' && "animate-witness-exit"
        )}
      >
        {/* "WITNESS" label */}
        <div className={cn(
          "mb-2 px-4 py-1 bg-yellow-500 border-4 border-foreground rounded-lg shadow-[3px_3px_0_hsl(var(--foreground))] transition-transform duration-300",
          animationPhase === 'visible' && "animate-pulse-subtle"
        )}>
          <span className="font-bangers text-lg text-foreground tracking-wide">
            👁️ WITNESS STAND 👁️
          </span>
        </div>

        {/* Witness avatar with glow */}
        <div className="relative">
          {/* Glow ring */}
          <div 
            className={cn(
              "absolute inset-0 -m-3 rounded-full transition-all duration-500",
              animationPhase === 'visible' && "animate-glow-pulse"
            )}
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
          
          <CharacterAvatar
            role="witness"
            name={witnessName}
            isActive={true}
            isSpeaking={false}
            size="lg"
          />
        </div>

        {/* Stand base */}
        <div className="mt-2 w-36 h-8 bg-amber-700 rounded-t-lg border-4 border-b-0 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] relative overflow-hidden">
          {/* Wood grain effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute h-0.5 bg-amber-900/50 w-full top-2" />
            <div className="absolute h-0.5 bg-amber-900/50 w-full top-5" />
          </div>
          <div className="flex justify-center gap-2 pt-1.5">
            <span className="text-sm">📖</span>
            <span className="text-xs text-amber-200 font-bold">OATH</span>
            <span className="text-sm">✋</span>
          </div>
        </div>
      </div>

      {/* Dramatic vignette */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-700",
          animationPhase === 'entering' && "opacity-0",
          animationPhase === 'visible' && "opacity-100",
          animationPhase === 'exiting' && "opacity-0"
        )}
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </div>
  );
};
