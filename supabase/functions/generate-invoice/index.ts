// Generate Invoice Edge Function
// Creates digital invoices for payments

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

    const { payment_id, hearing_session_id, case_id } = await req.json();

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .eq("user_id", user.id)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Generate invoice number
    const { data: invoiceNumber } = await supabaseClient.rpc("generate_invoice_number");

    // Build invoice data
    const invoiceData = {
      items: [],
      subtotal: payment.amount,
      tax: 0,
      discount: 0,
      total: payment.amount,
    };

    // Add line items based on payment type
    if (hearing_session_id) {
      const { data: session } = await supabaseClient
        .from("hearing_sessions")
        .select("*, cases(*)")
        .eq("id", hearing_session_id)
        .single();

      if (session) {
        invoiceData.items.push({
          description: `Court Hearing Session - ${session.cases?.title || "Case"}`,
          quantity: 1,
          rate: session.total_fee || 1200,
          amount: session.total_fee || 1200,
        });
      }
    }

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        user_id: user.id,
        payment_id: payment.id,
        amount: payment.amount,
        total_amount: payment.amount,
        status: "generated",
        invoice_data: invoiceData,
      })
      .select()
      .single();

    if (invoiceError) {
      throw invoiceError;
    }

    // Generate PDF (would use a PDF library in production)
    // For now, return invoice data
    // In production, you would:
    // 1. Generate PDF using jspdf or similar
    // 2. Upload to storage
    // 3. Update invoice with pdf_url

    return new Response(
      JSON.stringify({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_data: invoiceData,
        // pdf_url: invoice.pdf_url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

