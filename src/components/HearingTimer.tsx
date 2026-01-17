import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HearingTimerProps {
  isActive: boolean;
  className?: string;
}

export const HearingTimer: React.FC<HearingTimerProps> = ({ isActive, className }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && startTimeRef.current === null) {
      // Start the timer
      startTimeRef.current = Date.now();
      setElapsedTime(0);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || startTimeRef.current === null) {
      return;
    }

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show timer if it's active or if it has been started (has elapsed time)
  if (!isActive && elapsedTime === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border-2 border-foreground shadow-sm',
        className
      )}
    >
      <Clock className="w-4 h-4 text-primary" />
      <span className="font-mono font-semibold text-sm">{formatTime(elapsedTime)}</span>
    </div>
  );
};

