import React, { useState } from 'react';
import { HandRaise, CourtParticipant } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hand, Check, X, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HandRaisePanelProps {
  handRaises: HandRaise[];
  currentParticipant?: CourtParticipant;
  isJudge: boolean;
  onRaiseHand: (reason: string) => void;
  onRespondToHand: (raiseId: string, allowed: boolean, response?: string) => void;
}

export const HandRaisePanel: React.FC<HandRaisePanelProps> = ({
  handRaises,
  currentParticipant,
  isJudge,
  onRaiseHand,
  onRespondToHand,
}) => {
  const [reason, setReason] = useState('');
  const [responseText, setResponseText] = useState('');

  const pendingRaises = handRaises.filter(h => h.status === 'pending');
  const hasRaisedHand = pendingRaises.some(h => h.participant_id === currentParticipant?.id);

  const handleRaiseHand = () => {
    if (reason.trim()) {
      onRaiseHand(reason.trim());
      setReason('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bangers text-lg text-foreground flex items-center gap-2">
          <Hand className="w-5 h-5" />
          Raise Hand
        </h3>
        {pendingRaises.length > 0 && (
          <Badge variant="secondary" className="animate-pulse">
            {pendingRaises.length} Waiting
          </Badge>
        )}
      </div>

      {/* Raise hand input */}
      {!isJudge && !hasRaisedHand && (
        <div className="flex gap-2">
          <Input
            placeholder="Reason to speak..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1"
          />
          <Button 
            variant="outline" 
            onClick={handleRaiseHand}
            disabled={!reason.trim()}
          >
            <Hand className="w-4 h-4 mr-1" />
            Raise
          </Button>
        </div>
      )}

      {hasRaisedHand && !isJudge && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/20 border border-amber-500">
          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-sm text-amber-600">Waiting for judge's permission...</span>
        </div>
      )}

      {/* Pending hand raises (for judge) */}
      {isJudge && pendingRaises.length > 0 && (
        <div className="space-y-3">
          {pendingRaises.map(raise => (
            <div 
              key={raise.id} 
              className="p-3 rounded-lg border-2 border-amber-500 bg-amber-500/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground">
                    {raise.participant?.participant_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">{raise.reason}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onRespondToHand(raise.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRespondToHand(raise.id, false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent responses */}
      {handRaises.filter(h => h.status !== 'pending').slice(-3).map(raise => (
        <div 
          key={raise.id}
          className={cn(
            "p-2 rounded-lg text-sm",
            raise.status === 'allowed' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
          )}
        >
          <span className="font-medium">{raise.participant?.participant_name}</span>
          {' was '}
          {raise.status === 'allowed' ? 'allowed to speak' : 'denied'}
          {raise.judge_response && (
            <span className="block text-xs mt-1 opacity-75">
              Judge: "{raise.judge_response}"
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
