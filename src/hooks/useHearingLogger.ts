import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HearingLogData {
  sessionId: string;
  caseId: string;
  userId: string;
  paymentId?: string;
  paymentTransactionNumber?: string;
  invoiceId?: string;
  lawyerType?: 'ai_lawyer' | 'actual_lawyer';
  aiLawyerId?: string;
  actualLawyerId?: string;
  actualLawyerEmail?: string;
  actualLawyerName?: string;
  addonsApplied?: any[];
  videoRecordingId?: string;
  videoRecordingUrl?: string;
}

interface EvidenceLogData {
  evidenceSubmissionId?: string;
  submittedByParticipantId?: string;
  submittedByUserId?: string;
  submittedByName: string;
  submittedByRole: string;
  submittedBySide?: 'plaintiff' | 'defendant' | 'court' | 'other';
  evidenceType: 'document' | 'image' | 'video' | 'audio' | 'other';
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes?: number;
  fileHash?: string;
  ocrText?: string;
  aiAnalysis?: string;
  processingDurationSeconds?: number;
  judgeDecision?: 'accepted' | 'rejected' | 'pending';
  judgeDecisionReason?: string;
}

interface InteractionLogData {
  initiatorParticipantId?: string;
  initiatorName: string;
  initiatorRole: string;
  initiatorType?: string;
  recipientParticipantId?: string;
  recipientName?: string;
  recipientRole?: string;
  recipientType?: string;
  interactionType: string;
  interactionSubject?: string;
  initiatorTranscript: string;
  recipientTranscript?: string;
  isPoliceInteraction?: boolean;
  policePersonName?: string;
  policePersonId?: string;
  policePersonRank?: string;
  policeStatement?: string;
  policeQuestionedBy?: string;
  policeQuestionedByRole?: string;
  relatedTranscriptLogIds?: string[];
}

interface ParticipantActivityData {
  participantId: string;
  userId?: string;
  participantName: string;
  participantRole: string;
  isAi?: boolean;
  isRealPerson?: boolean;
  activityType: string;
  activityDescription?: string;
  durationSeconds?: number;
  relatedTranscriptId?: string;
  relatedEvidenceId?: string;
  relatedHandRaiseId?: string;
}

export const useHearingLogger = (hearingLogId: string | null, sessionId?: string) => {
  const processingStartTimes = useRef<Map<string, number>>(new Map());

  // Start a new hearing log
  const startHearingLog = useCallback(async (data: HearingLogData): Promise<string | null> => {
    try {
      const { data: logData, error } = await supabase
        .from('hearing_logs')
        .insert({
          session_id: data.sessionId,
          case_id: data.caseId,
          user_id: data.userId,
          payment_id: data.paymentId,
          payment_transaction_number: data.paymentTransactionNumber,
          invoice_id: data.invoiceId,
          lawyer_type: data.lawyerType,
          ai_lawyer_id: data.aiLawyerId,
          actual_lawyer_id: data.actualLawyerId,
          actual_lawyer_email: data.actualLawyerEmail,
          actual_lawyer_name: data.actualLawyerName,
          addons_applied: data.addonsApplied || [],
          video_recording_id: data.videoRecordingId,
          video_recording_url: data.videoRecordingUrl,
          hearing_started_at: new Date().toISOString(),
          status: 'started',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create hearing log:', error);
        return null;
      }

      return logData.id;
    } catch (error) {
      console.error('Error starting hearing log:', error);
      return null;
    }
  }, []);

  // Update hearing log status
  const updateHearingLog = useCallback(async (
    updates: {
      status?: 'started' | 'in_progress' | 'adjourned' | 'completed' | 'cancelled';
      hearingEndedAt?: string;
      adjournedAt?: string;
      completedAt?: string;
      adjournmentReason?: string;
      completionReason?: string;
      videoRecordingId?: string;
      videoRecordingUrl?: string;
    }
  ) => {
    if (!hearingLogId) return;

    try {
      const updateData: any = {};
      
      if (updates.status) updateData.status = updates.status;
      if (updates.hearingEndedAt) updateData.hearing_ended_at = updates.hearingEndedAt;
      if (updates.adjournedAt) updateData.adjourned_at = updates.adjournedAt;
      if (updates.completedAt) updateData.completed_at = updates.completedAt;
      if (updates.adjournmentReason) updateData.adjournment_reason = updates.adjournmentReason;
      if (updates.completionReason) updateData.completion_reason = updates.completionReason;
      if (updates.videoRecordingId) updateData.video_recording_id = updates.videoRecordingId;
      if (updates.videoRecordingUrl) updateData.video_recording_url = updates.videoRecordingUrl;

      const { error } = await supabase
        .from('hearing_logs')
        .update(updateData)
        .eq('id', hearingLogId);

      if (error) {
        console.error('Failed to update hearing log:', error);
      }
    } catch (error) {
      console.error('Error updating hearing log:', error);
    }
  }, [hearingLogId]);

  // Log evidence submission
  const logEvidence = useCallback(async (data: EvidenceLogData) => {
    if (!hearingLogId || !sessionId) return;

    try {
      const { error } = await supabase
        .from('hearing_evidence_logs')
        .insert({
          hearing_log_id: hearingLogId,
          session_id: sessionId,
          evidence_submission_id: data.evidenceSubmissionId,
          submitted_by_participant_id: data.submittedByParticipantId,
          submitted_by_user_id: data.submittedByUserId,
          submitted_by_name: data.submittedByName,
          submitted_by_role: data.submittedByRole,
          submitted_by_side: data.submittedBySide,
          evidence_type: data.evidenceType,
          file_name: data.fileName,
          file_url: data.fileUrl,
          file_type: data.fileType,
          file_size_bytes: data.fileSizeBytes,
          file_hash: data.fileHash,
          ocr_text: data.ocrText,
          ai_analysis: data.aiAnalysis,
          processing_duration_seconds: data.processingDurationSeconds,
          judge_decision: data.judgeDecision,
          judge_decision_reason: data.judgeDecisionReason,
        });

      if (error) {
        console.error('Failed to log evidence:', error);
      }
    } catch (error) {
      console.error('Error logging evidence:', error);
    }
  }, [hearingLogId]);

  // Start tracking document processing time
  const startDocumentProcessing = useCallback((documentId: string) => {
    processingStartTimes.current.set(documentId, Date.now());
  }, []);

  // Log document processing step
  const logDocumentProcessing = useCallback(async (
    evidenceLogId: string,
    documentName: string,
    documentType: string,
    documentUrl: string,
    processingStep: 'upload' | 'ocr' | 'ai_analysis' | 'verification' | 'indexing' | 'other',
    documentId?: string
  ) => {
    if (!hearingLogId || !sessionId) return;

    const startTime = documentId ? processingStartTimes.current.get(documentId) : Date.now();
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
      const { error } = await supabase
        .from('hearing_document_processing_logs')
        .insert({
          hearing_log_id: hearingLogId,
          evidence_log_id: evidenceLogId,
          session_id: sessionId,
          document_name: documentName,
          document_type: documentType,
          document_url: documentUrl,
          processing_step: processingStep,
          processing_started_at: new Date(startTime || Date.now()).toISOString(),
          processing_completed_at: new Date().toISOString(),
          processing_duration_seconds: duration,
          processing_status: 'completed',
        });

      if (error) {
        console.error('Failed to log document processing:', error);
      }
    } catch (error) {
      console.error('Error logging document processing:', error);
    }
  }, [hearingLogId]);

  // Log participant activity
  const logParticipantActivity = useCallback(async (data: ParticipantActivityData) => {
    if (!hearingLogId || !sessionId) return;

    try {
      const { error } = await supabase
        .from('hearing_participant_logs')
        .insert({
          hearing_log_id: hearingLogId,
          session_id: sessionId,
          participant_id: data.participantId,
          user_id: data.userId,
          participant_name: data.participantName,
          participant_role: data.participantRole,
          is_ai: data.isAi || false,
          is_real_person: data.isRealPerson !== false,
          activity_type: data.activityType,
          activity_description: data.activityDescription,
          duration_seconds: data.durationSeconds,
          related_transcript_id: data.relatedTranscriptId,
          related_evidence_id: data.relatedEvidenceId,
          related_hand_raise_id: data.relatedHandRaiseId,
        });

      if (error) {
        console.error('Failed to log participant activity:', error);
      }
    } catch (error) {
      console.error('Error logging participant activity:', error);
    }
  }, [hearingLogId]);

  // Log interaction between participants
  const logInteraction = useCallback(async (data: InteractionLogData) => {
    if (!hearingLogId || !sessionId) return;

    try {
      const { error } = await supabase
        .from('hearing_interaction_logs')
        .insert({
          hearing_log_id: hearingLogId,
          session_id: sessionId,
          initiator_participant_id: data.initiatorParticipantId,
          initiator_name: data.initiatorName,
          initiator_role: data.initiatorRole,
          initiator_type: data.initiatorType,
          recipient_participant_id: data.recipientParticipantId,
          recipient_name: data.recipientName,
          recipient_role: data.recipientRole,
          recipient_type: data.recipientType,
          interaction_type: data.interactionType,
          interaction_subject: data.interactionSubject,
          initiator_transcript: data.initiatorTranscript,
          recipient_transcript: data.recipientTranscript,
          is_police_interaction: data.isPoliceInteraction || false,
          police_person_name: data.policePersonName,
          police_person_id: data.policePersonId,
          police_person_rank: data.policePersonRank,
          police_statement: data.policeStatement,
          police_questioned_by: data.policeQuestionedBy,
          police_questioned_by_role: data.policeQuestionedByRole,
          related_transcript_log_ids: data.relatedTranscriptLogIds,
        });

      if (error) {
        console.error('Failed to log interaction:', error);
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }, [hearingLogId, sessionId]);

  return {
    startHearingLog,
    updateHearingLog,
    logEvidence,
    startDocumentProcessing,
    logDocumentProcessing,
    logParticipantActivity,
    logInteraction,
  };
};

