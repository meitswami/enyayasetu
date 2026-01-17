import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: string; text?: string; image_url?: { url: string } }[];
}

interface AIRequestBody {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  // For Ollama-specific options
  useOllama?: boolean;
  ollamaEndpoint?: string;
  ollamaModel?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AIRequestBody = await req.json();
    const {
      messages,
      model = 'google/gemini-2.5-flash',
      temperature = 0.7,
      max_tokens = 2048,
      stream = false,
      useOllama = false,
      ollamaEndpoint,
      ollamaModel = 'llama3.2',
    } = body;

    console.log(`AI Router: useOllama=${useOllama}, model=${useOllama ? ollamaModel : model}`);

    // Route to Ollama if configured
    if (useOllama) {
      const endpoint = ollamaEndpoint || Deno.env.get('OLLAMA_ENDPOINT') || 'http://localhost:11434';
      
      console.log(`Routing to Ollama at: ${endpoint}`);
      
      const ollamaResponse = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaModel,
          messages: messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : 
              m.content.map(c => c.text || '').join('\n'),
          })),
          stream: false,
          options: {
            temperature,
            num_predict: max_tokens,
          },
        }),
      });

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        console.error('Ollama error:', ollamaResponse.status, errorText);
        throw new Error(`Ollama error: ${ollamaResponse.status} - ${errorText}`);
      }

      const ollamaData = await ollamaResponse.json();
      
      // Convert Ollama response to OpenAI-compatible format
      const response = {
        id: `ollama-${Date.now()}`,
        model: ollamaModel,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: ollamaData.message?.content || '',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: ollamaData.prompt_eval_count || 0,
          completion_tokens: ollamaData.eval_count || 0,
          total_tokens: (ollamaData.prompt_eval_count || 0) + (ollamaData.eval_count || 0),
        },
        source: 'ollama',
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route to Lovable AI (default)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Routing to Lovable AI with model: ${model}`);

    const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream,
      }),
    });

    if (!lovableResponse.ok) {
      const errorText = await lovableResponse.text();
      console.error('Lovable AI error:', lovableResponse.status, errorText);
      
      if (lovableResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (lovableResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Lovable AI error: ${lovableResponse.status}`);
    }

    const data = await lovableResponse.json();
    
    // Add source indicator
    data.source = 'lovable';

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Router error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
