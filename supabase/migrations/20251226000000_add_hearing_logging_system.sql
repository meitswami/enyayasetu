-- Comprehensive Hearing Logging System Migration
-- This migration creates tables to log all details of court hearings

-- Main hearing log table - tracks overall hearing session details
CREATE TABLE public.hearing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment and billing information
  payment_id UUID REFERENCES public.payments(id),
  payment_transaction_number TEXT,
  invoice_id UUID REFERENCES public.invoices(id),
  
  -- Lawyer information
  lawyer_type TEXT CHECK (lawyer_type IN ('ai_lawyer', 'actual_lawyer')),
  ai_lawyer_id TEXT, -- AI lawyer identifier if used
  actual_lawyer_id TEXT, -- Real lawyer ID if used
  actual_lawyer_email TEXT,
  actual_lawyer_name TEXT,
  
  -- Add-ons applied to this hearing
  addons_applied JSONB DEFAULT '[]'::jsonb, -- Array of addon IDs and details
  
  -- Timing information
  hearing_started_at TIMESTAMPTZ,
  hearing_ended_at TIMESTAMPTZ,
  total_duration_seconds INTEGER, -- Calculated duration in seconds
  adjourned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Video recording
  video_recording_id TEXT,
  video_recording_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'adjourned', 'completed', 'cancelled')),
  adjournment_reason TEXT,
  completion_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional flexible data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Detailed transcript log table - logs every spoken word and interaction
CREATE TABLE public.hearing_transcript_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_log_id UUID NOT NULL REFERENCES public.hearing_logs(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES public.court_transcripts(id),
  
  -- Speaker information
  participant_id UUID REFERENCES public.court_participants(id),
  speaker_role TEXT NOT NULL,
  speaker_name TEXT NOT NULL,
  speaker_type TEXT CHECK (speaker_type IN ('judge', 'lawyer', 'prosecutor', 'defence_lawyer', 'accused', 'victim', 'witness', 'police', 'steno', 'audience', 'other')),
  is_ai_speaker BOOLEAN DEFAULT false,
  is_real_person BOOLEAN DEFAULT true,
  
  -- Transcript content
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'speech' CHECK (message_type IN ('speech', 'action', 'document', 'objection', 'order', 'evidence', 'question', 'answer', 'statement')),
  
  -- Timing
  spoken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER, -- How long it took to speak this message
  
  -- Audio/Video
  audio_url TEXT,
  video_timestamp_seconds INTEGER, -- Timestamp in video recording
  
  -- Context
  context_before TEXT, -- What was said before
  context_after TEXT, -- What was said after
  sequence_number INTEGER NOT NULL,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidence and media submission log table
CREATE TABLE public.hearing_evidence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_log_id UUID NOT NULL REFERENCES public.hearing_logs(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  evidence_submission_id UUID REFERENCES public.court_evidence_submissions(id),
  
  -- Submitter information
  submitted_by_participant_id UUID REFERENCES public.court_participants(id),
  submitted_by_user_id UUID REFERENCES auth.users(id),
  submitted_by_name TEXT NOT NULL,
  submitted_by_role TEXT NOT NULL,
  submitted_by_side TEXT CHECK (submitted_by_side IN ('plaintiff', 'defendant', 'court', 'other')),
  
  -- Evidence details
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('document', 'image', 'video', 'audio', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_hash TEXT, -- For integrity verification
  
  -- Processing information
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_seconds INTEGER, -- Time taken to process (OCR, analysis, etc.)
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- OCR and AI Analysis
  ocr_text TEXT,
  ai_analysis TEXT,
  ai_analysis_duration_seconds INTEGER,
  
  -- Judge decision
  judge_decision TEXT CHECK (judge_decision IN ('accepted', 'rejected', 'pending')),
  judge_decision_at TIMESTAMPTZ,
  judge_decision_reason TEXT,
  
  -- Presentation details
  presented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  presentation_duration_seconds INTEGER, -- How long it was presented/discussed
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participant activity log table - tracks all participant actions
CREATE TABLE public.hearing_participant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_log_id UUID NOT NULL REFERENCES public.hearing_logs(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.court_participants(id) ON DELETE CASCADE,
  
  -- Participant information
  user_id UUID REFERENCES auth.users(id),
  participant_name TEXT NOT NULL,
  participant_role TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  is_real_person BOOLEAN DEFAULT true,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN ('joined', 'left', 'spoke', 'raised_hand', 'submitted_evidence', 'objected', 'requested_date', 'requested_witness', 'reacted', 'other')),
  activity_description TEXT,
  
  -- Timing
  activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER, -- Duration of activity if applicable
  
  -- Related entities
  related_transcript_id UUID REFERENCES public.hearing_transcript_logs(id),
  related_evidence_id UUID REFERENCES public.hearing_evidence_logs(id),
  related_hand_raise_id UUID REFERENCES public.court_hand_raises(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interaction log table - tracks interactions between participants (police, lawyers, etc.)
CREATE TABLE public.hearing_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_log_id UUID NOT NULL REFERENCES public.hearing_logs(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  
  -- Interaction participants
  initiator_participant_id UUID REFERENCES public.court_participants(id),
  initiator_name TEXT NOT NULL,
  initiator_role TEXT NOT NULL,
  initiator_type TEXT CHECK (initiator_type IN ('judge', 'lawyer', 'prosecutor', 'defence_lawyer', 'police', 'witness', 'accused', 'victim', 'other')),
  
  recipient_participant_id UUID REFERENCES public.court_participants(id),
  recipient_name TEXT,
  recipient_role TEXT,
  recipient_type TEXT,
  
  -- Interaction details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('question', 'answer', 'objection', 'order', 'request', 'response', 'statement', 'cross_examination', 'direct_examination', 'other')),
  interaction_subject TEXT, -- What the interaction is about
  
  -- Transcripts
  initiator_transcript TEXT NOT NULL, -- What initiator said
  recipient_transcript TEXT, -- What recipient said (if any)
  
  -- Police person specific (if applicable)
  is_police_interaction BOOLEAN DEFAULT false,
  police_person_name TEXT,
  police_person_id TEXT,
  police_person_rank TEXT,
  police_statement TEXT, -- Full statement from police
  police_questioned_by TEXT, -- Who questioned the police (judge/lawyer)
  police_questioned_by_role TEXT,
  
  -- Timing
  interaction_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  interaction_ended_at TIMESTAMPTZ,
  interaction_duration_seconds INTEGER,
  
  -- Related entities
  related_transcript_log_ids UUID[], -- Array of transcript log IDs related to this interaction
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document processing log table - tracks time taken to process each document
CREATE TABLE public.hearing_document_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_log_id UUID NOT NULL REFERENCES public.hearing_logs(id) ON DELETE CASCADE,
  evidence_log_id UUID REFERENCES public.hearing_evidence_logs(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  
  -- Document information
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_size_bytes BIGINT,
  
  -- Processing steps
  processing_step TEXT NOT NULL CHECK (processing_step IN ('upload', 'ocr', 'ai_analysis', 'verification', 'indexing', 'other')),
  processing_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_completed_at TIMESTAMPTZ,
  processing_duration_seconds INTEGER,
  processing_status TEXT DEFAULT 'processing' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Results
  processing_result JSONB, -- Step-specific results
  output_text TEXT, -- Extracted/processed text
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_hearing_logs_session_id ON public.hearing_logs(session_id);
CREATE INDEX idx_hearing_logs_case_id ON public.hearing_logs(case_id);
CREATE INDEX idx_hearing_logs_user_id ON public.hearing_logs(user_id);
CREATE INDEX idx_hearing_logs_status ON public.hearing_logs(status);
CREATE INDEX idx_hearing_logs_created_at ON public.hearing_logs(created_at DESC);

CREATE INDEX idx_transcript_logs_hearing_log_id ON public.hearing_transcript_logs(hearing_log_id);
CREATE INDEX idx_transcript_logs_session_id ON public.hearing_transcript_logs(session_id);
CREATE INDEX idx_transcript_logs_participant_id ON public.hearing_transcript_logs(participant_id);
CREATE INDEX idx_transcript_logs_spoken_at ON public.hearing_transcript_logs(spoken_at);
CREATE INDEX idx_transcript_logs_speaker_type ON public.hearing_transcript_logs(speaker_type);

CREATE INDEX idx_evidence_logs_hearing_log_id ON public.hearing_evidence_logs(hearing_log_id);
CREATE INDEX idx_evidence_logs_session_id ON public.hearing_evidence_logs(session_id);
CREATE INDEX idx_evidence_logs_submitted_by ON public.hearing_evidence_logs(submitted_by_participant_id);
CREATE INDEX idx_evidence_logs_presented_at ON public.hearing_evidence_logs(presented_at);

CREATE INDEX idx_participant_logs_hearing_log_id ON public.hearing_participant_logs(hearing_log_id);
CREATE INDEX idx_participant_logs_session_id ON public.hearing_participant_logs(session_id);
CREATE INDEX idx_participant_logs_participant_id ON public.hearing_participant_logs(participant_id);
CREATE INDEX idx_participant_logs_activity_type ON public.hearing_participant_logs(activity_type);

CREATE INDEX idx_interaction_logs_hearing_log_id ON public.hearing_interaction_logs(hearing_log_id);
CREATE INDEX idx_interaction_logs_session_id ON public.hearing_interaction_logs(session_id);
CREATE INDEX idx_interaction_logs_initiator ON public.hearing_interaction_logs(initiator_participant_id);
CREATE INDEX idx_interaction_logs_recipient ON public.hearing_interaction_logs(recipient_participant_id);
CREATE INDEX idx_interaction_logs_police ON public.hearing_interaction_logs(is_police_interaction) WHERE is_police_interaction = true;

CREATE INDEX idx_document_processing_logs_hearing_log_id ON public.hearing_document_processing_logs(hearing_log_id);
CREATE INDEX idx_document_processing_logs_evidence_log_id ON public.hearing_document_processing_logs(evidence_log_id);
CREATE INDEX idx_document_processing_logs_processing_step ON public.hearing_document_processing_logs(processing_step);

-- Function to automatically calculate duration when hearing ends
CREATE OR REPLACE FUNCTION calculate_hearing_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hearing_ended_at IS NOT NULL AND NEW.hearing_started_at IS NOT NULL THEN
    NEW.total_duration_seconds := EXTRACT(EPOCH FROM (NEW.hearing_ended_at - NEW.hearing_started_at))::INTEGER;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_hearing_duration_trigger
  BEFORE INSERT OR UPDATE ON public.hearing_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_hearing_duration();

-- Function to automatically log transcript when court_transcript is created
CREATE OR REPLACE FUNCTION log_court_transcript()
RETURNS TRIGGER AS $$
DECLARE
  v_hearing_log_id UUID;
  v_participant_record RECORD;
BEGIN
  -- Find the active hearing log for this session
  SELECT id INTO v_hearing_log_id
  FROM public.hearing_logs
  WHERE session_id = NEW.session_id
    AND status IN ('started', 'in_progress')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active hearing log, try to find the most recent one
  IF v_hearing_log_id IS NULL THEN
    SELECT id INTO v_hearing_log_id
    FROM public.hearing_logs
    WHERE session_id = NEW.session_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- Only log if we have a hearing log ID
  IF v_hearing_log_id IS NOT NULL THEN
    -- Get participant details if participant_id exists
    IF NEW.participant_id IS NOT NULL THEN
      SELECT * INTO v_participant_record
      FROM public.court_participants
      WHERE id = NEW.participant_id;
    END IF;
    
    -- Insert into transcript log
    INSERT INTO public.hearing_transcript_logs (
      hearing_log_id,
      session_id,
      transcript_id,
      participant_id,
      speaker_role,
      speaker_name,
      speaker_type,
      is_ai_speaker,
      is_real_person,
      message,
      message_type,
      spoken_at,
      sequence_number,
      audio_url
    ) VALUES (
      v_hearing_log_id,
      NEW.session_id,
      NEW.id,
      NEW.participant_id,
      NEW.speaker_role,
      NEW.speaker_name,
      CASE 
        WHEN NEW.speaker_role = 'judge' THEN 'judge'
        WHEN NEW.speaker_role IN ('prosecutor', 'defence_lawyer') THEN 'lawyer'
        WHEN NEW.speaker_role = 'witness' THEN 'witness'
        ELSE 'other'
      END,
      COALESCE(v_participant_record.is_ai, false),
      COALESCE(NOT COALESCE(v_participant_record.is_ai, false), true),
      NEW.message,
      NEW.message_type,
      NEW.created_at,
      NEW.sequence_number,
      NEW.audio_url
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_court_transcript_trigger
  AFTER INSERT ON public.court_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION log_court_transcript();

-- Enable RLS
ALTER TABLE public.hearing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_transcript_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_evidence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_participant_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_document_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hearing_logs
CREATE POLICY "Users can view their own hearing logs" ON public.hearing_logs
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create hearing logs for their cases" ON public.hearing_logs
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update their hearing logs" ON public.hearing_logs
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- RLS Policies for transcript logs
CREATE POLICY "Users can view transcript logs for their hearings" ON public.hearing_transcript_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hearing_logs 
      WHERE hearing_logs.id = hearing_transcript_logs.hearing_log_id 
      AND hearing_logs.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- RLS Policies for evidence logs
CREATE POLICY "Users can view evidence logs for their hearings" ON public.hearing_evidence_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hearing_logs 
      WHERE hearing_logs.id = hearing_evidence_logs.hearing_log_id 
      AND hearing_logs.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- RLS Policies for participant logs
CREATE POLICY "Users can view participant logs for their hearings" ON public.hearing_participant_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hearing_logs 
      WHERE hearing_logs.id = hearing_participant_logs.hearing_log_id 
      AND hearing_logs.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- RLS Policies for interaction logs
CREATE POLICY "Users can view interaction logs for their hearings" ON public.hearing_interaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hearing_logs 
      WHERE hearing_logs.id = hearing_interaction_logs.hearing_log_id 
      AND hearing_logs.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- RLS Policies for document processing logs
CREATE POLICY "Users can view document processing logs for their hearings" ON public.hearing_document_processing_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hearing_logs 
      WHERE hearing_logs.id = hearing_document_processing_logs.hearing_log_id 
      AND hearing_logs.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Enable realtime for logging tables (optional, for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.hearing_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hearing_transcript_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hearing_evidence_logs;

