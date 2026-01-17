-- Create witness requests table
CREATE TABLE public.court_witness_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.court_sessions(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.court_participants(id) ON DELETE CASCADE,
  witness_name VARCHAR NOT NULL,
  witness_description TEXT,
  relevance TEXT NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'summoned', 'denied', 'present', 'testified')),
  judge_response TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  testified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.court_witness_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view witness requests"
ON public.court_witness_requests FOR SELECT
USING (true);

CREATE POLICY "Participants can request witnesses"
ON public.court_witness_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Judge can update witness requests"
ON public.court_witness_requests FOR UPDATE
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_witness_requests;