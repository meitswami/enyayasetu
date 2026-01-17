import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Music, Gavel, AlertTriangle, FileText, Users, Zap, Check, X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoundEffectPanelProps {
  onPlayGavel: () => void;
  onPlayObjection: () => void;
  onPlayVerdict: () => void;
  onPlayEvidence: () => void;
  onPlayWitness: () => void;
  onPlayTension: () => void;
  onPlaySustained?: () => void;
  onPlayOverruled?: () => void;
  disabled?: boolean;
}

const SoundEffectPanel: React.FC<SoundEffectPanelProps> = ({
  onPlayGavel,
  onPlayObjection,
  onPlayVerdict,
  onPlayEvidence,
  onPlayWitness,
  onPlayTension,
  onPlaySustained,
  onPlayOverruled,
  disabled = false,
}) => {
  const soundEffects = [
    { icon: Gavel, label: 'Gavel', shortcut: 'G', onClick: onPlayGavel, color: 'text-amber-500' },
    { icon: AlertTriangle, label: 'Objection!', shortcut: 'O', onClick: onPlayObjection, color: 'text-red-500' },
    { icon: Zap, label: 'Verdict', shortcut: 'V', onClick: onPlayVerdict, color: 'text-yellow-500' },
    { icon: FileText, label: 'Evidence', shortcut: 'E', onClick: onPlayEvidence, color: 'text-blue-500' },
    { icon: Users, label: 'Witness', shortcut: 'W', onClick: onPlayWitness, color: 'text-green-500' },
    { icon: Music, label: 'Tension', shortcut: 'T', onClick: onPlayTension, color: 'text-purple-500' },
  ];

  const rulingEffects = [
    { icon: Check, label: 'Sustained', shortcut: 'S', onClick: onPlaySustained, color: 'text-green-500' },
    { icon: X, label: 'Overruled', shortcut: 'R', onClick: onPlayOverruled, color: 'text-red-500' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Music className="h-4 w-4" />
          <span className="hidden sm:inline">Sound FX</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-foreground">Sound Effects</h4>
          <div className="grid grid-cols-2 gap-2">
            {soundEffects.map((effect) => (
              <Button
                key={effect.label}
                variant="outline"
                size="sm"
                onClick={effect.onClick}
                className={cn(
                  "flex items-center gap-2 justify-start h-10",
                  "hover:bg-accent transition-all duration-200",
                  "active:scale-95"
                )}
              >
                <effect.icon className={cn("h-4 w-4", effect.color)} />
                <span className="text-xs flex-1 text-left">{effect.label}</span>
                <kbd className="text-[10px] bg-muted px-1 rounded">{effect.shortcut}</kbd>
              </Button>
            ))}
          </div>

          {/* Rulings section */}
          <div className="pt-2 border-t border-border">
            <h5 className="font-medium text-xs text-muted-foreground mb-2">Judge Rulings</h5>
            <div className="grid grid-cols-2 gap-2">
              {rulingEffects.map((effect) => (
                <Button
                  key={effect.label}
                  variant="outline"
                  size="sm"
                  onClick={effect.onClick}
                  disabled={!effect.onClick}
                  className={cn(
                    "flex items-center gap-2 justify-start h-10",
                    "hover:bg-accent transition-all duration-200",
                    "active:scale-95"
                  )}
                >
                  <effect.icon className={cn("h-4 w-4", effect.color)} />
                  <span className="text-xs flex-1 text-left">{effect.label}</span>
                  <kbd className="text-[10px] bg-muted px-1 rounded">{effect.shortcut}</kbd>
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" />
            <span>Hold <kbd className="bg-muted px-1 rounded">Shift</kbd> + key for shortcuts</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SoundEffectPanel;
