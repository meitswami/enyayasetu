-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'summon', 'approval', 'status_change')),
  related_case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  related_session_id UUID REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create identity verification requests table
CREATE TABLE public.identity_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID,
  full_name VARCHAR NOT NULL,
  father_name VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  relation_to_case VARCHAR NOT NULL CHECK (relation_to_case IN ('victim', 'accused', 'victim_family', 'accused_family', 'witness', 'legal_representative')),
  id_document_type VARCHAR NOT NULL CHECK (id_document_type IN ('aadhar', 'driving_license', 'passport')),
  id_document_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  face_match_percentage DECIMAL(5,2),
  verification_status VARCHAR DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  intent VARCHAR NOT NULL CHECK (intent IN ('know_more', 'add_info')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own verifications"
ON public.identity_verifications FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create verifications"
ON public.identity_verifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update verifications"
ON public.identity_verifications FOR UPDATE
USING (is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.identity_verifications;

-- Create AI usage log table for admin dashboard
CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id UUID REFERENCES public.court_sessions(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  model_used VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can view
CREATE POLICY "Admins can view AI usage logs"
ON public.ai_usage_logs FOR SELECT
USING (is_admin());

CREATE POLICY "System can create AI usage logs"
ON public.ai_usage_logs FOR INSERT
WITH CHECK (true);