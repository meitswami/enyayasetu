// Courtroom types
export interface CourtSession {
  id: string;
  case_id: string;
  court_code: string;
  status: 'scheduled' | 'in_progress' | 'adjourned' | 'completed';
  started_at?: string;
  ended_at?: string;
  next_hearing_date?: string;
  adjournment_reason?: string;
  video_recording_url?: string;
  created_at: string;
  created_by?: string;
}

export interface CourtParticipant {
  id: string;
  session_id: string;
  user_id?: string;
  participant_name: string;
  role: ParticipantRole;
  joined_at: string;
  left_at?: string;
  is_active: boolean;
  is_ai: boolean;
}

export type ParticipantRole = 
  | 'judge' 
  | 'prosecutor' 
  | 'defence_lawyer' 
  | 'accused' 
  | 'victim' 
  | 'victim_family' 
  | 'accused_family' 
  | 'witness' 
  | 'audience';

export interface CourtTranscript {
  id: string;
  session_id: string;
  participant_id?: string;
  speaker_role: string;
  speaker_name: string;
  message: string;
  message_type: 'speech' | 'action' | 'document' | 'objection' | 'order' | 'evidence';
  audio_url?: string;
  created_at: string;
  sequence_number: number;
}

export interface HandRaise {
  id: string;
  session_id: string;
  participant_id: string;
  participant?: CourtParticipant;
  reason?: string;
  status: 'pending' | 'allowed' | 'denied' | 'completed';
  raised_at: string;
  responded_at?: string;
  judge_response?: string;
}

export interface EvidenceSubmission {
  id: string;
  session_id: string;
  participant_id: string;
  participant?: CourtParticipant;
  file_name: string;
  file_url: string;
  file_type: string;
  ocr_text?: string;
  ai_analysis?: string;
  submitted_at: string;
  accepted_by_judge?: boolean;
}

export interface DateRequest {
  id: string;
  session_id: string;
  requested_by: string;
  requester?: CourtParticipant;
  reason: string;
  requested_date?: string;
  status: 'pending' | 'approved' | 'denied';
  judge_decision?: string;
  created_at: string;
  decided_at?: string;
}

export interface WitnessRequest {
  id: string;
  session_id: string;
  requested_by: string;
  requester?: CourtParticipant;
  witness_name: string;
  witness_description?: string;
  relevance: string;
  status: 'pending' | 'summoned' | 'denied' | 'present' | 'testified';
  judge_response?: string;
  requested_at: string;
  responded_at?: string;
  testified_at?: string;
}

export interface CaseDetails {
  id: string;
  case_number: string;
  title: string;
  plaintiff: string;
  defendant: string;
  description?: string;
  category?: string;
  status?: string;
  user_role: string;
}
