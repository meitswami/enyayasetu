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
    // Require authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's auth token to respect RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { caseNumber, parties } = await req.json();

    console.log('Checking for duplicate case for user:', user.id, { caseNumber, parties });

    // Check for exact case number match - only within user's own cases (RLS enforced)
    if (caseNumber && typeof caseNumber === 'string' && caseNumber.length <= 100) {
      const { data: exactMatch } = await supabase
        .from('cases')
        .select('id, case_number, title, category, status, created_at')
        .ilike('case_number', `%${caseNumber}%`)
        .limit(5);

      if (exactMatch && exactMatch.length > 0) {
        console.log('Found exact case number match:', exactMatch[0].case_number);
        return new Response(
          JSON.stringify({
            isDuplicate: true,
            matchType: 'exact_case_number',
            matchedCases: exactMatch,
            message: `We found an existing case with number ${exactMatch[0].case_number} in our system.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for party name matches (complainant/accused) - RLS enforced
    const complainant = parties?.complainant;
    const accused = parties?.accused;
    
    if ((complainant && typeof complainant === 'string' && complainant.length <= 200) || 
        (accused && typeof accused === 'string' && accused.length <= 200)) {
      let query = supabase
        .from('cases')
        .select('id, case_number, title, category, status, created_at');

      if (complainant) {
        query = query.or(`plaintiff.ilike.%${complainant}%,defendant.ilike.%${complainant}%`);
      }
      if (accused) {
        query = query.or(`plaintiff.ilike.%${accused}%,defendant.ilike.%${accused}%`);
      }

      const { data: partyMatches } = await query.limit(10);

      if (partyMatches && partyMatches.length > 0) {
        // Filter for strong matches (both plaintiff and defendant match)
        const strongMatches = partyMatches.filter(c => {
          const plaintiffMatch = complainant && 
            (c.title?.toLowerCase().includes(complainant.toLowerCase()));
          const defendantMatch = accused && 
            (c.title?.toLowerCase().includes(accused.toLowerCase()));
          return plaintiffMatch || defendantMatch;
        });

        if (strongMatches.length > 0) {
          console.log('Found party name matches:', strongMatches.length);
          return new Response(
            JSON.stringify({
              isDuplicate: true,
              matchType: 'party_names',
              matchedCases: strongMatches,
              message: `We found ${strongMatches.length} existing case(s) involving similar parties.`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // No duplicates found
    return new Response(
      JSON.stringify({
        isDuplicate: false,
        matchType: null,
        matchedCases: [],
        message: 'No duplicate cases found.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Duplicate check error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, isDuplicate: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
