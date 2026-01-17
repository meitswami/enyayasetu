import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CaseDetails, CourtParticipant, HandRaise, DateRequest, EvidenceSubmission } from '../types';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseAIJudgeProps {
  caseDetails: CaseDetails | null;
  addAITranscript: (message: string, speakerName?: string, messageType?: string) => Promise<void>;
}

export const useAIJudge = ({ caseDetails, addAITranscript }: UseAIJudgeProps) => {
  const { language } = useLanguage();

  const getCaseContext = useCallback(() => {
    if (!caseDetails) return '';
    
    return `Case Number: ${caseDetails.case_number}
Title: ${caseDetails.title}
Plaintiff: ${caseDetails.plaintiff}
Defendant: ${caseDetails.defendant}
Category: ${caseDetails.category || 'General'}
Description: ${caseDetails.description || 'Not provided'}`;
  }, [caseDetails]);

  const callAIJudge = useCallback(async (action: string, additionalParams: Record<string, any> = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-judge', {
        body: {
          action,
          caseContext: getCaseContext(),
          language,
          ...additionalParams,
        },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('AI Judge error:', err);
      return null;
    }
  }, [getCaseContext, language]);

  // Start session
  const startSession = useCallback(async () => {
    const result = await callAIJudge('start_session');
    if (result?.response) {
      await addAITranscript(result.response, 'Hon. AI Judge', 'speech');
    }
    return result;
  }, [callAIJudge, addAITranscript]);

  // Respond to participant speech
  const respondToSpeech = useCallback(async (
    speaker: CourtParticipant,
    message: string
  ) => {
    const result = await callAIJudge('respond_to_speech', {
      currentSpeaker: `${speaker.participant_name} (${speaker.role})`,
      message,
    });
    
    if (result?.response) {
      await addAITranscript(result.response, 'Hon. AI Judge', 'speech');
    }
    return result;
  }, [callAIJudge, addAITranscript]);

  // Evaluate hand raise
  const evaluateHandRaise = useCallback(async (
    handRaise: HandRaise
  ): Promise<{ allowed: boolean; response: string } | null> => {
    const result = await callAIJudge('evaluate_hand_raise', {
      handRaise: {
        participantName: handRaise.participant?.participant_name,
        role: handRaise.participant?.role,
        reason: handRaise.reason,
      },
    });

    if (result?.response) {
      const decision = typeof result.response === 'object' 
        ? result.response 
        : { allowed: true, response: result.response };
      
      // Add transcript
      const announcement = decision.allowed
        ? `${handRaise.participant?.participant_name}, you may proceed.${decision.response ? ` ${decision.response}` : ''}`
        : `${handRaise.participant?.participant_name}, request denied.${decision.response ? ` ${decision.response}` : ''}`;
      
      await addAITranscript(announcement, 'Hon. AI Judge', 'order');
      return decision;
    }
    return null;
  }, [callAIJudge, addAITranscript]);

  // Evaluate date extension request
  const evaluateDateRequest = useCallback(async (
    request: DateRequest
  ): Promise<{ approved: boolean; decision: string; nextDate?: string } | null> => {
    const result = await callAIJudge('evaluate_date_extension', {
      dateRequest: {
        requesterName: request.requester?.participant_name,
        role: request.requester?.role,
        reason: request.reason,
        requestedDate: request.requested_date,
      },
    });

    if (result?.response) {
      const decision = typeof result.response === 'object' 
        ? result.response 
        : { approved: false, decision: result.response };
      
      // Add formal transcript
      const announcement = decision.approved
        ? `The court grants the date extension request. ${decision.decision}${decision.nextDate ? ` Next hearing: ${decision.nextDate}` : ''}`
        : `The court denies the date extension request. ${decision.decision} Proceedings shall continue.`;
      
      await addAITranscript(announcement, 'Hon. AI Judge', 'order');
      return decision;
    }
    return null;
  }, [callAIJudge, addAITranscript]);

  // Analyze evidence
  const analyzeEvidence = useCallback(async (
    evidence: EvidenceSubmission
  ) => {
    const result = await callAIJudge('analyze_evidence', {
      evidence: {
        submitter: evidence.participant?.participant_name,
        fileName: evidence.file_name,
        fileType: evidence.file_type,
        ocrText: evidence.ocr_text,
      },
    });

    if (result?.response) {
      await addAITranscript(result.response, 'Hon. AI Judge', 'evidence');
    }
    return result;
  }, [callAIJudge, addAITranscript]);

  // Make final decision
  const makeDecision = useCallback(async () => {
    const result = await callAIJudge('make_decision');
    if (result?.response) {
      await addAITranscript(result.response, 'Hon. AI Judge', 'order');
    }
    return result;
  }, [callAIJudge, addAITranscript]);

  // Adjourn session
  const adjournSession = useCallback(async () => {
    const result = await callAIJudge('adjourn_session');
    if (result?.response) {
      await addAITranscript(result.response, 'Hon. AI Judge', 'action');
    }
    return result;
  }, [callAIJudge, addAITranscript]);

  // Evaluate witness request
  const evaluateWitnessRequest = useCallback(async (witnessRequest: {
    id: string;
    witnessName: string;
    description?: string;
    relevance: string;
    requesterName: string;
    role: string;
  }) => {
    const result = await callAIJudge('evaluate_witness_request', { witnessRequest });
    
    if (result?.response) {
      await addAITranscript(result.response, 'AI Judge', 'order');
    }
    
    return result;
  }, [callAIJudge, addAITranscript]);

  return {
    startSession,
    respondToSpeech,
    evaluateHandRaise,
    evaluateDateRequest,
    analyzeEvidence,
    makeDecision,
    adjournSession,
    evaluateWitnessRequest,
  };
};
