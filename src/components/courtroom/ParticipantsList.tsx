import React from 'react';
import { CourtParticipant, ParticipantRole } from './types';
import { Badge } from '@/components/ui/badge';
import { User, Bot, Crown, Scale, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantsListProps {
  participants: CourtParticipant[];
  currentUserId?: string;
}

const roleConfig: Record<ParticipantRole, { icon: React.ElementType; color: string; label: string }> = {
  judge: { icon: Crown, color: 'text-amber-500 bg-amber-500/20', label: 'Judge' },
  prosecutor: { icon: Shield, color: 'text-red-500 bg-red-500/20', label: 'Prosecutor' },
  defence_lawyer: { icon: Scale, color: 'text-blue-500 bg-blue-500/20', label: 'Defence' },
  accused: { icon: User, color: 'text-orange-500 bg-orange-500/20', label: 'Accused' },
  victim: { icon: User, color: 'text-purple-500 bg-purple-500/20', label: 'Victim' },
  victim_family: { icon: Users, color: 'text-purple-400 bg-purple-400/20', label: 'Victim Family' },
  accused_family: { icon: Users, color: 'text-orange-400 bg-orange-400/20', label: 'Accused Family' },
  witness: { icon: User, color: 'text-teal-500 bg-teal-500/20', label: 'Witness' },
  audience: { icon: Users, color: 'text-muted-foreground bg-muted', label: 'Audience' },
};

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  currentUserId,
}) => {
  const activeParticipants = participants.filter(p => p.is_active);
  
  const groupedParticipants = activeParticipants.reduce((acc, p) => {
    if (!acc[p.role]) acc[p.role] = [];
    acc[p.role].push(p);
    return acc;
  }, {} as Record<string, CourtParticipant[]>);

  const roleOrder: ParticipantRole[] = [
    'judge', 'prosecutor', 'defence_lawyer', 'accused', 'victim', 
    'victim_family', 'accused_family', 'witness', 'audience'
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-bangers text-lg text-foreground flex items-center gap-2">
        <Users className="w-5 h-5" />
        Present in Court ({activeParticipants.length})
      </h3>
      
      <div className="space-y-2">
        {roleOrder.map(role => {
          const group = groupedParticipants[role];
          if (!group?.length) return null;
          
          const config = roleConfig[role];
          const Icon = config.icon;
          
          return (
            <div key={role} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                <Icon className={cn("w-3 h-3", config.color.split(' ')[0])} />
                {config.label}
              </div>
              
              <div className="flex flex-wrap gap-2 pl-5">
                {group.map(p => (
                  <Badge 
                    key={p.id} 
                    variant="outline"
                    className={cn(
                      "gap-1.5",
                      config.color,
                      p.user_id === currentUserId && "ring-2 ring-primary"
                    )}
                  >
                    {p.is_ai ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {p.participant_name}
                    {p.user_id === currentUserId && <span className="text-xs">(You)</span>}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
