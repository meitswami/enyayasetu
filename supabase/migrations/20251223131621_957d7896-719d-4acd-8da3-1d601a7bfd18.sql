-- Create enum for court party roles
CREATE TYPE public.court_party_role AS ENUM (
  'audience',
  'judge',
  'steno',
  'public_prosecutor',
  'defence_lawyer',
  'pp_assistant',
  'defence_assistant',
  'accused',
  'victim',
  'victim_family',
  'accused_family',
  'police_staff'
);

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM (
  'pending',
  'in_progress',
  'adjourned',
  'verdict_delivered',
  'closed'
);

-- Create enum for evidence party
CREATE TYPE public.evidence_party AS ENUM (
  'prosecution',
  'defence',
  'court',
  'police'
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  plaintiff TEXT NOT NULL,
  defendant TEXT NOT NULL,
  category TEXT DEFAULT 'Custom Case',
  status public.case_status DEFAULT 'pending',
  user_role public.court_party_role NOT NULL,
  next_hearing_date DATE,
  verdict TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create evidence table for media uploads
CREATE TABLE public.case_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_hash TEXT,
  provided_by public.evidence_party NOT NULL,
  description TEXT,
  ai_analysis TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create hearing sessions table
CREATE TABLE public.hearing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL DEFAULT 1,
  session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transcripts table for chat/voice records
CREATE TABLE public.hearing_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.hearing_sessions(id) ON DELETE CASCADE,
  speaker_role public.court_party_role NOT NULL,
  speaker_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  voice_recording_url TEXT,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create adjournment dates table
CREATE TABLE public.case_adjournments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  requested_by public.court_party_role NOT NULL,
  requested_date DATE NOT NULL,
  reason TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by public.court_party_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create knowledge base table for custom documents
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearing_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_adjournments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for cases
CREATE POLICY "Users can view own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cases" ON public.cases FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for evidence
CREATE POLICY "Users can view case evidence" ON public.case_evidence FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_evidence.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can add case evidence" ON public.case_evidence FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_evidence.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can delete case evidence" ON public.case_evidence FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_evidence.case_id AND cases.user_id = auth.uid()));

-- RLS Policies for hearing sessions
CREATE POLICY "Users can view own hearing sessions" ON public.hearing_sessions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = hearing_sessions.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can create hearing sessions" ON public.hearing_sessions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = hearing_sessions.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can update hearing sessions" ON public.hearing_sessions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = hearing_sessions.case_id AND cases.user_id = auth.uid()));

-- RLS Policies for transcripts
CREATE POLICY "Users can view transcripts" ON public.hearing_transcripts FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.hearing_sessions hs 
    JOIN public.cases c ON c.id = hs.case_id 
    WHERE hs.id = hearing_transcripts.session_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "Users can add transcripts" ON public.hearing_transcripts FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.hearing_sessions hs 
    JOIN public.cases c ON c.id = hs.case_id 
    WHERE hs.id = hearing_transcripts.session_id AND c.user_id = auth.uid()
  ));

-- RLS Policies for adjournments
CREATE POLICY "Users can view adjournments" ON public.case_adjournments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_adjournments.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can create adjournments" ON public.case_adjournments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_adjournments.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can update adjournments" ON public.case_adjournments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_adjournments.case_id AND cases.user_id = auth.uid()));

-- RLS Policies for knowledge base
CREATE POLICY "Users can view own knowledge base" ON public.knowledge_base FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to knowledge base" ON public.knowledge_base FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update knowledge base" ON public.knowledge_base FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from knowledge base" ON public.knowledge_base FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-recordings', 'voice-recordings', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-base', 'knowledge-base', false);

-- Storage policies for evidence bucket
CREATE POLICY "Users can upload evidence" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own evidence" ON storage.objects FOR SELECT 
  USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own evidence" ON storage.objects FOR DELETE 
  USING (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for voice recordings
CREATE POLICY "Users can upload voice recordings" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own voice recordings" ON storage.objects FOR SELECT 
  USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for knowledge base
CREATE POLICY "Users can upload to knowledge base" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own knowledge base files" ON storage.objects FOR SELECT 
  USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete from knowledge base" ON storage.objects FOR DELETE 
  USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);