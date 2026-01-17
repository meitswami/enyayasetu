import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ReactionType = 'agree' | 'disagree' | 'shocked' | 'thinking' | 'objection' | null;

export interface ParticipantReaction {
  participantId: string;
  participantName: string;
  role: string;
  reaction: ReactionType;
  timestamp: number;
}

interface UseParticipantReactionsOptions {
  sessionId: string;
  participantId?: string;
  participantName?: string;
  role?: string;
}

export const useParticipantReactions = ({
  sessionId,
  participantId,
  participantName,
  role,
}: UseParticipantReactionsOptions) => {
  const [reactions, setReactions] = useState<Map<string, ParticipantReaction>>(new Map());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Initialize realtime channel
  useEffect(() => {
    if (!sessionId) return;

    const realtimeChannel = supabase.channel(`court-reactions-${sessionId}`, {
      config: {
        presence: {
          key: participantId || 'anonymous',
        },
      },
    });

    // Handle presence sync
    realtimeChannel
      .on('presence', { event: 'sync' }, () => {
        const state = realtimeChannel.presenceState();
        const newReactions = new Map<string, ParticipantReaction>();
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = (presences as any[])[0];
          if (presence?.reaction) {
            newReactions.set(key, {
              participantId: key,
              participantName: presence.participantName || 'Unknown',
              role: presence.role || 'audience',
              reaction: presence.reaction,
              timestamp: presence.timestamp || Date.now(),
            });
          }
        });
        
        setReactions(newReactions);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0] as any;
        if (presence?.reaction) {
          setReactions(prev => {
            const updated = new Map(prev);
            updated.set(key, {
              participantId: key,
              participantName: presence.participantName || 'Unknown',
              role: presence.role || 'audience',
              reaction: presence.reaction,
              timestamp: presence.timestamp || Date.now(),
            });
            return updated;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setReactions(prev => {
          const updated = new Map(prev);
          updated.delete(key);
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && participantId) {
          await realtimeChannel.track({
            participantId,
            participantName: participantName || 'Unknown',
            role: role || 'audience',
            reaction: null,
            timestamp: Date.now(),
          });
        }
      });

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [sessionId, participantId, participantName, role]);

  // Send a reaction
  const sendReaction = useCallback(async (reaction: ReactionType) => {
    if (!channel || !participantId) return;

    await channel.track({
      participantId,
      participantName: participantName || 'Unknown',
      role: role || 'audience',
      reaction,
      timestamp: Date.now(),
    });

    // Auto-clear reaction after 3 seconds
    if (reaction) {
      setTimeout(async () => {
        await channel.track({
          participantId,
          participantName: participantName || 'Unknown',
          role: role || 'audience',
          reaction: null,
          timestamp: Date.now(),
        });
      }, 3000);
    }
  }, [channel, participantId, participantName, role]);

  // Get reactions as array
  const reactionsList = Array.from(reactions.values());

  // Get reaction for a specific participant
  const getReactionFor = useCallback((pid: string) => {
    return reactions.get(pid)?.reaction || null;
  }, [reactions]);

  return {
    reactions: reactionsList,
    sendReaction,
    getReactionFor,
  };
};
