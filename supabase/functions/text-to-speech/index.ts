import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice mapping for different characters and languages
const voiceMap: Record<string, Record<string, string>> = {
  en: {
    judge: 'onwK4e9ZLuTAKqWW03F9', // Daniel - authoritative
    prosecutor: 'cjVigY5qzO86Huf0OWal', // Eric - formal
    lawyer: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - professional
    accused: 'JBFqnCBsd6RMkjVDRZzb', // George - emotional
    clerk: 'EXAVITQu4vr4xnSDxMaL', // Sarah - neutral
    ai: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - helpful
  },
  hi: {
    judge: 'onwK4e9ZLuTAKqWW03F9',
    prosecutor: 'cjVigY5qzO86Huf0OWal',
    lawyer: 'TX3LPaxmHKxFdv7VOQHJ',
    accused: 'JBFqnCBsd6RMkjVDRZzb',
    clerk: 'EXAVITQu4vr4xnSDxMaL',
    ai: 'CwhRBWXzGAHq8TQ4Fs17',
  },
  hinglish: {
    judge: 'onwK4e9ZLuTAKqWW03F9',
    prosecutor: 'cjVigY5qzO86Huf0OWal',
    lawyer: 'TX3LPaxmHKxFdv7VOQHJ',
    accused: 'JBFqnCBsd6RMkjVDRZzb',
    clerk: 'EXAVITQu4vr4xnSDxMaL',
    ai: 'CwhRBWXzGAHq8TQ4Fs17',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, speaker = 'judge', language = 'en', speechRate = 1.0 } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = voiceMap[language]?.[speaker] || voiceMap.en.judge;
    
    console.log(`TTS request: speaker=${speaker}, language=${language}, rate=${speechRate}, voiceId=${voiceId}`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
          speed: speechRate,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(arrayBuffer);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('TTS Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
