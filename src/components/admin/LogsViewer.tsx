import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Terminal, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface LogEntry {
  id: string;
  type: 'case_created' | 'message' | 'ocr' | 'evidence' | 'session';
  action: string;
  details: string;
  timestamp: string;
}

export const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Aggregate logs from various sources
      const logEntries: LogEntry[] = [];

      // Recent cases
      const { data: cases } = await supabase
        .from('cases')
        .select('id, case_number, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(20);

      if (cases) {
        cases.forEach((c) => {
          logEntries.push({
            id: `case-${c.id}`,
            type: 'case_created',
            action: 'Case Filed',
            details: `${c.case_number}: ${c.title} (Status: ${c.status})`,
            timestamp: c.created_at,
          });
        });
      }

      // Recent messages
      const { data: messages } = await supabase
        .from('case_intake_messages')
        .select('id, role, message_type, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      if (messages) {
        messages.forEach((m) => {
          logEntries.push({
            id: `msg-${m.id}`,
            type: 'message',
            action: `${m.role === 'user' ? 'User Message' : 'AI Response'}`,
            details: `Type: ${m.message_type}`,
            timestamp: m.created_at,
          });
        });
      }

      // Recent evidence uploads
      const { data: evidence } = await supabase
        .from('case_evidence')
        .select('id, file_name, provided_by, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (evidence) {
        evidence.forEach((e) => {
          logEntries.push({
            id: `evidence-${e.id}`,
            type: 'evidence',
            action: 'Evidence Uploaded',
            details: `${e.file_name} by ${e.provided_by}`,
            timestamp: e.created_at,
          });
        });
      }

      // Recent hearing sessions
      const { data: sessions } = await supabase
        .from('hearing_sessions')
        .select('id, session_number, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessions) {
        sessions.forEach((s) => {
          logEntries.push({
            id: `session-${s.id}`,
            type: 'session',
            action: 'Hearing Session',
            details: `Session #${s.session_number} - ${s.status}`,
            timestamp: s.created_at,
          });
        });
      }

      // Sort all logs by timestamp
      logEntries.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setLogs(logEntries);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'case_created':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'message':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'evidence':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'session':
        return <Terminal className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getLogBadge = (type: LogEntry['type']) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      case_created: 'default',
      message: 'secondary',
      evidence: 'outline',
      session: 'default',
    };
    return <Badge variant={variants[type]}>{type.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          System Activity Logs
        </h2>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="border-2 border-foreground rounded-xl overflow-hidden bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="mt-0.5">{getLogIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getLogBadge(log.type)}
                      <span className="font-medium text-sm">{log.action}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {log.details}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Showing latest {logs.length} activity entries across all system operations
      </div>
    </div>
  );
};
