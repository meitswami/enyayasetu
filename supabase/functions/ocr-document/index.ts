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
    const { imageBase64, mimeType, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing OCR for:', fileName, 'type:', mimeType);

    const systemPrompt = `You are an expert OCR and document analysis system specializing in Indian legal documents.
Your task is to:
1. Extract ALL text from the document image accurately
2. Identify the document type (FIR, SIR, FR, Chargesheet, Court Order, etc.)
3. Extract key details: case number, date, parties involved, allegations, sections invoked
4. Summarize the key facts of the case

Provide output in this JSON format:
{
  "extracted_text": "full OCR text here",
  "document_type": "FIR/SIR/FR/Chargesheet/Other",
  "case_number": "if found",
  "date": "if found",
  "parties": {
    "complainant": "name if found",
    "accused": "name if found"
  },
  "sections_invoked": ["IPC sections if any"],
  "summary": "brief 2-3 sentence summary",
  "key_facts": ["fact 1", "fact 2"]
}`;

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
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: `Please perform OCR and analysis on this ${mimeType.includes('pdf') ? 'PDF document' : 'image'}. Extract all text and identify key legal details.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to process document');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Try to parse as JSON, or return as plain text
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        result = JSON.parse(content);
      }
    } catch {
      result = {
        extracted_text: content,
        document_type: 'Unknown',
        summary: content.substring(0, 200)
      };
    }

    console.log('OCR completed successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('OCR Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
