-- Add callback info to cases table
ALTER TABLE public.cases ADD COLUMN callback_number TEXT;
ALTER TABLE public.cases ADD COLUMN processing_eta TIMESTAMPTZ;
ALTER TABLE public.cases ADD COLUMN ai_processing_status TEXT DEFAULT 'pending';

-- Add relation info columns
ALTER TABLE public.cases ADD COLUMN uploaded_by_relation TEXT;
ALTER TABLE public.cases ADD COLUMN involved_person_status TEXT;

-- Create case intake conversations table
CREATE TABLE public.case_intake_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file_upload', 'ocr_result')),
  voice_recording_url TEXT,
  file_url TEXT,
  ocr_extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_intake_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own intake messages" ON public.case_intake_messages 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add intake messages" ON public.case_intake_messages 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create FIR/case reports table
CREATE TABLE public.case_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('fir', 'sir', 'fr', 'chargesheet', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  ocr_text TEXT,
  ai_summary TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view case reports" ON public.case_reports 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_reports.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can add case reports" ON public.case_reports 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_reports.case_id AND cases.user_id = auth.uid()));