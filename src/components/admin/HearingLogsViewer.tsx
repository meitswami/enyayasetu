import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, Download, Eye, FileText, Users, MessageSquare, 
  Clock, Calendar, Filter, RefreshCw, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HearingLog {
  id: string;
  session_id: string;
  case_id: string;
  user_id: string;
  payment_id?: string;
  payment_transaction_number?: string;
  lawyer_type?: string;
  ai_lawyer_id?: string;
  actual_lawyer_id?: string;
  actual_lawyer_name?: string;
  addons_applied?: any[];
  hearing_started_at?: string;
  hearing_ended_at?: string;
  total_duration_seconds?: number;
  status: string;
  video_recording_url?: string;
  created_at: string;
  case?: {
    case_number: string;
    title: string;
  };
  session?: {
    court_code: string;
  };
}

interface TranscriptLog {
  id: string;
  speaker_name: string;
  speaker_role: string;
  speaker_type?: string;
  message: string;
  message_type: string;
  spoken_at: string;
  is_ai_speaker: boolean;
  is_real_person: boolean;
}

interface EvidenceLog {
  id: string;
  submitted_by_name: string;
  submitted_by_role: string;
  submitted_by_side?: string;
  evidence_type: string;
  file_name: string;
  file_url: string;
  processing_duration_seconds?: number;
  judge_decision?: string;
  presented_at: string;
}

interface ParticipantLog {
  id: string;
  participant_name: string;
  participant_role: string;
  activity_type: string;
  activity_description?: string;
  activity_at: string;
}

interface InteractionLog {
  id: string;
  initiator_name: string;
  initiator_role: string;
  recipient_name?: string;
  recipient_role?: string;
  interaction_type: string;
  initiator_transcript: string;
  recipient_transcript?: string;
  is_police_interaction: boolean;
  police_person_name?: string;
  interaction_started_at: string;
}

export const HearingLogsViewer: React.FC = () => {
  const [hearingLogs, setHearingLogs] = useState<HearingLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<HearingLog | null>(null);
  const [transcriptLogs, setTranscriptLogs] = useState<TranscriptLog[]>([]);
  const [evidenceLogs, setEvidenceLogs] = useState<EvidenceLog[]>([]);
  const [participantLogs, setParticipantLogs] = useState<ParticipantLog[]>([]);
  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchHearingLogs();
  }, [statusFilter]);

  const fetchHearingLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('hearing_logs')
        .select(`
          *,
          case:cases(case_number, title),
          session:court_sessions(court_code)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHearingLogs(data || []);
    } catch (error) {
      console.error('Error fetching hearing logs:', error);
      toast.error('Failed to load hearing logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogDetails = async (logId: string) => {
    try {
      // Fetch transcripts
      const { data: transcripts } = await supabase
        .from('hearing_transcript_logs')
        .select('*')
        .eq('hearing_log_id', logId)
        .order('spoken_at');

      setTranscriptLogs(transcripts || []);

      // Fetch evidence
      const { data: evidence } = await supabase
        .from('hearing_evidence_logs')
        .select('*')
        .eq('hearing_log_id', logId)
        .order('presented_at');

      setEvidenceLogs(evidence || []);

      // Fetch participant activities
      const { data: participants } = await supabase
        .from('hearing_participant_logs')
        .select('*')
        .eq('hearing_log_id', logId)
        .order('activity_at');

      setParticipantLogs(participants || []);

      // Fetch interactions
      const { data: interactions } = await supabase
        .from('hearing_interaction_logs')
        .select('*')
        .eq('hearing_log_id', logId)
        .order('interaction_started_at');

      setInteractionLogs(interactions || []);
    } catch (error) {
      console.error('Error fetching log details:', error);
      toast.error('Failed to load log details');
    }
  };

  const handleViewLog = (log: HearingLog) => {
    setSelectedLog(log);
    fetchLogDetails(log.id);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const filteredLogs = hearingLogs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.case?.case_number?.toLowerCase().includes(term) ||
      log.case?.title?.toLowerCase().includes(term) ||
      log.payment_transaction_number?.toLowerCase().includes(term) ||
      log.session?.court_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hearing Logs</h2>
          <p className="text-muted-foreground">Complete audit trail of all court hearings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchHearingLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by case number, title, transaction number, or court code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="started">Started</option>
          <option value="in_progress">In Progress</option>
          <option value="adjourned">Adjourned</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Main Logs Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Court Code</TableHead>
              <TableHead>Lawyer Type</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hearing logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.case?.case_number || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{log.case?.title || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.session?.court_code || 'N/A'}</TableCell>
                  <TableCell>
                    {log.lawyer_type === 'ai_lawyer' ? (
                      <Badge variant="secondary">AI Lawyer</Badge>
                    ) : log.lawyer_type === 'actual_lawyer' ? (
                      <Badge>Real Lawyer</Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.hearing_started_at
                      ? format(new Date(log.hearing_started_at), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{formatDuration(log.total_duration_seconds)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === 'completed'
                          ? 'default'
                          : log.status === 'adjourned'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.payment_transaction_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewLog(log)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Hearing Log Details</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="interactions">Interactions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Case</label>
                    <p className="font-medium">{selectedLog.case?.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.case?.case_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Court Code</label>
                    <p className="font-mono">{selectedLog.session?.court_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge>{selectedLog.status}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                    <p>{formatDuration(selectedLog.total_duration_seconds)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lawyer Type</label>
                    <p>{selectedLog.lawyer_type || 'N/A'}</p>
                    {selectedLog.actual_lawyer_name && (
                      <p className="text-sm text-muted-foreground">{selectedLog.actual_lawyer_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction</label>
                    <p className="font-mono text-sm">{selectedLog.payment_transaction_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Started At</label>
                    <p>
                      {selectedLog.hearing_started_at
                        ? format(new Date(selectedLog.hearing_started_at), 'MMM dd, yyyy HH:mm:ss')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ended At</label>
                    <p>
                      {selectedLog.hearing_ended_at
                        ? format(new Date(selectedLog.hearing_ended_at), 'MMM dd, yyyy HH:mm:ss')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {selectedLog.addons_applied && selectedLog.addons_applied.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Add-ons Applied</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedLog.addons_applied.map((addon, idx) => (
                        <Badge key={idx} variant="outline">{addon.name || addon}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transcripts" className="space-y-2">
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Speaker</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transcriptLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.spoken_at), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {log.is_ai_speaker && <Badge variant="secondary" className="text-xs">AI</Badge>}
                              {!log.is_real_person && <Badge variant="outline" className="text-xs">Virtual</Badge>}
                              <span>{log.speaker_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{log.speaker_role}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{log.message_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm truncate">{log.message}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="evidence" className="space-y-2">
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Processing Time</TableHead>
                        <TableHead>Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evidenceLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.presented_at), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.submitted_by_name}</div>
                              <div className="text-xs text-muted-foreground">{log.submitted_by_role}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.evidence_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <a
                              href={log.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {log.file_name}
                            </a>
                          </TableCell>
                          <TableCell>
                            {log.processing_duration_seconds
                              ? `${log.processing_duration_seconds}s`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {log.judge_decision ? (
                              <Badge
                                variant={log.judge_decision === 'accepted' ? 'default' : 'destructive'}
                              >
                                {log.judge_decision}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="participants" className="space-y-2">
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participantLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.activity_at), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell className="font-medium">{log.participant_name}</TableCell>
                          <TableCell>{log.participant_role}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.activity_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.activity_description || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="interactions" className="space-y-2">
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Transcript</TableHead>
                        <TableHead>Police</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interactionLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.interaction_started_at), 'HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.initiator_name}</div>
                              <div className="text-xs text-muted-foreground">{log.initiator_role}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.recipient_name ? (
                              <div>
                                <div className="font-medium">{log.recipient_name}</div>
                                <div className="text-xs text-muted-foreground">{log.recipient_role}</div>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.interaction_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm">
                              <p className="font-medium">Q: {log.initiator_transcript}</p>
                              {log.recipient_transcript && (
                                <p className="text-muted-foreground">A: {log.recipient_transcript}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.is_police_interaction ? (
                              <div>
                                <Badge variant="destructive">Police</Badge>
                                {log.police_person_name && (
                                  <p className="text-xs mt-1">{log.police_person_name}</p>
                                )}
                              </div>
                            ) : (
                              'No'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

