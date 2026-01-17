export type CourtPartyRole = 
  | 'audience'
  | 'judge'
  | 'steno'
  | 'public_prosecutor'
  | 'defence_lawyer'
  | 'pp_assistant'
  | 'defence_assistant'
  | 'accused'
  | 'victim'
  | 'victim_family'
  | 'accused_family'
  | 'police_staff';

export type CaseStatus = 'pending' | 'in_progress' | 'adjourned' | 'verdict_delivered' | 'closed';

export type EvidenceParty = 'prosecution' | 'defence' | 'court' | 'police';

// Roles that are AI-controlled (virtual)
export const AI_CONTROLLED_ROLES: CourtPartyRole[] = [
  'judge',
  'steno',
  'public_prosecutor',
  'defence_lawyer',
  'pp_assistant',
  'defence_assistant',
];

// Roles that are human-controlled (real, talkable)
export const HUMAN_CONTROLLED_ROLES: CourtPartyRole[] = [
  'audience',
  'accused',
  'victim',
  'victim_family',
  'accused_family',
  'police_staff',
];

export const ROLE_LABELS: Record<CourtPartyRole, { en: string; hi: string; hinglish: string }> = {
  audience: { en: 'Audience', hi: 'दर्शक', hinglish: 'Audience' },
  judge: { en: 'Judge (AI)', hi: 'न्यायाधीश (AI)', hinglish: 'Judge (AI)' },
  steno: { en: 'Stenographer (AI)', hi: 'आशुलिपिक (AI)', hinglish: 'Steno (AI)' },
  public_prosecutor: { en: 'Public Prosecutor (AI)', hi: 'सरकारी वकील (AI)', hinglish: 'PP (AI)' },
  defence_lawyer: { en: 'Defence Lawyer (AI)', hi: 'बचाव पक्ष वकील (AI)', hinglish: 'Defence Lawyer (AI)' },
  pp_assistant: { en: 'PP Assistant (AI)', hi: 'PP सहायक (AI)', hinglish: 'PP Assistant (AI)' },
  defence_assistant: { en: 'Defence Assistant (AI)', hi: 'बचाव सहायक (AI)', hinglish: 'Defence Assistant (AI)' },
  accused: { en: 'Accused', hi: 'आरोपी', hinglish: 'Accused' },
  victim: { en: 'Victim', hi: 'पीड़ित', hinglish: 'Victim' },
  victim_family: { en: 'Victim Family', hi: 'पीड़ित परिवार', hinglish: 'Victim Family' },
  accused_family: { en: 'Accused Family', hi: 'आरोपी परिवार', hinglish: 'Accused Family' },
  police_staff: { en: 'Police Staff', hi: 'पुलिस कर्मी', hinglish: 'Police Staff' },
};

export interface CaseEvidence {
  id: string;
  case_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_hash?: string;
  provided_by: EvidenceParty;
  description?: string;
  ai_analysis?: string;
  created_at: string;
}

export interface HearingTranscript {
  id: string;
  session_id: string;
  speaker_role: CourtPartyRole;
  speaker_name: string;
  message: string;
  is_ai_generated: boolean;
  voice_recording_url?: string;
  sequence_number: number;
  created_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  case_number: string;
  title: string;
  description?: string;
  plaintiff: string;
  defendant: string;
  category: string;
  status: CaseStatus;
  user_role: CourtPartyRole;
  next_hearing_date?: string;
  verdict?: string;
  created_at: string;
  updated_at: string;
}
