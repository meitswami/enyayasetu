// Payment Webhook Edge Function
// Handles webhook callbacks from Razorpay and PhonePe

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const gateway = req.headers.get("x-gateway") || "razorpay";

    // Verify webhook signature (implement based on gateway)
    // For Razorpay: verify signature using secret
    // For PhonePe: verify X-VERIFY header

    const { payment_id, order_id, status, amount, user_id, metadata } = body;

    if (!payment_id || !order_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("gateway_order_id", order_id)
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

    // Update payment status
    const updateData: any = {
      gateway_transaction_id: payment_id,
      gateway_payment_id: payment_id,
      updated_at: new Date().toISOString(),
    };

    if (status === "success" || status === "completed" || status === "captured") {
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();

      // If it's a wallet top-up, add to wallet
      if (payment.user_id && metadata?.type === "wallet_topup") {
        await supabaseClient.rpc("update_wallet_balance", {
          p_user_id: payment.user_id,
          p_amount: payment.amount,
          p_transaction_type: "wallet_topup",
          p_description: "Wallet top-up via payment gateway",
          p_reference_id: payment.id,
          p_reference_type: "payment",
        });
      }
    } else if (status === "failed" || status === "cancelled") {
      updateData.status = "failed";
      updateData.failure_reason = body.error_description || "Payment failed";
    }

    await supabaseClient
      .from("payments")
      .update(updateData)
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({ success: true, payment_id: payment.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

