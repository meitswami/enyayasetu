import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, caseId, mode = 'general' } = await req.json();
    
    // Check for blocked keywords (Requirement 9)
    const blockedKeywords = ["who is guilty", "what is the verdict", "guilty or innocent"];
    if (blockedKeywords.some(kw => query.toLowerCase().includes(kw))) {
      return new Response(JSON.stringify({ 
        answer: "As an AI Case Assistant, I am prohibited from declaring guilt, innocence, or providing verdicts. I can only assist with procedural analysis and case strength assessment.",
        disclaimer: "Not a court, judge, or legal advice."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceUrl = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceUrl);

    // 1. Fetch case details
    const { data: caseData } = await supabaseClient
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    // 2. Fetch Evidence for analysis
    const { data: evidence } = await supabaseClient
      .from('case_evidence')
      .select('*')
      .eq('case_id', caseId);

    // 3. Fetch Milestones for gap analysis
    const { data: milestones } = await supabaseClient
      .from('case_milestones')
      .select('*')
      .eq('case_id', caseId);

    // 4. Simple Keyword Search for RAG context from Legal Knowledge Core
    const keywords = query.split(' ').filter((word: string) => word.length > 3);
    let legalDocs = [];
    if (keywords.length > 0) {
      const { data: docs } = await supabaseClient
        .from('legal_sections')
        .select(`
          *,
          legal_acts (name)
        `)
        .or(keywords.map((kw: string) => `title.ilike.%${kw}%,description.ilike.%${kw}%`).join(','));
      legalDocs = docs || [];
    }

    // 5. System Prompt Construction
    const systemPrompt = `
      You are "Case Assistant AI", a specialized legal process & case strength analysis platform for India.
      Your goal is to provide procedural analysis and skip any judicial decision making.

      CORE PRINCIPLES:
      - This is an assistive analysis, not legal advice or judicial decision.
      - NEVER declare guilt or innocence.
      - NEVER give verdicts.
      - Cite sources for every claim (Acts, Sections, Case Law).
      - Focus on procedural completeness and evidence gaps.

      CASE CONTEXT:
      - Title: ${caseData?.title}
      - Description: ${caseData?.description}
      - State: ${caseData?.state || 'Rajasthan'}
      - Court Level: ${caseData?.court_level || 'Trial'}
      
      CURRENT EVIDENCE:
      ${evidence?.map(e => `- ${e.file_name}: ${e.description} (${e.provided_by})`).join('\n')}

      PROCEDURAL MILESTONES:
      ${milestones?.map(m => `- ${m.milestone_name}: ${m.status ? '✅ Present' : '❌ Missing'}`).join('\n')}

      LEGAL KNOWLEDGE CONTEXT:
      ${JSON.stringify(legalDocs)}

      REPORT FORMAT (STRICT):
      Case Analysis Report:

      Procedural Status:
      - [Milestone Name]: [Status Icon] [Brief Detail]

      Evidence Review:
      - [Point 1]
      - [Point 2]

      Legal Risks:
      - [Risk 1]
      - [Risk 2]

      Suggested Next Steps:
      - [Step 1]
      - [Step 2]

      Sources:
      - [Source 1]
      - [Source 2]

      DISCLAIMER: "This is an assistive analysis, not legal advice or judicial decision."
    `;

    // 6. Call AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp', // Using latest gemini for better RAG
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
      }),
    });

    if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiRes = await response.json();
    const answer = aiRes.choices[0].message.content;

    // 7. Audit Logging (Requirement 7)
    const { error: logError } = await supabaseClient.from('case_assistant_logs').insert({
      user_id: caseData?.user_id,
      case_id: caseId,
      user_input: query,
      retrieved_documents: legalDocs,
      ai_response: answer,
      sources: legalDocs?.map((d: any) => `${d.legal_acts?.name} Section ${d.section_number}`) || [],
    });

    if (logError) console.error('Logging error:', logError);

    return new Response(JSON.stringify({ 
      answer, 
      sources: legalDocs,
      disclaimer: "This is an assistive analysis, not legal advice or judicial decision."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Case Assistant Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
