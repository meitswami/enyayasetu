import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type RulingType = 'sustained' | 'overruled';

interface JudgeRulingOverlayProps {
  show: boolean;
  ruling: RulingType | null;
  onComplete?: () => void;
}

const JudgeRulingOverlay: React.FC<JudgeRulingOverlayProps> = ({
  show,
  ruling,
  onComplete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show && ruling) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, ruling, onComplete]);

  if (!show && !isAnimating) return null;

  const config = ruling === 'sustained'
    ? {
        text: 'SUSTAINED!',
        bgColor: 'from-green-900/80 to-green-700/60',
        textColor: 'text-green-400',
        borderColor: 'border-green-500',
        glowColor: 'rgba(34, 197, 94, 0.5)',
        icon: '✓',
      }
    : {
        text: 'OVERRULED!',
        bgColor: 'from-red-900/80 to-red-700/60',
        textColor: 'text-red-400',
        borderColor: 'border-red-500',
        glowColor: 'rgba(239, 68, 68, 0.5)',
        icon: '✗',
      };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 pointer-events-none flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm",
        isAnimating ? "animate-ruling-bg-in" : "animate-ruling-bg-out"
      )}
    >
      {/* Starburst background */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        isAnimating ? "animate-ruling-burst-in" : "animate-ruling-burst-out"
      )}>
        <svg
          viewBox="0 0 400 200"
          className="w-[70vw] h-[40vh] max-w-[700px] max-h-[400px]"
        >
          {/* Angular burst rays */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            return (
              <polygon
                key={i}
                points={`200,100 ${200 + Math.cos((angle * Math.PI) / 180) * 220},${100 + Math.sin((angle * Math.PI) / 180) * 120} ${200 + Math.cos(((angle + 15) * Math.PI) / 180) * 220},${100 + Math.sin(((angle + 15) * Math.PI) / 180) * 120}`}
                fill={ruling === 'sustained' 
                  ? i % 2 === 0 ? 'hsl(142, 76%, 36%)' : 'hsl(142, 76%, 26%)'
                  : i % 2 === 0 ? 'hsl(0, 72%, 51%)' : 'hsl(0, 72%, 41%)'
                }
                className="animate-ray-pulse"
                style={{ animationDelay: `${i * 30}ms` }}
              />
            );
          })}
        </svg>
      </div>

      {/* Main content */}
      <div className={cn(
        "relative flex flex-col items-center",
        isAnimating ? "animate-ruling-text-in" : "animate-ruling-text-out"
      )}>
        {/* Icon */}
        <div 
          className={cn(
            "text-6xl mb-4",
            config.textColor,
            "animate-ruling-icon"
          )}
          style={{ textShadow: `0 0 30px ${config.glowColor}` }}
        >
          {config.icon}
        </div>

        {/* Ruling text */}
        <div
          className={cn(
            "px-8 py-4 rounded-lg",
            "bg-gradient-to-r", config.bgColor,
            "border-4", config.borderColor,
            "shadow-2xl"
          )}
        >
          <h1
            className={cn(
              "text-5xl sm:text-6xl md:text-7xl font-black tracking-wider",
              config.textColor,
              "animate-ruling-shake"
            )}
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              textShadow: `0 0 20px ${config.glowColor}, 2px 2px 0 hsl(0, 0%, 10%)`,
              WebkitTextStroke: '2px hsl(0, 0%, 10%)',
              paintOrder: 'stroke fill',
            }}
          >
            {config.text}
          </h1>
        </div>

        {/* Impact lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute bg-white/60 animate-impact-line",
                config.textColor
              )}
              style={{
                width: '3px',
                height: `${30 + Math.random() * 50}px`,
                left: `${10 + i * 12}%`,
                top: '50%',
                transform: `rotate(${-20 + Math.random() * 40}deg)`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default JudgeRulingOverlay;
