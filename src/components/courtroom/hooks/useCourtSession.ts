import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  CourtSession, 
  CourtParticipant, 
  CourtTranscript, 
  HandRaise, 
  EvidenceSubmission, 
  DateRequest,
  WitnessRequest,
  ParticipantRole,
  CaseDetails
} from '../types';
import { toast } from 'sonner';

export const useCourtSession = (sessionId: string | null, userId?: string) => {
  const [session, setSession] = useState<CourtSession | null>(null);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [participants, setParticipants] = useState<CourtParticipant[]>([]);
  const [transcripts, setTranscripts] = useState<CourtTranscript[]>([]);
  const [handRaises, setHandRaises] = useState<HandRaise[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSubmission[]>([]);
  const [dateRequests, setDateRequests] = useState<DateRequest[]>([]);
  const [witnessRequests, setWitnessRequests] = useState<WitnessRequest[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<CourtParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // Fetch session and case details
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    const { data: sessionData, error: sessionError } = await supabase
      .from('court_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return;
    }

    setSession(sessionData as unknown as CourtSession);

    // Fetch case details
    const { data: caseData } = await supabase
      .from('cases')
      .select('id, case_number, title, plaintiff, defendant, description, category, status, user_role')
      .eq('id', sessionData.case_id)
      .single();

    if (caseData) {
      setCaseDetails(caseData as unknown as CaseDetails);
    }
  }, [sessionId]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('court_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at');

    if (!error && data) {
      setParticipants(data as unknown as CourtParticipant[]);
      
      // Find current user's participant record
      if (userId) {
        const myParticipant = data.find(p => p.user_id === userId);
        setCurrentParticipant(myParticipant as unknown as CourtParticipant || null);
      }
    }
  }, [sessionId, userId]);

  // Fetch transcripts
  const fetchTranscripts = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('court_transcripts')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence_number');

    if (!error && data) {
      setTranscripts(data as unknown as CourtTranscript[]);
    }
  }, [sessionId]);

  // Fetch hand raises with participant info
  const fetchHandRaises = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('court_hand_raises')
      .select('*, participant:court_participants(*)')
      .eq('session_id', sessionId)
      .order('raised_at', { ascending: false });

    if (!error && data) {
      setHandRaises(data.map(h => ({
        ...h,
        participant: h.participant as unknown as CourtParticipant
      })) as unknown as HandRaise[]);
    }
  }, [sessionId]);

  // Fetch evidence
  const fetchEvidence = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('court_evidence_submissions')
      .select('*, participant:court_participants(*)')
      .eq('session_id', sessionId)
      .order('submitted_at');

    if (!error && data) {
      setEvidence(data.map(e => ({
        ...e,
        participant: e.participant as unknown as CourtParticipant
      })) as unknown as EvidenceSubmission[]);
    }
  }, [sessionId]);

  // Fetch date requests
  const fetchDateRequests = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('court_date_requests')
      .select('*, requester:court_participants(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDateRequests(data.map(d => ({
        ...d,
        requester: d.requester as unknown as CourtParticipant
      })) as unknown as DateRequest[]);
    }
  }, [sessionId]);

  // Fetch witness requests
  const fetchWitnessRequests = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('court_witness_requests')
      .select('*, requester:court_participants!requested_by(*)')
      .eq('session_id', sessionId)
      .order('requested_at', { ascending: false });

    if (!error && data) {
      setWitnessRequests(data.map(w => ({
        ...w,
        requester: w.requester as unknown as CourtParticipant
      })) as unknown as WitnessRequest[]);
    }
  }, [sessionId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!sessionId) return;

    setLoading(true);
    
    // Initial fetch
    Promise.all([
      fetchSession(),
      fetchParticipants(),
      fetchTranscripts(),
      fetchHandRaises(),
      fetchEvidence(),
      fetchDateRequests(),
      fetchWitnessRequests(),
    ]).finally(() => setLoading(false));

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`court-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_sessions',
        filter: `id=eq.${sessionId}`,
      }, () => fetchSession())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_participants',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchParticipants())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_transcripts',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchTranscripts())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_hand_raises',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchHandRaises())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_evidence_submissions',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchEvidence())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_date_requests',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchDateRequests())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'court_witness_requests',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchWitnessRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Join session as participant
  const joinSession = async (name: string, role: ParticipantRole) => {
    if (!sessionId) return null;

    const { data, error } = await supabase
      .from('court_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        participant_name: name,
        role,
        is_ai: false,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to join session');
      return null;
    }

    setCurrentParticipant(data as unknown as CourtParticipant);
    return data;
  };

  // Leave session
  const leaveSession = async () => {
    if (!currentParticipant) return;

    await supabase
      .from('court_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('id', currentParticipant.id);

    setCurrentParticipant(null);
  };

  // Add transcript
  const addTranscript = async (
    message: string, 
    messageType: CourtTranscript['message_type'] = 'speech'
  ) => {
    if (!sessionId || !currentParticipant) return;

    const { error } = await supabase
      .from('court_transcripts')
      .insert({
        session_id: sessionId,
        participant_id: currentParticipant.id,
        speaker_role: currentParticipant.role,
        speaker_name: currentParticipant.participant_name,
        message,
        message_type: messageType,
      });

    if (error) {
      toast.error('Failed to add transcript');
    }
  };

  // Add AI transcript (for judge)
  const addAITranscript = async (
    message: string, 
    speakerName: string = 'AI Judge',
    messageType: CourtTranscript['message_type'] = 'speech'
  ) => {
    if (!sessionId) return;

    const { error } = await supabase
      .from('court_transcripts')
      .insert({
        session_id: sessionId,
        speaker_role: 'judge',
        speaker_name: speakerName,
        message,
        message_type: messageType,
      });

    if (error) {
      console.error('Failed to add AI transcript:', error);
    }
  };

  // Raise hand
  const raiseHand = async (reason: string) => {
    if (!sessionId || !currentParticipant) return;

    const { error } = await supabase
      .from('court_hand_raises')
      .insert({
        session_id: sessionId,
        participant_id: currentParticipant.id,
        reason,
      });

    if (error) {
      toast.error('Failed to raise hand');
    } else {
      toast.info('Hand raised, waiting for judge...');
    }
  };

  // Respond to hand raise
  const respondToHandRaise = async (raiseId: string, allowed: boolean, response?: string) => {
    const { error } = await supabase
      .from('court_hand_raises')
      .update({
        status: allowed ? 'allowed' : 'denied',
        responded_at: new Date().toISOString(),
        judge_response: response,
      })
      .eq('id', raiseId);

    if (error) {
      toast.error('Failed to respond');
    }
  };

  // Request date extension
  const requestDateExtension = async (reason: string, requestedDate?: string) => {
    if (!sessionId || !currentParticipant) return;

    const { error } = await supabase
      .from('court_date_requests')
      .insert({
        session_id: sessionId,
        requested_by: currentParticipant.id,
        reason,
        requested_date: requestedDate,
      });

    if (error) {
      toast.error('Failed to submit request');
    } else {
      toast.info('Date extension requested');
    }
  };

  // Decide on date request
  const decideDateRequest = async (requestId: string, approved: boolean, decision: string, nextDate?: string) => {
    const { error } = await supabase
      .from('court_date_requests')
      .update({
        status: approved ? 'approved' : 'denied',
        judge_decision: decision,
        decided_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (approved && nextDate && session) {
      await supabase
        .from('court_sessions')
        .update({ next_hearing_date: nextDate })
        .eq('id', session.id);
    }

    if (error) {
      toast.error('Failed to record decision');
    }
  };

  // Upload evidence
  const uploadEvidence = async (file: File): Promise<EvidenceSubmission | null> => {
    if (!sessionId || !currentParticipant) return null;

    // Upload file to storage
    const fileName = `${sessionId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('evidence')
      .getPublicUrl(fileName);

    // OCR processing if it's a document/image
    let ocrText = '';
    if (file.type.includes('image') || file.type.includes('pdf')) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const { data: ocrData } = await supabase.functions.invoke('ocr-document', {
          body: formData,
        });

        ocrText = ocrData?.text || '';
      } catch (e) {
        console.log('OCR failed:', e);
      }
    }

    // Save evidence record
    const { data, error } = await supabase
      .from('court_evidence_submissions')
      .insert({
        session_id: sessionId,
        participant_id: currentParticipant.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        ocr_text: ocrText,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to record evidence');
      return null;
    }

    toast.success('Evidence submitted for review');
    return data as unknown as EvidenceSubmission;
  };

  // Accept/reject evidence
  const decideEvidence = async (evidenceId: string, accepted: boolean, analysis?: string) => {
    const { error } = await supabase
      .from('court_evidence_submissions')
      .update({
        accepted_by_judge: accepted,
        ai_analysis: analysis,
      })
      .eq('id', evidenceId);

    if (error) {
      toast.error('Failed to process evidence');
    }
  };

  // Update session status
  const updateSessionStatus = async (status: CourtSession['status'], reason?: string) => {
    if (!session) return;

    const updates: Partial<CourtSession> = { status };
    
    if (status === 'in_progress' && !session.started_at) {
      updates.started_at = new Date().toISOString();
    }
    
    if (status === 'completed' || status === 'adjourned') {
      updates.ended_at = new Date().toISOString();
      if (reason) {
        updates.adjournment_reason = reason;
      }
    }

    const { error } = await supabase
      .from('court_sessions')
      .update(updates)
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update session');
    }
  };

  // Request witness
  const requestWitness = async (name: string, description: string, relevance: string) => {
    if (!sessionId || !currentParticipant) return;

    const { error } = await supabase
      .from('court_witness_requests')
      .insert({
        session_id: sessionId,
        requested_by: currentParticipant.id,
        witness_name: name,
        witness_description: description,
        relevance,
      });

    if (error) {
      toast.error('Failed to request witness');
    } else {
      toast.info('Witness request submitted');
    }
  };

  // Respond to witness request
  const respondToWitnessRequest = async (requestId: string, summoned: boolean, response?: string) => {
    const { error } = await supabase
      .from('court_witness_requests')
      .update({
        status: summoned ? 'summoned' : 'denied',
        responded_at: new Date().toISOString(),
        judge_response: response,
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to respond to witness request');
    }
  };

  // Mark witness as testified
  const markWitnessTestified = async (requestId: string) => {
    const { error } = await supabase
      .from('court_witness_requests')
      .update({
        status: 'testified',
        testified_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to update witness status');
    }
  };

  return {
    session,
    caseDetails,
    participants,
    transcripts,
    handRaises,
    evidence,
    dateRequests,
    witnessRequests,
    currentParticipant,
    loading,
    isRecording,
    setIsRecording,
    joinSession,
    leaveSession,
    addTranscript,
    addAITranscript,
    raiseHand,
    respondToHandRaise,
    requestDateExtension,
    decideDateRequest,
    uploadEvidence,
    decideEvidence,
    updateSessionStatus,
    requestWitness,
    respondToWitnessRequest,
    markWitnessTestified,
  };
};
