-- Knowledge core tables
CREATE TABLE public.legal_acts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_legacy BOOLEAN DEFAULT false, -- True for IPC/CrPC
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.legal_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_id UUID REFERENCES public.legal_acts(id) ON DELETE CASCADE,
    section_number TEXT NOT NULL,
    title TEXT,
    description TEXT,
    ingredients TEXT, -- JSON or TEXT for ingredients of offence
    cognizable BOOLEAN,
    compoundable BOOLEAN,
    punishment_range TEXT,
    limitation_period TEXT,
    court_jurisdiction TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(act_id, section_number)
);

CREATE TABLE public.procedural_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    order_index INTEGER NOT NULL
);

CREATE TABLE public.evidence_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT -- 'Oral', 'Documentary', 'Digital', 'Forensic'
);

CREATE TABLE public.digital_evidence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    description TEXT,
    section_reference TEXT
);

CREATE TABLE public.case_termination_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT
);

-- Case Assistant Logs (Requirement 7)
CREATE TABLE public.case_assistant_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    case_id UUID REFERENCES public.cases(id),
    user_input TEXT,
    retrieved_documents JSONB,
    ai_response TEXT,
    sources JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Case Status/Progress (Step 3: Case Gap Analysis)
CREATE TABLE public.case_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL, -- 'FIR', 'Chargesheet', etc.
    status BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(case_id, milestone_name)
);

-- Add jurisdiction fields to cases table
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Rajasthan';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS court_level TEXT DEFAULT 'Trial';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS jurisdiction_tags TEXT[];

-- RLS for new tables
ALTER TABLE public.legal_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedural_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_evidence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_termination_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_assistant_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to legal knowledge acts" ON public.legal_acts FOR SELECT USING (true);
CREATE POLICY "Allow public read access to legal knowledge sections" ON public.legal_sections FOR SELECT USING (true);
CREATE POLICY "Allow public read access to procedural stages" ON public.procedural_stages FOR SELECT USING (true);
CREATE POLICY "Allow public read access to evidence types" ON public.evidence_types FOR SELECT USING (true);
CREATE POLICY "Allow public read access to digital evidence rules" ON public.digital_evidence_rules FOR SELECT USING (true);
CREATE POLICY "Allow public read access to case termination rules" ON public.case_termination_rules FOR SELECT USING (true);

CREATE POLICY "Users can view own assistant logs" ON public.case_assistant_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assistant logs" ON public.case_assistant_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own case milestones" ON public.case_milestones FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_milestones.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can update own case milestones" ON public.case_milestones FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_milestones.case_id AND cases.user_id = auth.uid()));

-- Insert some base data
INSERT INTO public.legal_acts (name, is_legacy) VALUES 
('IPC', true), 
('BNS', false), 
('CrPC', true), 
('BNSS 2023', false), 
('Bharatiya Sakshya Adhiniyam', false);

INSERT INTO public.procedural_stages (name, description, order_index) VALUES 
('FIR', 'First Information Report', 1),
('Investigation', 'Police Investigation', 2),
('Chargesheet', 'Filing of Chargesheet', 3),
('Cognizance', 'Court taking cognizance', 4),
('Trial', 'Court Trial', 5),
('Appeal', 'Appeal process', 6),
('Review', 'Review petition', 7),
('Curative', 'Curative petition', 8);

INSERT INTO public.evidence_types (name, category) VALUES 
('Oral Evidence', 'Oral'),
('Documentary Evidence', 'Documentary'),
('Digital Evidence', 'Digital'),
('Forensic Evidence', 'Forensic');

INSERT INTO public.digital_evidence_rules (rule_name, description, section_reference) VALUES 
('Hashing', 'Generating a unique digital signature for a file', 'Section 63(4)(c) BSA'),
('Chain of Custody', 'Documenting the chronological sequence of possession', 'Trial Procedure'),
('Section 65B Compliance', 'Certificate required for electronic records (Legacy)', 'Section 65B Indian Evidence Act'),
('CDR Admissibility', 'Call Detail Record admissibility requirements', 'High Court Guidelines');

INSERT INTO public.case_termination_rules (name, description) VALUES 
('Limitation Expiry', 'Case cannot proceed after specified legal time limit'),
('Compounding', 'Legal settlement between parties'),
('Death of Accused', 'Abatement of proceedings'),
('Sanction Refusal', 'Missing government sanction for prosecution of public servant'),
('Jurisdiction Defect', 'Case filed in the wrong court');
