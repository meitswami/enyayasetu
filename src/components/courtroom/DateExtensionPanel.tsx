import React, { useState } from 'react';
import { DateRequest, CourtParticipant } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateExtensionPanelProps {
  dateRequests: DateRequest[];
  currentParticipant?: CourtParticipant;
  isJudge: boolean;
  onRequestDate: (reason: string, requestedDate?: string) => void;
  onDecideDate: (requestId: string, approved: boolean, decision: string) => void;
}

export const DateExtensionPanel: React.FC<DateExtensionPanelProps> = ({
  dateRequests,
  currentParticipant,
  isJudge,
  onRequestDate,
  onDecideDate,
}) => {
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [decisionText, setDecisionText] = useState('');

  const pendingRequests = dateRequests.filter(r => r.status === 'pending');
  const hasPendingRequest = pendingRequests.some(
    r => r.requested_by === currentParticipant?.id
  );

  const handleRequestDate = () => {
    if (reason.trim()) {
      onRequestDate(reason.trim(), requestedDate || undefined);
      setReason('');
      setRequestedDate('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bangers text-lg text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Date Extension
        </h3>
        {pendingRequests.length > 0 && (
          <Badge variant="secondary" className="animate-pulse">
            {pendingRequests.length} Pending
          </Badge>
        )}
      </div>

      {/* Request form (for non-judges) */}
      {!isJudge && !hasPendingRequest && (
        <div className="space-y-2">
          <Textarea
            placeholder="Reason for date extension (e.g., need more time to gather evidence)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={handleRequestDate}
              disabled={!reason.trim()}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Request
            </Button>
          </div>
        </div>
      )}

      {hasPendingRequest && !isJudge && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/20 border border-amber-500">
          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-sm text-amber-600">Waiting for judge's decision...</span>
        </div>
      )}

      {/* Pending requests (for judge) */}
      {isJudge && pendingRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRequests.map(request => (
            <div 
              key={request.id} 
              className="p-3 rounded-lg border-2 border-amber-500 bg-amber-500/10"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground">
                      {request.requester?.participant_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    {request.requested_date && (
                      <p className="text-xs text-primary mt-1">
                        Requested: {new Date(request.requested_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="flex-shrink-0">
                    {request.requester?.role}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-border space-y-2">
                  <Textarea
                    placeholder="Decision reason (will be read aloud)..."
                    value={decisionText}
                    onChange={(e) => setDecisionText(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onDecideDate(request.id, true, decisionText);
                        setDecisionText('');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Grant Extension
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        onDecideDate(request.id, false, decisionText);
                        setDecisionText('');
                      }}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning message for judge */}
      {isJudge && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            As AI Judge, evaluate date extension requests based on case seriousness 
            and reason validity. Goal: Clear backlog efficiently.
          </p>
        </div>
      )}

      {/* Past decisions */}
      {dateRequests.filter(r => r.status !== 'pending').slice(-3).map(request => (
        <div 
          key={request.id}
          className={cn(
            "p-2 rounded-lg text-sm",
            request.status === 'approved' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
          )}
        >
          <span className="font-medium">{request.requester?.participant_name}</span>
          {' request was '}
          {request.status === 'approved' ? 'granted' : 'denied'}
          {request.judge_decision && (
            <span className="block text-xs mt-1 opacity-75">
              Judge: "{request.judge_decision}"
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
