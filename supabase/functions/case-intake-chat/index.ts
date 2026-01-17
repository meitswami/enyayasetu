import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, caseContext, step } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI legal assistant for eNyayaSetu, a virtual Indian court system. You help users file and understand their cases.

Your role is to guide users through the case intake process in a conversational, empathetic manner.

Current step: ${step}

Guidelines:
- Be polite, empathetic, and professional
- Use simple language, explain legal terms when used
- Ask one question at a time
- Acknowledge user responses before asking next question
- Reference Indian laws, IPC sections, CrPC procedures when relevant
- If user seems distressed, offer reassurance

Case context so far: ${JSON.stringify(caseContext || {})}

Based on the step, guide the conversation:
- "initial": Greet and ask to upload FIR/SIR/FR report
- "document_uploaded": Acknowledge the document, summarize what you understood, ask if they are the person involved or someone else
- "relation_check": If other person, ask about relationship and current status of involved person
- "details": Ask for additional details about the case via voice or text
- "status_check": Ask about current case status and last hearing date
- "processing": Estimate processing time (5-30 mins based on complexity), ask for callback number
- "complete": Confirm all details, thank user, explain next steps

Keep responses concise (under 150 words). Use Hindi words with English when appropriate for Indian context.`;

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
          ...(messages as Message[])
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I apologize, I could not process that. Please try again.';

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Chat Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
