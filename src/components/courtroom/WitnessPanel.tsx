import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { WitnessRequest, CourtParticipant } from './types';

interface WitnessPanelProps {
  witnessRequests: WitnessRequest[];
  currentParticipant?: CourtParticipant;
  isJudge: boolean;
  onRequestWitness: (name: string, description: string, relevance: string) => Promise<void>;
  onRespondToWitness: (requestId: string, summoned: boolean, response?: string) => Promise<void>;
  onWitnessTestified: (requestId: string) => Promise<void>;
  isProcessing?: boolean;
}

export const WitnessPanel: React.FC<WitnessPanelProps> = ({
  witnessRequests,
  currentParticipant,
  isJudge,
  onRequestWitness,
  onRespondToWitness,
  onWitnessTestified,
  isProcessing = false,
}) => {
  const [witnessName, setWitnessName] = useState('');
  const [witnessDescription, setWitnessDescription] = useState('');
  const [relevance, setRelevance] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!witnessName.trim() || !relevance.trim()) return;
    
    setSubmitting(true);
    await onRequestWitness(witnessName.trim(), witnessDescription.trim(), relevance.trim());
    setWitnessName('');
    setWitnessDescription('');
    setRelevance('');
    setSubmitting(false);
  };

  const getStatusBadge = (status: WitnessRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'summoned':
        return <Badge variant="default" className="bg-amber-500">Summoned</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      case 'present':
        return <Badge variant="default" className="bg-green-500">Present</Badge>;
      case 'testified':
        return <Badge variant="outline" className="border-green-500 text-green-500">Testified</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bangers text-lg flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        Witness Requests
      </h3>

      {/* Request Form */}
      {currentParticipant && !isJudge && (
        <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Input
            placeholder="Witness name..."
            value={witnessName}
            onChange={(e) => setWitnessName(e.target.value)}
            disabled={submitting}
          />
          <Input
            placeholder="Brief description (optional)..."
            value={witnessDescription}
            onChange={(e) => setWitnessDescription(e.target.value)}
            disabled={submitting}
          />
          <Textarea
            placeholder="Why is this witness relevant to your case?..."
            value={relevance}
            onChange={(e) => setRelevance(e.target.value)}
            rows={2}
            disabled={submitting}
          />
          <Button 
            size="sm" 
            className="w-full"
            onClick={handleSubmit}
            disabled={!witnessName.trim() || !relevance.trim() || submitting}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Request Witness
          </Button>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {witnessRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No witness requests yet
          </p>
        ) : (
          witnessRequests.map((request) => (
            <div 
              key={request.id}
              className="p-3 rounded-lg border border-border bg-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.witness_name}</p>
                  {request.witness_description && (
                    <p className="text-xs text-muted-foreground">{request.witness_description}</p>
                  )}
                </div>
                {getStatusBadge(request.status)}
              </div>
              
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Relevance:</span> {request.relevance}
              </p>
              
              {request.requester && (
                <p className="text-xs text-muted-foreground">
                  Requested by: {request.requester.participant_name} ({request.requester.role})
                </p>
              )}

              {request.judge_response && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    <span className="font-medium">Judge:</span> {request.judge_response}
                  </p>
                </div>
              )}

              {/* Judge Actions */}
              {isJudge && request.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-green-500 border-green-500 hover:bg-green-500/10"
                    onClick={() => onRespondToWitness(request.id, true)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Summon
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => onRespondToWitness(request.id, false)}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Deny
                  </Button>
                </div>
              )}

              {/* Mark as Testified */}
              {isJudge && (request.status === 'summoned' || request.status === 'present') && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => onWitnessTestified(request.id)}
                  disabled={isProcessing}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Testified
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
