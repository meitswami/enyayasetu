import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ObjectionOverlayProps {
  show: boolean;
  speaker?: string;
  onComplete?: () => void;
}

const ObjectionOverlay: React.FC<ObjectionOverlayProps> = ({
  show,
  speaker,
  onComplete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !isAnimating) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 pointer-events-none flex items-center justify-center",
        "bg-black/30 backdrop-blur-sm",
        isAnimating ? "animate-objection-bg-in" : "animate-objection-bg-out"
      )}
    >
      {/* Comic-style burst background */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        isAnimating ? "animate-burst-in" : "animate-burst-out"
      )}>
        <svg
          viewBox="0 0 400 300"
          className="w-[80vw] h-[60vh] max-w-[800px] max-h-[600px]"
        >
          <defs>
            <radialGradient id="burstGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(0, 90%, 60%)" />
              <stop offset="100%" stopColor="hsl(0, 80%, 45%)" />
            </radialGradient>
          </defs>
          {/* Starburst rays */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const x1 = 200 + Math.cos((angle * Math.PI) / 180) * 30;
            const y1 = 150 + Math.sin((angle * Math.PI) / 180) * 30;
            const x2 = 200 + Math.cos((angle * Math.PI) / 180) * 200;
            const y2 = 150 + Math.sin((angle * Math.PI) / 180) * 150;
            return (
              <polygon
                key={i}
                points={`200,150 ${x2 - 20},${y2 + 10} ${x2 + 20},${y2 - 10}`}
                fill={i % 2 === 0 ? 'hsl(45, 100%, 60%)' : 'hsl(0, 90%, 55%)'}
                className="animate-ray-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            );
          })}
        </svg>
      </div>

      {/* OBJECTION text */}
      <div className={cn(
        "relative flex flex-col items-center",
        isAnimating ? "animate-objection-text-in" : "animate-objection-text-out"
      )}>
        <h1
          className={cn(
            "text-6xl sm:text-8xl md:text-9xl font-black tracking-wider",
            "text-white drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]",
            "comic-text-stroke animate-objection-shake"
          )}
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            WebkitTextStroke: '4px hsl(0, 0%, 10%)',
            paintOrder: 'stroke fill',
          }}
        >
          OBJECTION!
        </h1>
        
        {/* Speaker name */}
        {speaker && (
          <div className={cn(
            "mt-4 px-6 py-2 bg-background/90 rounded-full",
            "border-2 border-primary shadow-lg",
            "animate-fade-in"
          )}
          style={{ animationDelay: '300ms' }}
          >
            <span className="text-lg font-bold text-foreground">
              — {speaker}
            </span>
          </div>
        )}

        {/* Comic speed lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/40 animate-speed-line"
              style={{
                width: '2px',
                height: `${50 + Math.random() * 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${-30 + Math.random() * 60}deg)`,
                animationDelay: `${Math.random() * 500}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ObjectionOverlay;
