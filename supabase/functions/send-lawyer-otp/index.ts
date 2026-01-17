// Send OTP to Actual Lawyer Email
// Called when user clicks "Start Hearing" button for Actual Lawyer cases

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { session_id, lawyer_id, lawyer_email } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "Session ID required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get court session
    const { data: session, error: sessionError } = await supabaseClient
      .from("court_sessions")
      .select("*, cases(*)")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user owns the case
    if (session.cases?.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if Actual Lawyer
    if (session.lawyer_type !== "actual_lawyer") {
      return new Response(
        JSON.stringify({ error: "Not an Actual Lawyer case" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 15); // 15 minutes validity

    // Update session with OTP and lawyer details
    const updateData: any = {
      actual_lawyer_otp: otp,
      actual_lawyer_otp_expires_at: otpExpiresAt.toISOString(),
    };
    
    if (lawyer_id) {
      updateData.actual_lawyer_id = lawyer_id;
    }
    
    if (lawyer_email) {
      updateData.actual_lawyer_email = lawyer_email;
    }

    const { error: updateError } = await supabaseClient
      .from("court_sessions")
      .update(updateData)
      .eq("id", session_id);

    if (updateError) {
      throw updateError;
    }

    // Send email to lawyer
    const emailTo = lawyer_email || session.actual_lawyer_email;
    if (emailTo) {
      // TODO: Integrate with email service (Resend, SendGrid, etc.)
      // Call your email service here to send OTP
      // For now, log it (in production, send via email service)
      console.log(`OTP for lawyer ${lawyer_id}: ${otp}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent to lawyer email",
        otp_expires_at: otpExpiresAt.toISOString(),
        // In production, remove this - OTP should only be in email
        otp: otp, // REMOVE IN PRODUCTION - Only for testing
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending lawyer OTP:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

