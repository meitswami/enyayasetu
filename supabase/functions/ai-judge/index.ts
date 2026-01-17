import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const { 
      action,
      caseContext,
      currentSpeaker,
      message,
      handRaise,
      dateRequest,
      evidence,
      witnessRequest,
      language = 'en'
    } = body;

    // Validate action
    const validActions = [
      'start_session', 'respond_to_speech', 'evaluate_hand_raise',
      'evaluate_date_extension', 'analyze_evidence', 'make_decision',
      'adjourn_session', 'evaluate_witness_request'
    ];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message length
    if (message && typeof message === 'string' && message.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';
    const safeContext = typeof caseContext === 'string' ? caseContext.slice(0, 5000) : JSON.stringify(caseContext || {}).slice(0, 5000);
    const safeLang = ['en', 'hi', 'hinglish'].includes(language) ? language : 'en';

    switch (action) {
      case 'start_session':
        systemPrompt = `You are an AI Judge in an Indian court, following Indian Penal Code (IPC), Criminal Procedure Code (CrPC), and relevant Indian laws. 
        
Your role:
- Conduct fair hearings efficiently to clear case backlogs
- Maintain court decorum and order
- Analyze evidence objectively
- Make decisions based on law and facts
- Be strict but fair

Respond in ${safeLang === 'hi' ? 'Hindi' : 'English'}.

Case Context:
${safeContext}

Generate an opening statement to start the court session. Include:
1. Case number and title announcement
2. Parties present acknowledgment
3. Brief case summary
4. Call for prosecution to present their case

Keep it formal and authoritative.`;
        userPrompt = 'Begin the court session.';
        break;

      case 'respond_to_speech':
        systemPrompt = `You are an AI Judge presiding over an Indian court case.

Case Context:
${safeContext}

A participant just spoke. Analyze their statement and respond appropriately as a judge would.

Guidelines:
- If it's relevant testimony, acknowledge and probe further if needed
- If it's irrelevant, redirect to the matter at hand
- If it contains important claims, ask for evidence
- Maintain authority and order
- Be concise but thorough

Respond in ${safeLang === 'hi' ? 'Hindi' : 'English'}.`;
        userPrompt = `${String(currentSpeaker || 'Unknown').slice(0, 100)} said: "${String(message || '').slice(0, 2000)}"

Respond as the judge.`;
        break;

      case 'evaluate_hand_raise':
        systemPrompt = `You are an AI Judge. Someone wants to speak in court.

Case Context:
${safeContext}

Guidelines:
- Allow if the person might have relevant information
- Deny if it seems to delay proceedings unnecessarily
- Ask for brief reason if unclear
- Maintain court order

Respond with a JSON object: { "allowed": boolean, "response": "your response to the person" }`;
        userPrompt = `${String(handRaise?.participantName || 'Unknown').slice(0, 100)} (${String(handRaise?.role || 'unknown').slice(0, 50)}) wants to speak.
Reason: ${String(handRaise?.reason || 'Not specified').slice(0, 500)}

Should they be allowed to speak?`;
        break;

      case 'evaluate_date_extension':
        systemPrompt = `You are an AI Judge evaluating a date extension request.

Case Context:
${safeContext}

CRITICAL MISSION: Your goal is to clear pending case backlogs. Extensions should only be granted for genuine, compelling reasons.

Consider:
1. Validity of the reason
2. Case seriousness (serious cases = stricter)
3. Previous extensions granted
4. Impact on justice delivery
5. Whether the reason is just a delay tactic

Respond with JSON: { "approved": boolean, "decision": "your detailed reasoning", "nextDate": "YYYY-MM-DD if approved" }`;
        userPrompt = `${String(dateRequest?.requesterName || 'Unknown').slice(0, 100)} (${String(dateRequest?.role || 'unknown').slice(0, 50)}) requests extension.
Reason: ${String(dateRequest?.reason || 'Not specified').slice(0, 500)}
${dateRequest?.requestedDate ? `Requested Date: ${String(dateRequest.requestedDate).slice(0, 20)}` : ''}

Evaluate this request strictly. Remember: Our mission is to clear backlogs.`;
        break;

      case 'analyze_evidence':
        systemPrompt = `You are an AI Judge analyzing submitted evidence.

Case Context:
${safeContext}

Analyze the evidence and provide:
1. Relevance to the case
2. Authenticity concerns if any
3. How it affects the case
4. Questions you might ask about it

Respond in ${safeLang === 'hi' ? 'Hindi' : 'English'}.`;
        userPrompt = `Evidence submitted by ${String(evidence?.submitter || 'Unknown').slice(0, 100)}:
File: ${String(evidence?.fileName || 'Unknown').slice(0, 200)}
Type: ${String(evidence?.fileType || 'Unknown').slice(0, 50)}
OCR Text: ${String(evidence?.ocrText || 'Not available').slice(0, 2000)}

Analyze this evidence and respond as the judge would in court.`;
        break;

      case 'make_decision':
        systemPrompt = `You are an AI Judge ready to deliver a decision/verdict.

Case Context:
${safeContext}

Based on all arguments and evidence presented, deliver a fair judgment following Indian law.

Include:
1. Summary of key points from both sides
2. Evidence evaluation
3. Legal basis for decision
4. Your verdict/order
5. Any directions for parties

Be thorough but clear. This is a formal court judgment.

Respond in ${safeLang === 'hi' ? 'Hindi' : 'English'}.`;
        userPrompt = 'Based on the proceedings, deliver your judgment on this case.';
        break;

      case 'adjourn_session':
        systemPrompt = `You are an AI Judge adjourning the court session.

Case Context:
${safeContext}

Provide a formal adjournment statement including:
1. Summary of today's proceedings
2. Pending matters for next hearing
3. Instructions for parties
4. Next hearing date if applicable

Be formal and clear.

Respond in ${safeLang === 'hi' ? 'Hindi' : 'English'}.`;
        userPrompt = 'Adjourn this court session.';
        break;

      case 'evaluate_witness_request':
        systemPrompt = `You are an AI Judge evaluating a witness request.

Case Context:
${safeContext}

Consider:
1. Is the witness relevant to the case?
2. Can this witness provide valuable testimony?
3. Is this a delay tactic?
4. Has similar testimony already been given?

Respond with JSON: { "summoned": boolean, "response": "your detailed reasoning for the decision" }`;
        userPrompt = `${String(witnessRequest?.requesterName || 'Unknown').slice(0, 100)} (${String(witnessRequest?.role || 'unknown').slice(0, 50)}) requests to call witness: ${String(witnessRequest?.witnessName || 'Unknown').slice(0, 100)}
Description: ${String(witnessRequest?.description || 'Not provided').slice(0, 500)}
Relevance: ${String(witnessRequest?.relevance || 'Not specified').slice(0, 500)}

Should this witness be summoned?`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('AI Judge action:', action, 'user:', user.id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    // Parse JSON responses for certain actions
    let parsedResponse = aiResponse;
    if (['evaluate_hand_raise', 'evaluate_date_extension', 'evaluate_witness_request'].includes(action)) {
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('Could not parse JSON response, using raw text');
      }
    }

    // Log AI usage
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        action: `ai_judge_${action}`,
        model_used: 'google/gemini-2.5-flash',
        tokens_input: data.usage?.prompt_tokens || 0,
        tokens_output: data.usage?.completion_tokens || 0,
      });
    } catch (logError) {
      console.error('Failed to log AI usage:', logError);
    }

    return new Response(JSON.stringify({ 
      response: parsedResponse,
      action,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Judge error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
