import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, caseContext, language = 'en', role = 'judge' } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable API key not configured');
    }

    const languageInstructions: Record<string, string> = {
      en: 'Respond in English.',
      hi: 'Respond in Hindi (Devanagari script).',
      hinglish: 'Respond in Hinglish (mix of Hindi and English, using Roman script).',
    };
    const languageInstruction = languageInstructions[language] || 'Respond in English.';

    const roleContexts: Record<string, string> = {
      judge: 'You are a wise and fair judge in an Indian court. Speak with authority and impartiality.',
      prosecutor: 'You are the Public Prosecutor presenting the case against the defendant. Be formal and assertive.',
      lawyer: 'You are the defense lawyer protecting your client. Be professional and persuasive.',
      accused: 'You are the defendant in this case. Be respectful but maintain your innocence.',
      ai: 'You are a legal AI assistant providing helpful information about the case.',
    };
    const roleContext = roleContexts[role] || 'You are a legal expert.';

    const systemPrompt = `You are part of an E-Courtroom simulation system. ${roleContext}

${languageInstruction}

Case Context: ${caseContext || 'A legal proceeding is in progress.'}

Guidelines:
- Keep responses concise and courtroom-appropriate (2-4 sentences)
- Maintain the formality expected in a court of law
- If asked about legal procedures, provide accurate information
- Stay in character as the specified role
- Be respectful and follow courtroom decorum`;

    console.log(`Court chat request: role=${role}, language=${language}`);

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
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response generated.';

    return new Response(
      JSON.stringify({ response: aiResponse, role }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Court chat error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
