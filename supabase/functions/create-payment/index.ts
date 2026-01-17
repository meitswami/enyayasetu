// Create Payment Edge Function
// Handles payment creation for wallet top-up and hearing payments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  amount: number;
  gateway: 'razorpay' | 'phonepe' | 'wallet';
  type: 'wallet_topup' | 'hearing_payment' | 'addon_payment';
  hearing_session_id?: string;
  case_id?: string;
  addon_ids?: string[];
  promo_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Get authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: PaymentRequest = await req.json();
    const { amount, gateway, type, promo_code } = body;

    // Validate amount
    if (!amount || amount < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let finalAmount = amount;
    let discountAmount = 0;
    let promoCodeId = null;

    // Apply promo code if provided
    if (promo_code) {
      const { data: promoData, error: promoError } = await supabaseClient
        .from("promo_codes")
        .select("*")
        .eq("code", promo_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (!promoError && promoData) {
        const now = new Date();
        const validFrom = new Date(promoData.valid_from);
        const validUntil = promoData.valid_until ? new Date(promoData.valid_until) : null;

        if (now >= validFrom && (!validUntil || now <= validUntil)) {
          if (!promoData.max_uses || promoData.used_count < promoData.max_uses) {
            if (amount >= (promoData.min_purchase_amount || 0)) {
              if (promoData.discount_type === "percentage") {
                discountAmount = (amount * promoData.discount_value) / 100;
                if (promoData.max_discount_amount) {
                  discountAmount = Math.min(discountAmount, promoData.max_discount_amount);
                }
              } else {
                discountAmount = promoData.discount_value;
              }
              finalAmount = Math.max(0, amount - discountAmount);
              promoCodeId = promoData.id;
            }
          }
        }
      }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: user.id,
        amount: finalAmount,
        currency: "INR",
        gateway: gateway,
        status: gateway === "wallet" ? "pending" : "pending",
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Handle wallet payment directly
    if (gateway === "wallet") {
      // Check wallet balance
      const { data: wallet, error: walletError } = await supabaseClient
        .from("user_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (walletError || !wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.balance < finalAmount) {
        // Update payment status to failed
        await supabaseClient
          .from("payments")
          .update({ status: "failed", failure_reason: "Insufficient wallet balance" })
          .eq("id", payment.id);

        return new Response(
          JSON.stringify({ error: "Insufficient wallet balance" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Deduct from wallet
      const { error: updateError } = await supabaseClient.rpc("update_wallet_balance", {
        p_user_id: user.id,
        p_amount: -finalAmount,
        p_transaction_type: type === "wallet_topup" ? "wallet_topup" : "hearing_payment",
        p_description: `Payment for ${type}`,
        p_reference_id: payment.id,
        p_reference_type: "payment",
      });

      if (updateError) {
        throw updateError;
      }

      // Update payment status
      await supabaseClient
        .from("payments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      return new Response(
        JSON.stringify({
          payment_id: payment.id,
          status: "completed",
          gateway: "wallet",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For Razorpay/PhonePe, generate order and return payment details
    // In production, you would integrate with actual payment gateway APIs here
    const gatewayOrderId = `ORDER_${Date.now()}_${payment.id.substring(0, 8)}`;

    // Update payment with gateway order ID
    await supabaseClient
      .from("payments")
      .update({
        gateway_order_id: gatewayOrderId,
        status: "processing",
      })
      .eq("id", payment.id);

    // Save promo code usage if applicable
    if (promoCodeId && discountAmount > 0) {
      await supabaseClient
        .from("promo_code_usage")
        .insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
          payment_id: payment.id,
          discount_amount: discountAmount,
        });
    }

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        gateway_order_id: gatewayOrderId,
        amount: finalAmount,
        discount_amount: discountAmount,
        gateway: gateway,
        status: "pending",
        // In production, include gateway-specific payment URL/options
        payment_url: null, // Would be gateway payment URL
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

