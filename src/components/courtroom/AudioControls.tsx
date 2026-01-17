import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AudioControlsProps {
  isAmbiancePlaying: boolean;
  isMuted: boolean;
  ambianceVolume: number;
  onToggleAmbiance: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isAmbiancePlaying,
  isMuted,
  ambianceVolume,
  onToggleAmbiance,
  onToggleMute,
  onVolumeChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Mute button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMute}
        className="h-8 w-8 border-2 border-foreground shadow-[2px_2px_0_hsl(var(--foreground))]"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>

      {/* Ambiance controls */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isAmbiancePlaying ? 'default' : 'outline'}
            size="icon"
            className={cn(
              'h-8 w-8 border-2 border-foreground shadow-[2px_2px_0_hsl(var(--foreground))]',
              isAmbiancePlaying && 'bg-primary'
            )}
            title="Courtroom Ambiance"
          >
            <Music className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 border-2 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))]" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Courtroom Ambiance</span>
              <Button
                variant={isAmbiancePlaying ? 'destructive' : 'default'}
                size="sm"
                onClick={onToggleAmbiance}
              >
                {isAmbiancePlaying ? 'Stop' : 'Play'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Volume</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {Math.round(ambianceVolume * 100)}%
                </span>
              </div>
              <Slider
                value={[ambianceVolume * 100]}
                onValueChange={(values) => onVolumeChange(values[0] / 100)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              🎵 Adds subtle courtroom atmosphere sounds
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
