-- Court Sessions table
CREATE TABLE public.court_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  court_code VARCHAR(8) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'adjourned', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  next_hearing_date TIMESTAMP WITH TIME ZONE,
  adjournment_reason TEXT,
  video_recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Court Participants table
CREATE TABLE public.court_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  participant_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('judge', 'prosecutor', 'defence_lawyer', 'accused', 'victim', 'victim_family', 'accused_family', 'witness', 'audience')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_ai BOOLEAN DEFAULT false
);

-- Court Transcript table (real-time messages)
CREATE TABLE public.court_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.court_participants(id),
  speaker_role VARCHAR(50) NOT NULL,
  speaker_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'speech' CHECK (message_type IN ('speech', 'action', 'document', 'objection', 'order', 'evidence')),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sequence_number SERIAL
);

-- Hand Raise Requests table
CREATE TABLE public.court_hand_raises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.court_participants(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'allowed', 'denied', 'completed')),
  raised_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  judge_response TEXT
);

-- Court Evidence Submissions (during hearing)
CREATE TABLE public.court_evidence_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.court_participants(id),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  ocr_text TEXT,
  ai_analysis TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_by_judge BOOLEAN
);

-- Date Extension Requests table
CREATE TABLE public.court_date_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.court_participants(id),
  reason TEXT NOT NULL,
  requested_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  judge_decision TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.court_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_hand_raises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_evidence_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_date_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for court_sessions
CREATE POLICY "Users can view court sessions for their cases" ON public.court_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = court_sessions.case_id AND cases.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Users can create court sessions for their cases" ON public.court_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = court_sessions.case_id AND cases.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Users can update their court sessions" ON public.court_sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = court_sessions.case_id AND cases.user_id = auth.uid())
    OR public.is_admin()
  );

-- Anyone with court code can view session (for joining)
CREATE POLICY "Anyone can view session with court code" ON public.court_sessions
  FOR SELECT USING (true);

-- RLS for participants - anyone in session can view
CREATE POLICY "Participants can view other participants" ON public.court_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join sessions" ON public.court_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);

CREATE POLICY "Users can update their participation" ON public.court_participants
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- RLS for transcripts
CREATE POLICY "Anyone can view transcripts of active sessions" ON public.court_transcripts
  FOR SELECT USING (true);

CREATE POLICY "Participants can add transcripts" ON public.court_transcripts
  FOR INSERT WITH CHECK (true);

-- RLS for hand raises
CREATE POLICY "Anyone can view hand raises" ON public.court_hand_raises
  FOR SELECT USING (true);

CREATE POLICY "Participants can raise hand" ON public.court_hand_raises
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update hand raises" ON public.court_hand_raises
  FOR UPDATE USING (public.is_admin() OR true);

-- RLS for evidence submissions
CREATE POLICY "Anyone can view evidence" ON public.court_evidence_submissions
  FOR SELECT USING (true);

CREATE POLICY "Participants can submit evidence" ON public.court_evidence_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update evidence" ON public.court_evidence_submissions
  FOR UPDATE USING (public.is_admin() OR true);

-- RLS for date requests
CREATE POLICY "Anyone can view date requests" ON public.court_date_requests
  FOR SELECT USING (true);

CREATE POLICY "Participants can request dates" ON public.court_date_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Judge can update requests" ON public.court_date_requests
  FOR UPDATE USING (true);

-- Enable realtime for court tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_transcripts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_hand_raises;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_evidence_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_date_requests;

-- Function to generate unique court code
CREATE OR REPLACE FUNCTION generate_court_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(8) := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;