import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VerdictOverlayProps {
  show: boolean;
  verdict: 'guilty' | 'not_guilty' | 'dismissed' | null;
  onComplete?: () => void;
}

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => (
  <div
    className="absolute animate-confetti-fall"
    style={{
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}ms`,
      width: `${8 + Math.random() * 8}px`,
      height: `${8 + Math.random() * 8}px`,
      backgroundColor: color,
      transform: `rotate(${Math.random() * 360}deg)`,
    }}
  />
);

const VerdictOverlay: React.FC<VerdictOverlayProps> = ({
  show,
  verdict,
  onComplete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; color: string }>>([]);

  const generateParticles = useCallback(() => {
    const colors = verdict === 'not_guilty' || verdict === 'dismissed'
      ? ['hsl(142, 76%, 36%)', 'hsl(43, 96%, 56%)', 'hsl(48, 96%, 89%)', 'hsl(199, 89%, 48%)']
      : ['hsl(0, 0%, 30%)', 'hsl(0, 0%, 50%)', 'hsl(0, 72%, 51%)'];
    
    return Array.from({ length: verdict === 'guilty' ? 20 : 60 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1500,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [verdict]);

  useEffect(() => {
    if (show && verdict) {
      setIsAnimating(true);
      setParticles(generateParticles());
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, verdict, onComplete, generateParticles]);

  if (!show && !isAnimating) return null;

  const getVerdictConfig = () => {
    switch (verdict) {
      case 'guilty':
        return {
          text: 'GUILTY',
          subtext: 'The defendant is found guilty',
          bgClass: 'bg-gradient-to-b from-black/80 to-destructive/40',
          textClass: 'text-destructive',
          glowColor: 'rgba(220, 38, 38, 0.6)',
        };
      case 'not_guilty':
        return {
          text: 'NOT GUILTY',
          subtext: 'The defendant is acquitted',
          bgClass: 'bg-gradient-to-b from-black/60 to-green-900/40',
          textClass: 'text-green-400',
          glowColor: 'rgba(34, 197, 94, 0.6)',
        };
      case 'dismissed':
        return {
          text: 'CASE DISMISSED',
          subtext: 'The case has been dismissed',
          bgClass: 'bg-gradient-to-b from-black/60 to-primary/40',
          textClass: 'text-primary',
          glowColor: 'rgba(234, 179, 8, 0.6)',
        };
      default:
        return null;
    }
  };

  const config = getVerdictConfig();
  if (!config) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 pointer-events-none flex items-center justify-center",
        config.bgClass,
        "backdrop-blur-md",
        isAnimating ? "animate-verdict-bg-in" : "animate-verdict-bg-out"
      )}
    >
      {/* Confetti/Rain particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
        ))}
      </div>

      {/* Radial glow */}
      <div 
        className={cn(
          "absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-50",
          isAnimating ? "animate-glow-expand" : ""
        )}
        style={{ backgroundColor: config.glowColor }}
      />

      {/* Main content */}
      <div className={cn(
        "relative flex flex-col items-center text-center",
        isAnimating ? "animate-verdict-text-in" : "animate-verdict-text-out"
      )}>
        {/* Gavel icon animation */}
        <div className={cn(
          "mb-6 text-8xl",
          isAnimating ? "animate-gavel-slam" : ""
        )}>
          ⚖️
        </div>

        {/* Verdict text */}
        <h1
          className={cn(
            "text-5xl sm:text-7xl md:text-8xl font-black tracking-wider",
            config.textClass,
            "drop-shadow-2xl",
            isAnimating ? "animate-verdict-shake" : ""
          )}
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textShadow: `0 0 40px ${config.glowColor}, 0 0 80px ${config.glowColor}`,
          }}
        >
          {config.text}
        </h1>

        {/* Subtext */}
        <p 
          className={cn(
            "mt-6 text-xl sm:text-2xl text-foreground/90 font-bold",
            "animate-fade-in"
          )}
          style={{ animationDelay: '500ms' }}
        >
          {config.subtext}
        </p>

        {/* Decorative line */}
        <div 
          className={cn(
            "mt-8 h-1 bg-gradient-to-r from-transparent via-current to-transparent",
            config.textClass,
            "animate-line-expand"
          )}
          style={{ animationDelay: '700ms' }}
        />
      </div>
    </div>
  );
};

export default VerdictOverlay;
