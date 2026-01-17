import React, { useEffect, useRef } from 'react';
import { CourtTranscript } from './types';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Crown, Shield, Scale, User, 
  FileText, AlertCircle, Gavel, Volume2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptPanelProps {
  transcripts: CourtTranscript[];
  currentSpeakingId?: string;
  autoScroll?: boolean;
}

const roleConfig: Record<string, { icon: React.ElementType; color: string }> = {
  judge: { icon: Crown, color: 'text-amber-500 border-amber-500 bg-amber-500/10' },
  prosecutor: { icon: Shield, color: 'text-red-500 border-red-500 bg-red-500/10' },
  defence_lawyer: { icon: Scale, color: 'text-blue-500 border-blue-500 bg-blue-500/10' },
  accused: { icon: User, color: 'text-orange-500 border-orange-500 bg-orange-500/10' },
  victim: { icon: User, color: 'text-purple-500 border-purple-500 bg-purple-500/10' },
  witness: { icon: User, color: 'text-teal-500 border-teal-500 bg-teal-500/10' },
  default: { icon: MessageSquare, color: 'text-muted-foreground border-border bg-muted' },
};

const messageTypeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  speech: { icon: MessageSquare, label: '' },
  action: { icon: Gavel, label: 'Action' },
  document: { icon: FileText, label: 'Document' },
  objection: { icon: AlertCircle, label: 'Objection!' },
  order: { icon: Crown, label: 'Order' },
  evidence: { icon: FileText, label: 'Evidence' },
};

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcripts,
  currentSpeakingId,
  autoScroll = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, autoScroll]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bangers text-lg text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Court Transcript
        </h3>
        <Badge variant="outline">{transcripts.length} entries</Badge>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2"
        style={{ maxHeight: '400px' }}
      >
        {transcripts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Court session not started yet</p>
          </div>
        ) : (
          transcripts.map((transcript) => {
            const config = roleConfig[transcript.speaker_role] || roleConfig.default;
            const typeConfig = messageTypeConfig[transcript.message_type] || messageTypeConfig.speech;
            const Icon = config.icon;
            const TypeIcon = typeConfig.icon;
            const isSpeaking = transcript.id === currentSpeakingId;

            return (
              <div
                key={transcript.id}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all duration-300",
                  config.color,
                  isSpeaking && "ring-2 ring-primary shadow-lg scale-[1.02]"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "p-1.5 rounded-full",
                    config.color.split(' ')[2]
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">
                        {transcript.speaker_name}
                      </span>
                      {transcript.message_type !== 'speech' && (
                        <Badge variant="secondary" className="text-xs py-0">
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                      )}
                      {isSpeaking && (
                        <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                      )}
                    </div>
                    
                    <p className={cn(
                      "text-sm",
                      transcript.message_type === 'objection' && "font-bold uppercase"
                    )}>
                      {transcript.message}
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(transcript.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
