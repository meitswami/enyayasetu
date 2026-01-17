import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { generateCasePDF } from '@/utils/generateCasePDF';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  MessageSquare,
  Upload,
  User,
  Calendar,
  Phone,
  Scale,
  Clock,
  Loader2,
  Download,
} from 'lucide-react';

interface CaseRecord {
  id: string;
  case_number: string;
  title: string;
  plaintiff: string;
  defendant: string;
  category: string;
  status: string;
  user_role: string;
  created_at: string;
  callback_number?: string;
  ai_processing_status?: string;
  uploaded_by_relation?: string;
  involved_person_status?: string;
  description?: string;
}

interface IntakeMessage {
  id: string;
  role: string;
  message: string;
  message_type: string;
  file_url?: string;
  ocr_extracted_text?: string;
  created_at: string;
}

interface CaseReport {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  report_type: string;
  ocr_text?: string;
  ai_summary?: string;
  created_at: string;
}

interface CaseDetailModalProps {
  open: boolean;
  onClose: () => void;
  caseRecord: CaseRecord | null;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  open,
  onClose,
  caseRecord,
}) => {
  const [intakeMessages, setIntakeMessages] = useState<IntakeMessage[]>([]);
  const [caseReports, setCaseReports] = useState<CaseReport[]>([]);
  const [caseEvidence, setCaseEvidence] = useState<any[]>([]);
  const [courtTranscripts, setCourtTranscripts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && caseRecord) {
      fetchCaseDetails();
    }
  }, [open, caseRecord]);

  const fetchCaseDetails = async () => {
    if (!caseRecord) return;

    setIsLoading(true);
    try {
      // Fetch intake messages
      const { data: messages } = await supabase
        .from('case_intake_messages')
        .select('*')
        .eq('case_id', caseRecord.id)
        .order('created_at', { ascending: true });

      // Fetch case reports
      const { data: reports } = await supabase
        .from('case_reports')
        .select('*')
        .eq('case_id', caseRecord.id)
        .order('created_at', { ascending: false });

      // Fetch case evidence
      const { data: evidence } = await supabase
        .from('case_evidence')
        .select('*')
        .eq('case_id', caseRecord.id)
        .order('created_at', { ascending: false });

      // Fetch court transcripts from court sessions
      const { data: sessions } = await supabase
        .from('court_sessions')
        .select('id')
        .eq('case_id', caseRecord.id);

      let transcripts: any[] = [];
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        const { data: transcriptData } = await supabase
          .from('court_transcripts')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: true });
        transcripts = transcriptData || [];
      }

      setIntakeMessages(messages || []);
      setCaseReports(reports || []);
      setCaseEvidence(evidence || []);
      setCourtTranscripts(transcripts);
    } catch (error) {
      console.error('Error fetching case details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!caseRecord) return;

    setIsGeneratingPDF(true);
    try {
      generateCasePDF({
        caseData: {
          case_number: caseRecord.case_number,
          title: caseRecord.title,
          plaintiff: caseRecord.plaintiff,
          defendant: caseRecord.defendant,
          category: caseRecord.category,
          status: caseRecord.status,
          description: caseRecord.description,
          created_at: caseRecord.created_at,
        },
        transcripts: courtTranscripts.map(t => ({
          speaker_name: t.speaker_name,
          speaker_role: t.speaker_role,
          message: t.message,
          created_at: t.created_at,
        })),
        evidence: caseEvidence.map(e => ({
          file_name: e.file_name,
          file_type: e.file_type,
          provided_by: e.provided_by,
          description: e.description,
          ai_analysis: e.ai_analysis,
          created_at: e.created_at,
        })),
      });

      toast({
        title: 'PDF Generated',
        description: 'Case summary has been downloaded.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!caseRecord) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Case Details: {caseRecord.case_number}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="mr-6"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-6 p-1">
              {/* Case Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  icon={<FileText className="w-4 h-4" />}
                  label="Case Number"
                  value={caseRecord.case_number}
                />
                <InfoCard
                  icon={<Badge variant="outline">{caseRecord.status}</Badge>}
                  label="Status"
                  value={caseRecord.ai_processing_status || 'N/A'}
                />
                <InfoCard
                  icon={<User className="w-4 h-4" />}
                  label="Plaintiff"
                  value={caseRecord.plaintiff}
                />
                <InfoCard
                  icon={<User className="w-4 h-4" />}
                  label="Defendant"
                  value={caseRecord.defendant}
                />
                <InfoCard
                  icon={<Calendar className="w-4 h-4" />}
                  label="Filed Date"
                  value={new Date(caseRecord.created_at).toLocaleString()}
                />
                <InfoCard
                  icon={<Phone className="w-4 h-4" />}
                  label="Callback Number"
                  value={caseRecord.callback_number || 'Not provided'}
                />
                <InfoCard
                  icon={<User className="w-4 h-4" />}
                  label="Filed By (Relation)"
                  value={caseRecord.uploaded_by_relation || 'Self'}
                />
                <InfoCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Involved Person Status"
                  value={caseRecord.involved_person_status || 'N/A'}
                />
              </div>

              {/* Description */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description / Summary
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {caseRecord.description || caseRecord.title}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="conversation" className="p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : intakeMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conversation records found.
                </div>
              ) : (
                <div className="space-y-3">
                  {intakeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary/10 ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                          {msg.role === 'user' ? 'User' : 'AI Assistant'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                        {msg.message_type !== 'text' && (
                          <Badge variant="outline" className="text-xs">
                            {msg.message_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      {msg.ocr_extracted_text && (
                        <div className="mt-2 p-2 bg-background rounded border text-xs">
                          <strong>OCR Extract:</strong>
                          <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">
                            {msg.ocr_extracted_text.substring(0, 500)}...
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : caseReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No documents uploaded.
                </div>
              ) : (
                <div className="space-y-4">
                  {caseReports.map((report) => (
                    <div
                      key={report.id}
                      className="border-2 border-foreground rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-start gap-3">
                        <Upload className="w-8 h-8 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{report.file_name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{report.report_type}</Badge>
                            <Badge variant="secondary">{report.file_type}</Badge>
                          </div>
                          {report.ai_summary && (
                            <div className="mt-3">
                              <strong className="text-sm">AI Summary:</strong>
                              <p className="text-sm text-muted-foreground mt-1">
                                {report.ai_summary}
                              </p>
                            </div>
                          )}
                          {report.ocr_text && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-medium">
                                View OCR Text
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {report.ocr_text}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="bg-muted/50 rounded-lg p-3">
    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
      {icon}
      {label}
    </div>
    <p className="font-medium">{value}</p>
  </div>
);
