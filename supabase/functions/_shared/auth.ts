import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
  supabase: SupabaseClient | null;
}

/**
 * Validates authentication from request headers.
 * Returns the authenticated user and a Supabase client with user context.
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return { user: null, error: 'Unauthorized', supabase: null };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error: 'Invalid token', supabase: null };
  }

  return { user, error: null, supabase };
}

/**
 * Returns an unauthorized response with CORS headers.
 */
export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
